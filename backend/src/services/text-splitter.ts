const SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "。", "？", "！", " "];

const CHAPTER_RE = /(?:^|\n)\s*(?:(?:Chapter|Ch\.)\s*(?:1|One|I)\b|(?:Part|Book)\s*(?:1|One|I)\b|Prologue\b|Introduction\b|(?:1|One)\s*(?=\n|$)|第\s*(?:1|一|壹)\s*[章节回卷部篇]|序章|序言|楔子|引子|正文)\s*/im;

export function trimToFirstChapter(text: string): string {
  const match = CHAPTER_RE.exec(text);
  if (match) {
    const start = match.index + (match[0].startsWith("\n") ? 1 : 0);
    const trimmed = text.slice(start).trim();
    if (trimmed.length < text.length * 0.05) return text;
    console.log(`[trim] Skipped ${text.length - trimmed.length} preamble chars, keeping ${trimmed.length}`);
    return trimmed;
  }
  console.log("[trim] No chapter marker found — keeping full text");
  return text;
}

function splitOnSeparator(text: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let index = 0;

  while ((index = text.indexOf(separator, start)) >= 0) {
    const chunk = text.slice(start, index + separator.length);
    if (chunk.trim()) parts.push(chunk);
    start = index + separator.length;
  }

  const remaining = text.slice(start);
  if (remaining.trim()) parts.push(remaining.trim());

  return parts;
}

const SENTENCE_END_RE = /[.!?。！？]$/;

export function ensureSentenceBoundaries(chunks: string[]): string[] {
  const fixed: string[] = [];
  let carry = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = (carry + chunks[i]).trim();
    carry = "";

    if (!chunk) continue;

    if (SENTENCE_END_RE.test(chunk)) {
      fixed.push(chunk);
      continue;
    }

    const lastEnd = Math.max(
      chunk.lastIndexOf(". "),
      chunk.lastIndexOf("? "),
      chunk.lastIndexOf("! "),
      chunk.lastIndexOf("。"),
      chunk.lastIndexOf("？"),
      chunk.lastIndexOf("！"),
    );

    if (lastEnd === -1) {
      fixed.push(chunk);
      continue;
    }

    const complete = chunk.slice(0, lastEnd + 1);
    const leftover = chunk.slice(lastEnd + 1).trim();

    if (complete.trim()) fixed.push(complete.trim());

    if (leftover.length < 60) {
      carry = leftover + " ";
    } else {
      fixed.push(leftover);
    }
  }

  if (carry.trim()) fixed.push(carry.trim());

  return fixed;
}

function mergeSplits(splits: string[], separator: string, chunkSize: number): string[] {
  const merged: string[] = [];
  let accumulator = "";

  for (const split of splits) {
    const candidate = accumulator ? `${accumulator}${separator}${split}` : split;
    if (candidate.length <= chunkSize) {
      accumulator = candidate;
    } else {
      if (accumulator) merged.push(accumulator.trim());
      accumulator = split;
    }
  }

  if (accumulator) merged.push(accumulator.trim());
  return merged;
}

export function chunkText(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  let splits = [text];

  for (const separator of SEPARATORS) {
    const newSplits: string[] = [];
    for (const piece of splits) {
      if (piece.length <= chunkSize) {
        newSplits.push(piece);
      } else {
        newSplits.push(...splitOnSeparator(piece, separator));
      }
    }
    splits = newSplits;
  }

  const merged = mergeSplits(splits, " ", chunkSize);
  const safe = ensureSentenceBoundaries(merged);

  if (chunkOverlap > 0) {
    const overlapped: string[] = [];
    for (let i = 0; i < safe.length; i++) {
      if (i === 0) {
        overlapped.push(safe[i]);
        continue;
      }
      const prevEnd = safe[i - 1].slice(-chunkOverlap);
      overlapped.push(prevEnd + safe[i]);
    }
    return overlapped;
  }

  return safe;
}

const CHAPTER_PATTERNS = [
  /(?:^|\n)\s*(?:Chapter|CHAPTER|Ch\.)\s+(?:\d+|[IVXLCDM]+)\b/gim,
  /(?:^|\n)\s*第\s*(?:\d+|[一二三四五六七八九十百千万]+)\s*章/gm,
  /(?:^|\n)\s*(?:Part|PART|Book|BOOK)\s+(?:\d+|[IVXLCDM]+)\b/gim,
];

export function splitByChapters(text: string): string[] {
  const positions: number[] = [];

  for (const pattern of CHAPTER_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const lineStart = text.lastIndexOf("\n", match.index);
      positions.push(lineStart >= 0 ? lineStart + 1 : 0);
    }
  }

  if (positions.length <= 1) {
    return text.trim() ? [text.trim()] : [];
  }

  const unique = [...new Set(positions)].sort((a, b) => a - b);

  const chapters: string[] = [];
  for (let i = 0; i < unique.length; i++) {
    const start = unique[i];
    const end = i + 1 < unique.length ? unique[i + 1] : text.length;
    const content = text.slice(start, end).trim();
    if (content.length > 100) {
      chapters.push(content);
    }
  }

  if (chapters.length === 0) return text.trim() ? [text.trim()] : [];
  return chapters;
}
