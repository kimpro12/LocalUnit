export type SupportedLanguage = "python" | "java" | "javascript" | "typescript";

export function toSupportedLanguage(languageId: string): SupportedLanguage | null {
  const id = languageId.toLowerCase();

  if (id === "python") return "python";
  if (id === "java") return "java";
  if (id === "javascript") return "javascript";
  if (id === "typescript") return "typescript";

  // Some VS Code variants:
  if (id === "javascriptreact") return "javascript";
  if (id === "typescriptreact") return "typescript";

  return null;
}

export function testFileLanguageId(lang: SupportedLanguage): string {
  // This is the languageId VS Code uses for syntax highlighting of the generated doc
  if (lang === "python") return "python";
  if (lang === "java") return "java";
  if (lang === "javascript") return "javascript";
  return "typescript";
}

export function testFileExtension(lang: SupportedLanguage): string {
  if (lang === "python") return "py";
  if (lang === "java") return "java";
  if (lang === "javascript") return "test.js";
  return "test.ts";
}
