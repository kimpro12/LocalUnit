import * as vscode from "vscode";

export type LocalUnitConfig = {
  apiEndpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  openResultInSplit: boolean;
  pythonUseParametrize: boolean;
};

export function getConfig(): LocalUnitConfig {
  const cfg = vscode.workspace.getConfiguration("localunit");

  return {
    apiEndpoint: cfg.get<string>("apiEndpoint") ?? "http://localhost:11434",
    model: cfg.get<string>("model") ?? "llama3",
    temperature: cfg.get<number>("temperature") ?? 0.2,
    maxTokens: cfg.get<number>("maxTokens") ?? 600,
    stream: cfg.get<boolean>("stream") ?? true,
    openResultInSplit: cfg.get<boolean>("openResultInSplit") ?? true,
    pythonUseParametrize: cfg.get<boolean>("python.useParametrize") ?? true
  };
}
