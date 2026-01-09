import * as path from "path";
import * as vscode from "vscode";
import { SupportedLanguage } from "./language";

export type CodeContext = {
  moduleName: string;
  symbolName: string | null;
  workspaceFolder: string | null;
  imports: string;
};

export async function buildCodeContext(
  editor: vscode.TextEditor
): Promise<CodeContext> {
  const file = editor.document.fileName;
  const moduleName = guessModuleName(file);

  const symbolName = await getSymbolName(editor);

  const ws = vscode.workspace.getWorkspaceFolder(editor.document.uri);

  const fullText = editor.document.getText();
  const lines = fullText.split("\n").slice(0, 50);
  const lang = editor.document.languageId;

  const importLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (lang === "python") return trimmed.startsWith("import") || trimmed.startsWith("from");
    if (lang === "java") return trimmed.startsWith("import") || trimmed.startsWith("package");
    if (lang === "javascript" || lang === "typescript" || lang === "typescriptreact") {
      return trimmed.startsWith("import") || trimmed.startsWith("require");
    }
    return false;
  });

  return {
    moduleName,
    symbolName,
    workspaceFolder: ws?.uri.fsPath ?? null,
    imports: importLines.join("\n")
  };
}

export function suggestTestFileName(lang: SupportedLanguage, ctx: CodeContext): string {
  if (lang === "python") return `test_${ctx.moduleName}.py`;
  if (lang === "java") return `${ctx.symbolName || "Generated"}Test.java`;
  return `${ctx.moduleName}.test.${lang === "javascript" ? "js" : "ts"}`;
}

function guessModuleName(filePath: string): string {
  const base = path.basename(filePath);
  return base.replace(/\.(py|ts|js|java)$/i, "") || "module";
}

async function getSymbolName(editor: vscode.TextEditor): Promise<string | null> {
  const position = editor.selection.active;
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    "vscode.executeDocumentSymbolProvider",
    editor.document.uri
  );

  if (!symbols) return null;

  function findSymbol(nodes: vscode.DocumentSymbol[]): vscode.DocumentSymbol | undefined {
    for (const symbol of nodes) {
      if (symbol.range.contains(position)) {
        if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
          return symbol;
        }
        if (symbol.children) {
          const child = findSymbol(symbol.children);
          if (child) return child;
        }
      }
    }
    return undefined;
  }

  const found = findSymbol(symbols);
  return found ? found.name : null;
}
