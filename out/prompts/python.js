"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonPrompt = pythonPrompt;
function pythonPrompt(args) {
    const system = "You are a senior Python QA engineer. You write high-quality pytest unit tests. Output ONLY code.";
    const paramRule = args.useParametrize
        ? "Prefer @pytest.mark.parametrize when there are multiple cases."
        : "Parametrize is optional; focus on correctness and coverage.";
    const prompt = `
Write a comprehensive pytest test file for the given Python code.

CONTEXT (Libraries used in source file):
\`\`\`python
${args.imports}
\`\`\`

Target Code to Test:
\`\`\`python
${args.code}
\`\`\`

Rules:
1. Use pytest.
2. ${paramRule}
3. IMPORTANCE: If the code uses external libraries (requests, boto3, etc.) visible in Context, YOU MUST MOCK THEM using 'unittest.mock' or 'pytest-mock'. Do not let tests make real network calls.
4. Cover: normal cases + edge cases (None, empty strings/lists, negative values).
5. Output ONLY the Python code. No markdown text or conversational text.
6. FOR FLOATS: Always use 'assert result == pytest.approx(expected)' to avoid floating-point issues.

INSTRUCTIONS:
1. ANALYZE the code logic.
2. THINK about 3-5 distinct test cases (Happy path, Edge cases, Error cases).
3. WRITE the test code directly.

One-shot example of a Good Unit Test (show expected values in comments first):
\`\`\`python
def total_with_tax(amount, tax_rate):
    return amount + (amount * tax_rate)

import pytest
from pricing import total_with_tax

def test_total_with_tax():
    # amount=100, tax_rate=0.1 -> expected=110.0
    assert total_with_tax(100, 0.1) == 110.0
    # amount=0, tax_rate=0.2 -> expected=0.0
    assert total_with_tax(0, 0.2) == 0.0
\`\`\`

Import rule:
- Assume the code under test is in a module named: ${args.moduleName}
- Import symbols from that module (e.g., "from ${args.moduleName} import ...").
`.trim();
    return { system, prompt };
}
