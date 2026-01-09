import * as vscode from "vscode";
import { getConfig } from "../config";
import { ollamaGetVersion } from "../ai/ollama";

export async function checkOllamaCommand(): Promise<void> {
  const cfg = getConfig();

  try {
    const version = await ollamaGetVersion(cfg.apiEndpoint);
    vscode.window.showInformationMessage(`LocalUnit: Ollama OK (version ${version}) at ${cfg.apiEndpoint}`);
  } catch (e: any) {
    const selection = await vscode.window.showErrorMessage(
      `LocalUnit: Cannot reach Ollama at ${cfg.apiEndpoint}. Is it running?`,
      "How to Setup?",
      "Retry"
    );
    if (selection === "How to Setup?") {
      await vscode.env.openExternal(vscode.Uri.parse("https://github.com/ollama/ollama"));
    }
    if (selection === "Retry") {
      await checkOllamaCommand();
    }
  }
}
