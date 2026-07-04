import fs from "node:fs";
import path from "node:path";

const COVERS_DIR = path.resolve("public/uploads/covers");

if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const gradients = [
  ["#1a1a2e", "#16213e", "#0f3460"],
  ["#0f0c29", "#302b63", "#24243e"],
  ["#1b1b2f", "#1f4068", "#206a5d"],
  ["#232526", "#414345", "#6b6b6b"],
  ["#0d1b2a", "#1b263b", "#415a77"],
];

export function generateCoverSvg(title: string, author: string): string {
  const [c1, c2, c3] = gradients[Math.floor(Math.random() * gradients.length)];
  const escapedTitle = escapeXml(title);
  const escapedAuthor = escapeXml(author);
  const titleLines = wrapLines(title, 18);
  const yStart = 240 - (titleLines.length - 1) * 22;

  const titleElements = titleLines
    .map(
      (line, i) =>
        `<text x="400" y="${yStart + i * 44}" text-anchor="middle" font-family="Georgia, 'Playfair Display', serif" font-size="32" font-weight="bold" fill="#f1eadf" letter-spacing="2">${escapeXml(line)}</text>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d79b79" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#87c9a0" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1200" fill="url(#bg)"/>
  <rect x="0" y="0" width="800" height="1200" fill="url(#accent)"/>
  <circle cx="400" cy="600" r="350" fill="none" stroke="rgba(241,234,223,0.04)" stroke-width="1"/>
  <circle cx="400" cy="600" r="420" fill="none" stroke="rgba(241,234,223,0.03)" stroke-width="1"/>
  <text x="400" y="180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" fill="#d79b79" letter-spacing="8">READQUEST</text>
  ${titleElements}
  <text x="400" y="${yStart + titleLines.length * 44 + 30}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" fill="rgba(241,234,223,0.5)">${escapedAuthor}</text>
  <rect x="300" y="${yStart + titleLines.length * 44 + 55}" width="200" height="2" fill="rgba(241,234,223,0.15)"/>
  <text x="400" y="1120" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" fill="rgba(241,234,223,0.2)">open to begin your quest</text>
</svg>`;
}

export function saveCoverSvg(bookId: string, title: string, author: string): string {
  const svg = generateCoverSvg(title, author);
  const filename = `${bookId}.svg`;
  const filePath = path.join(COVERS_DIR, filename);
  fs.writeFileSync(filePath, svg, "utf-8");
  return `/uploads/covers/${filename}`;
}

export function copyCoverImage(bookId: string, imageBuffer: Buffer, mimeType: string): string {
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("gif") ? "gif" : "jpg";
  const filename = `${bookId}.${ext}`;
  const filePath = path.join(COVERS_DIR, filename);
  fs.writeFileSync(filePath, imageBuffer);
  return `/uploads/covers/${filename}`;
}
