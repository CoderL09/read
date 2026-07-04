import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs";
import path from "node:path";
import { saveCoverSvg, copyCoverImage } from "./cover-generator.js";

type BookMeta = {
  title: string;
  author: string;
  wordCount: number;
  totalChapters: number;
  coverUrl: string;
};

type RawEpubMeta = {
  title: string;
  author: string;
  wordCount: number;
  totalChapters: number;
  coverBuffer: Buffer | null;
  coverMime: string | null;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  isArray: (name) => ["item", "itemref", "navPoint"].includes(name),
});

function resolveDcText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === "string") return v;
      if (typeof v === "object" && v && "#text" in (v as Record<string, unknown>))
        return (v as Record<string, string>)["#text"];
      if (typeof v === "object" && v)
        return resolveDcText(Object.values(v as Record<string, unknown>)[0]);
    }
    return "";
  }
  if (typeof value === "object" && value) {
    const obj = value as Record<string, unknown>;
    if (obj["#text"]) return String(obj["#text"]);
    return resolveDcText(Object.values(obj)[0]);
  }
  return String(value);
}

function extractEpubMeta(filePath: string): RawEpubMeta {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const containerEntry = entries.find((e) => e.entryName === "META-INF/container.xml");
  if (!containerEntry) throw new Error("EPUB missing META-INF/container.xml");

  const containerXml = containerEntry.getData().toString("utf-8");
  const containerParsed = xmlParser.parse(containerXml);
  const opfPath =
    containerParsed?.container?.rootfiles?.rootfile?.["@_full-path"] ?? "";

  const rootDir = path.dirname(opfPath);
  const opfEntry = entries.find((e) => e.entryName === opfPath);
  if (!opfEntry) throw new Error(`EPUB missing OPF: ${opfPath}`);

  const opfXml = opfEntry.getData().toString("utf-8");
  const opf = xmlParser.parse(opfXml);
  const metadata = opf?.package?.metadata ?? {};
  const manifest = opf?.package?.manifest ?? {};
  const spine = opf?.package?.spine ?? {};

  let title = resolveDcText(metadata.title);
  let author = resolveDcText(metadata.creator);

  let totalChapters = 0;
  const ncxId = spine["@_toc"];
  if (ncxId) {
    const manifestItems: any[] = Array.isArray(manifest.item) ? manifest.item : [manifest.item];
    const ncxItem = manifestItems.find((item: any) => item["@_id"] === ncxId);
    if (ncxItem) {
      const ncxHref = ncxItem["@_href"];
      const ncxFullPath = rootDir ? `${rootDir}/${ncxHref}` : ncxHref;
      const ncxEntry = entries.find((e) => e.entryName === ncxFullPath);
      if (ncxEntry) {
        const ncxXml = ncxEntry.getData().toString("utf-8");
        const ncxParsed = xmlParser.parse(ncxXml);
        const navPoints = ncxParsed?.ncx?.navMap?.navPoint ?? [];
        totalChapters = Array.isArray(navPoints) ? navPoints.length : 0;
      }
    }
  }

  if (totalChapters === 0) {
    const spineItems = Array.isArray(spine.itemref) ? spine.itemref : spine.itemref ? [spine.itemref] : [];
    totalChapters = spineItems.length;
  }

  let coverBuffer: Buffer | null = null;
  let coverMime: string | null = null;
  try {
    const manifestItems: any[] = Array.isArray(manifest.item) ? manifest.item : [manifest.item];

    let coverImageId = "";
    for (const item of manifestItems) {
      const props = item?.["@_properties"] ?? "";
      if (props === "cover-image") {
        coverImageId = item["@_id"];
        break;
      }
    }
    if (!coverImageId) {
      const metaArr: any[] = Array.isArray(metadata.meta) ? metadata.meta : metadata.meta ? [metadata.meta] : [];
      for (const m of metaArr) {
        if (m?.["@_name"] === "cover") {
          coverImageId = m["@_content"];
          break;
        }
      }
    }

    if (coverImageId) {
      const coverItem = manifestItems.find((item: any) => item["@_id"] === coverImageId);
      if (coverItem) {
        const coverHref = coverItem["@_href"];
        const coverFullPath = rootDir ? `${rootDir}/${coverHref}` : coverHref;
        const normalized = coverFullPath.replace(/^\.\//, "");
        const coverEntry =
          entries.find((e) => e.entryName === coverFullPath) ??
          entries.find((e) => e.entryName === normalized);
        if (coverEntry) {
          coverBuffer = coverEntry.getData();
          coverMime = coverItem["@_media-type"] ?? "image/jpeg";
        }
      }
    }
  } catch {
    console.warn(`[meta] EPUB cover extraction failed — falling back to generated cover`);
  }

  let wordCount = 0;
  const htmlEntries = entries.filter(
    (e) =>
      !e.isDirectory &&
      (e.entryName.endsWith(".html") || e.entryName.endsWith(".xhtml") || e.entryName.endsWith(".htm")),
  );
  for (const entry of htmlEntries) {
    const html = entry.getData().toString("utf-8");
    const stripped = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    wordCount += stripped ? stripped.split(/\s+/).length : 0;
  }

  title = title || path.basename(filePath, path.extname(filePath));
  author = author || "Unknown Author";

  return { title, author, wordCount, totalChapters, coverBuffer, coverMime };
}

async function extractPdfMeta(filePath: string): Promise<Pick<BookMeta, "wordCount">> {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: uint8 } as any);
  const result = await parser.getText();

  const wordCount = result.text.trim() ? result.text.trim().split(/\s+/).length : 0;
  return { wordCount };
}

