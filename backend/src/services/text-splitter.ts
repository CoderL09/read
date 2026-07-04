const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

function splitOnSeparator(text: string, separator: string): string[] {
  if (separator === "") return [...text];

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
    if (separator === "") continue;

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

  if (chunkOverlap > 0) {
    const overlapped: string[] = [];
    for (let i = 0; i < merged.length; i++) {
      if (i === 0) {
        overlapped.push(merged[i]);
        continue;
      }
      const prevEnd = merged[i - 1].slice(-chunkOverlap);
      overlapped.push(prevEnd + merged[i]);
    }
    return overlapped;
  }

  return merged;
}
