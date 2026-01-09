import { SupportedLanguage } from "../utils/language";
import { pythonPrompt } from "./python";
import { javaPrompt } from "./java";
import { javascriptPrompt } from "./javascript";

export function buildPrompt(args: {
  lang: SupportedLanguage;
  code: string;
  moduleName: string;
  symbolName: string | null;
  pythonUseParametrize: boolean;
  imports: string;
}): { system: string; prompt: string } {
  if (args.lang === "python") {
    return pythonPrompt({
      code: args.code,
      moduleName: args.moduleName,
      useParametrize: args.pythonUseParametrize,
      imports: args.imports
    });
  }

  if (args.lang === "java") {
    return javaPrompt({ code: args.code, symbolName: args.symbolName });
  }

  if (args.lang === "javascript") {
    return javascriptPrompt({ code: args.code, moduleName: args.moduleName, isTypeScript: false });
  }

  return javascriptPrompt({ code: args.code, moduleName: args.moduleName, isTypeScript: true });
}
