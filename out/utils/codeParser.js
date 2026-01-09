"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCodeContext = buildCodeContext;
exports.suggestTestFileName = suggestTestFileName;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
async function buildCodeContext(editor) {
    const file = editor.document.fileName;
    const moduleName = guessModuleName(file);
    const symbolName = await getSymbolName(editor);
    const ws = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    const fullText = editor.document.getText();
    const lines = fullText.split("\n").slice(0, 50);
    const lang = editor.document.languageId;
    const importLines = lines.filter((line) => {
        const trimmed = line.trim();
        if (lang === "python")
            return trimmed.startsWith("import") || trimmed.startsWith("from");
        if (lang === "java")
            return trimmed.startsWith("import") || trimmed.startsWith("package");
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
function suggestTestFileName(lang, ctx) {
    if (lang === "python")
        return `test_${ctx.moduleName}.py`;
    if (lang === "java")
        return `${ctx.symbolName || "Generated"}Test.java`;
    return `${ctx.moduleName}.test.${lang === "javascript" ? "js" : "ts"}`;
}
function guessModuleName(filePath) {
    const base = path.basename(filePath);
    return base.replace(/\.(py|ts|js|java)$/i, "") || "module";
}
async function getSymbolName(editor) {
    const position = editor.selection.active;
    const symbols = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", editor.document.uri);
    if (!symbols)
        return null;
    function findSymbol(nodes) {
        for (const symbol of nodes) {
            if (symbol.range.contains(position)) {
                if (symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Method) {
                    return symbol;
                }
                if (symbol.children) {
                    const child = findSymbol(symbol.children);
                    if (child)
                        return child;
                }
            }
        }
        return undefined;
    }
    const found = findSymbol(symbols);
    return found ? found.name : null;
}