function extractTxtMeta(filePath: string): Pick<BookMeta, "wordCount" | "totalChapters"> {
  const text = fs.readFileSync(filePath, "utf-8");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const chapterPatterns = [
    /(?:^|\n)\s*(?:Chapter|CHAPTER|Ch\.)\s+(\d+|[IVXLCDM]+)/gm,
    /(?:^|\n)\s*第\s*(\d+|[零〇一二三四五六七八九十百千万两壹贰叁肆伍陆柒捌玖拾]+)\s*[章节回卷部篇]/gm,
    /(?:^|\n)\s*(?:Part|PART|Book|BOOK)\s+(\d+|[IVXLCDM]+)/gm,
  ];

  const found = new Set<string>();
  for (const pattern of chapterPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      found.add(match[1]);
    }
  }

  return { wordCount, totalChapters: found.size };
}

export async function extractMetadata(filePath: string, bookId: string): Promise<BookMeta> {
  const ext = path.extname(filePath).toLowerCase();
  const fallbackTitle = path.basename(filePath, ext);

  if (ext === ".epub") {
    const raw = extractEpubMeta(filePath);
    let coverUrl = "";
    if (raw.coverBuffer && raw.coverMime) {
      coverUrl = copyCoverImage(bookId, raw.coverBuffer, raw.coverMime);
    } else {
      coverUrl = saveCoverSvg(bookId, raw.title || fallbackTitle, raw.author);
    }
    return {
      title: raw.title || fallbackTitle,
      author: raw.author,
      wordCount: raw.wordCount,
      totalChapters: raw.totalChapters,
      coverUrl,
    };
  }

  if (ext === ".pdf") {
    const pdfMeta = await extractPdfMeta(filePath);
    const coverUrl = saveCoverSvg(bookId, fallbackTitle, "Unknown Author");
    return {
      title: fallbackTitle,
      author: "Unknown Author",
      wordCount: pdfMeta.wordCount,
      totalChapters: 0,
      coverUrl,
    };
  }

  if (ext === ".txt") {
    const txtMeta = extractTxtMeta(filePath);
    const coverUrl = saveCoverSvg(bookId, fallbackTitle, "Unknown Author");
    return {
      title: fallbackTitle,
      author: "Unknown Author",
      wordCount: txtMeta.wordCount,
      totalChapters: txtMeta.totalChapters,
      coverUrl,
    };
  }

  throw new Error(`Unsupported format: ${ext}`);
}
