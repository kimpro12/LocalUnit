export function extractFirstFencedCodeBlock(text: string): string {
  // Extract first ```lang ... ``` block; fallback to raw text.
  const fence = /```[\w+-]*\s*([\s\S]*?)```/m;
  const m = text.match(fence);
  if (m && m[1]) return m[1].trim();
  return text.trim();
}

export function stripTrailingWhitespaceLines(text: string): string {
  return text
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""))
    .join("\n")
    .trim() + "\n";
}
