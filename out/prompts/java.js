"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.javaPrompt = javaPrompt;
function javaPrompt(args) {
    const system = "You are a senior Java QA engineer. You write JUnit 5 tests (and Mockito if needed). Output ONLY code.";
    const classHint = args.symbolName ? `Target class/method name hint: ${args.symbolName}` : "Target name unknown.";
    const prompt = `
Write a JUnit 5 test class for the given Java code.

Rules:
- Use JUnit 5 (org.junit.jupiter.*).
- Use Mockito ONLY if external dependencies/collaborators are present.
- Cover normal cases + edge cases + error handling (exceptions).
- Do NOT include explanations or markdown fences. Output ONLY the Java test code.

${classHint}

Code:
${args.code}
`.trim();
    return { system, prompt };
}
