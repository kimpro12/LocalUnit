import * as vscode from "vscode";
import { getConfig } from "../config";
import { toSupportedLanguage, testFileLanguageId } from "../utils/language";
import { buildCodeContext, suggestTestFileName } from "../utils/codeParser";
import { buildPrompt } from "../prompts";
import { extractFirstFencedCodeBlock, stripTrailingWhitespaceLines } from "../utils/markdown";
import { ollamaGenerateNonStreaming, ollamaGenerateStreaming } from "../ai/ollama";

export async function generateTestCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const sel = editor.selection;
  const selectedText = editor.document.getText(sel);
  if (!selectedText.trim()) {
    vscode.window.showErrorMessage("LocalUnit: Please select code to test (highlight a function/class).");
    return;
  }

  const lang = toSupportedLanguage(editor.document.languageId);
  if (!lang) {
    vscode.window.showErrorMessage(`LocalUnit: Unsupported languageId "${editor.document.languageId}".`);
    return;
  }

  const cfg = getConfig();
  const ctx = await buildCodeContext(editor);

  const { system, prompt } = buildPrompt({
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

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "LocalUnit: Generating unit test with Ollama…",
      cancellable: true
    },
    async (progress, token) => {
      token.onCancellationRequested(() => abort.abort());

      try {
        progress.report({ message: `Model: ${cfg.model}` });

        let raw = "";

        if (cfg.stream) {
          raw = await ollamaGenerateStreaming({
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
        } else {
          raw = await ollamaGenerateNonStreaming({
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
        const codeOnly = stripTrailingWhitespaceLines(extractFirstFencedCodeBlock(raw));
        const filename = suggestTestFileName(lang, ctx);
        const viewColumn = cfg.openResultInSplit ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
        let shown: vscode.TextEditor | undefined;
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
          } catch {
            // Fall through to create a new document.
          }
        }

        if (!appended) {
          const doc = await vscode.workspace.openTextDocument({
            content: codeOnly,
            language: testFileLanguageId(lang)
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
      } catch (e: any) {
        if (abort.signal.aborted) {
          vscode.window.showWarningMessage("LocalUnit: Cancelled.");
          return;
        }
        const selection = await vscode.window.showErrorMessage(
          "LocalUnit: Không kết nối được Ollama. Bạn đã bật nó chưa?",
          "Xem hướng dẫn cài đặt",
          "Thử lại"
        );
        if (selection === "Xem hướng dẫn cài đặt") {
          await vscode.env.openExternal(vscode.Uri.parse("https://github.com/ollama/ollama"));
        }
        if (selection === "Thử lại") {
          await generateTestCommand(context);
        }
      }
    }
  );
}
