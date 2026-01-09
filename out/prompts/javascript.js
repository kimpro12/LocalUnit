"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.javascriptPrompt = javascriptPrompt;
function javascriptPrompt(args) {
    const system = "You are a senior JavaScript/TypeScript QA engineer. You write robust unit tests. Output ONLY code.";
    const framework = args.isTypeScript ? "Vitest" : "Jest";
    const extHint = args.isTypeScript ? "TypeScript" : "JavaScript";
    const prompt = `
Write a comprehensive ${framework} test file for the given ${extHint} code.

Target Code to Test:
\`\`\`${args.isTypeScript ? "typescript" : "javascript"}
${args.code}
\`\`\`

Rules:
1. Use ${framework}.
2. IMPORTANCE: Mock external dependencies/API calls. Do not make real network requests.
3. Cover: Happy paths + Edge cases (null, undefined, empty strings).
4. Output ONLY the test code. No markdown explanation.

INSTRUCTIONS:
1. Analyze the logic step-by-step.
2. Determine expected outputs in comments BEFORE writing assertions.
3. Write the test code.

One-shot Example (Good Test Style):
\`\`\`javascript
// Function: function add(a, b) { return a + b; }

// Test Code:
describe('add', () => {
  it('should return correct sum for positive numbers', () => {
    // Input: 2, 3 -> Expected: 5
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    // Input: -1, -1 -> Expected: -2
    expect(add(-1, -1)).toBe(-2);
  });
});
\`\`\`

Import rule:
- Import symbols from "./${args.moduleName}".
`.trim();
    return { system, prompt };
}
