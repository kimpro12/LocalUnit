"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFirstFencedCodeBlock = extractFirstFencedCodeBlock;
exports.stripTrailingWhitespaceLines = stripTrailingWhitespaceLines;
function extractFirstFencedCodeBlock(text) {
    // Extract first ```lang ... ``` block; fallback to raw text.
    const fence = /```[\w+-]*\s*([\s\S]*?)```/m;
    const m = text.match(fence);
    if (m && m[1])
        return m[1].trim();
    return text.trim();
}
function stripTrailingWhitespaceLines(text) {
    return text
        .split("\n")
        .map((l) => l.replace(/\s+$/g, ""))
        .join("\n")
        .trim() + "\n";
}
