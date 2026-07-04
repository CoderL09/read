import AdmZip from "adm-zip";
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

  htmlEntries.sort((a, b) => a.entryName.localeCompare(b.entryName));

  return htmlEntries
    .map((entry) => {
      const html = entry.getData().toString("utf-8");
      return stripHtml(html);
    })
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
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
