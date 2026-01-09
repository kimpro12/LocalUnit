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
exports.generateTestCommand = generateTestCommand;
const vscode = __importStar(require("vscode"));
const config_1 = require("../config");
const language_1 = require("../utils/language");
const codeParser_1 = require("../utils/codeParser");
const prompts_1 = require("../prompts");
const markdown_1 = require("../utils/markdown");
const ollama_1 = require("../ai/ollama");
async function generateTestCommand(context) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const sel = editor.selection;
    const selectedText = editor.document.getText(sel);
    if (!selectedText.trim()) {
        vscode.window.showErrorMessage("LocalUnit: Please select code to test (highlight a function/class).");
        return;
    }
    const lang = (0, language_1.toSupportedLanguage)(editor.document.languageId);
    if (!lang) {
        vscode.window.showErrorMessage(`LocalUnit: Unsupported languageId "${editor.document.languageId}".`);
        return;
    }
    const cfg = (0, config_1.getConfig)();
    const ctx = await (0, codeParser_1.buildCodeContext)(editor);
    const { system, prompt } = (0, prompts_1.buildPrompt)({
        lang,
        code: selectedText,
        moduleName: ctx.moduleName,
        symbolName: ctx.symbolName,
        pythonUseParametrize: cfg.pythonUseParametrize,
        imports: ctx.imports
    });
    const channel = vscode.window.createOutputChannel("LocalUnit");
    channel.show(true);
    channel.clear();
    const abort = new AbortController();
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "LocalUnit: Generating unit test with Ollama…",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => abort.abort());
        try {
            progress.report({ message: `Model: ${cfg.model}` });
            let raw = "";
            if (cfg.stream) {
                raw = await (0, ollama_1.ollamaGenerateStreaming)({
                    endpoint: cfg.apiEndpoint,
                    model: cfg.model,
                    system,
                    prompt,
                    options: {
                        temperature: cfg.temperature,
                        num_predict: cfg.maxTokens
                    },
                    signal: abort.signal,
                    onToken: (t) => channel.append(t)
                });
            }
            else {
                raw = await (0, ollama_1.ollamaGenerateNonStreaming)({
                    endpoint: cfg.apiEndpoint,
                    model: cfg.model,
                    system,
                    prompt,
                    options: {
                        temperature: cfg.temperature,
                        num_predict: cfg.maxTokens
                    },
                    signal: abort.signal
                });
                channel.append(raw);
            }
            // sanitize output
            const codeOnly = (0, markdown_1.stripTrailingWhitespaceLines)((0, markdown_1.extractFirstFencedCodeBlock)(raw));
            const filename = (0, codeParser_1.suggestTestFileName)(lang, ctx);
            const viewColumn = cfg.openResultInSplit ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
            let shown;
            let appended = false;
            const wsFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if (wsFolder) {
                const testFileUri = vscode.Uri.joinPath(wsFolder.uri, filename);
                try {
                    const existingDoc = await vscode.workspace.openTextDocument(testFileUri);
                    const existingEditor = await vscode.window.showTextDocument(existingDoc, { viewColumn, preview: false });
                    const lastLine = existingDoc.lineCount;
                    await existingEditor.edit((editBuilder) => {
                        editBuilder.insert(new vscode.Position(lastLine, 0), `\n\n${codeOnly}`);
                    });
                    appended = true;
                    shown = existingEditor;
                }
                catch {
                    // Fall through to create a new document.
                }
            }
            if (!appended) {
                const doc = await vscode.workspace.openTextDocument({
                    content: codeOnly,
                    language: (0, language_1.testFileLanguageId)(lang)
                });
                shown = await vscode.window.showTextDocument(doc, { viewColumn, preview: false });
            }
            // Set a nice tab title hint
            // (VS Code does not let extensions rename untitled docs directly; we at least show a hint.)
            const statusMessage = appended
                ? `LocalUnit: Appended to ${filename}`
                : `LocalUnit: Generated ${filename}`;
            vscode.window.setStatusBarMessage(statusMessage, 5000);
            // Optional: also copy to clipboard
            await vscode.env.clipboard.writeText(codeOnly);
            // Reveal output channel end
            channel.appendLine("\n\n# --- LocalUnit done ---");
            channel.appendLine(`# Suggested filename: ${filename}`);
            channel.appendLine("# (Test code copied to clipboard)");
            // keep types happy
            void shown;
            void context;
        }
        catch (e) {
            if (abort.signal.aborted) {
                vscode.window.showWarningMessage("LocalUnit: Cancelled.");
                return;
            }
            const selection = await vscode.window.showErrorMessage("LocalUnit: Không kết nối được Ollama. Bạn đã bật nó chưa?", "Xem hướng dẫn cài đặt", "Thử lại");
            if (selection === "Xem hướng dẫn cài đặt") {
                await vscode.env.openExternal(vscode.Uri.parse("https://github.com/ollama/ollama"));
            }
            if (selection === "Thử lại") {
                await generateTestCommand(context);
            }
        }
    });
}
