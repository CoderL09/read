import AdmZip, { type IZipEntry } from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs";
import path from "node:path";

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

async function readPdfFile(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);

  console.log(`[pdf] Parsing ${(buffer.length / 1024 / 1024).toFixed(1)} MB PDF...`);

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: uint8 } as any);
  const result = await parser.getText();

  console.log(`[pdf] Extracted ${result.text.length} characters`);
  return result.text;
}

function readEpubFile(filePath: string): string {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  const htmlEntries = entries.filter(
    (entry) =>
      !entry.isDirectory &&
      (entry.entryName.endsWith(".html") ||
        entry.entryName.endsWith(".xhtml") ||
        entry.entryName.endsWith(".htm")),
  );

  if (htmlEntries.length === 0) {
    throw new Error("No HTML/XHTML content found in EPUB — file may be corrupted");
  }

  // The OPF spine defines reading order. Sorting ZIP paths alphabetically can
  // silently scramble books whose chapter files are not zero-padded.
  const orderedEntries = getEpubSpineEntries(zip) ?? htmlEntries;

  return orderedEntries
    .map((entry) => {
      const html = entry.getData().toString("utf-8");
      return stripHtml(html);
    })
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getEpubSpineEntries(zip: AdmZip): IZipEntry[] | null {
  try {
    const entries = zip.getEntries();
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      attributeNamePrefix: "@_",
      isArray: (name) => ["item", "itemref", "reference", "rootfile"].includes(name),
    });

    const container = entries.find((entry) => entry.entryName === "META-INF/container.xml");
    if (!container) return null;

    const containerData = parser.parse(container.getData().toString("utf-8"));
    const rootfile = containerData?.container?.rootfiles?.rootfile?.[0];
    const opfPath = rootfile?.["@_full-path"];
    if (!opfPath) return null;

    const opfEntry = entries.find((entry) => entry.entryName === opfPath);
    if (!opfEntry) return null;

    const opf = parser.parse(opfEntry.getData().toString("utf-8"))?.package;
    const manifestItems: any[] = opf?.manifest?.item ?? [];
    const spineItems: any[] = opf?.spine?.itemref ?? [];
    if (manifestItems.length === 0 || spineItems.length === 0) return null;

    const excludedHrefs = new Set<string>();
    const guideReferences: any[] = opf?.guide?.reference ?? [];
    for (const reference of guideReferences) {
      if (["toc", "cover"].includes(String(reference?.["@_type"] ?? "").toLowerCase())) {
        excludedHrefs.add(String(reference?.["@_href"] ?? "").split("#")[0]);
      }
    }

    const opfDir = path.posix.dirname(opfPath);
    const manifestById = new Map(manifestItems.map((item) => [item?.["@_id"], item]));
    const ordered = spineItems.flatMap((spineItem) => {
      const item = manifestById.get(spineItem?.["@_idref"]);
      const href = String(item?.["@_href"] ?? "").split("#")[0];
      const properties = String(item?.["@_properties"] ?? "").split(/\s+/);
      const mediaType = String(item?.["@_media-type"] ?? "");

      if (!href || !mediaType.includes("html") || properties.includes("nav") || excludedHrefs.has(href)) {
        return [];
      }

      const entryName = path.posix.normalize(opfDir === "." ? href : `${opfDir}/${href}`);
      const entry = entries.find((candidate) => candidate.entryName === entryName);
      return entry ? [entry] : [];
    });

    return ordered.length > 0 ? ordered : null;
  } catch (error) {
    console.warn("[epub] Could not read OPF spine; using archive order:", error);
    return null;
  }
}

function stripHtml(html: string): string {
  let text = html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|aside|header|footer|h[1-6]|li|blockquote|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Remove standalone page numbers (common EPUB artifact: "<p class='pagenum'>42</p>" → "42")
  text = text.replace(/^\d{1,4}$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

const READERS: Record<string, (filePath: string) => string | Promise<string>> = {
  ".txt": readTextFile,
  ".pdf": readPdfFile,
  ".epub": readEpubFile,
};

export async function extractText(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();

  const reader = READERS[ext];
  if (!reader) {
    throw new Error(`Unsupported file format: ${ext}. Supported: .txt, .pdf, .epub`);
  }

  const raw = await Promise.race([
    reader(absolutePath),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error(`PDF parsing timed out after 120 seconds — the file may be too large or corrupted`)), 120_000),
    ),
  ]);

  if (!raw || raw.trim().length === 0) {
    throw new Error("Extracted text is empty — the file may be corrupted or unreadable");
  }

  return raw;
}
