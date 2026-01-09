import * as vscode from "vscode";
import { generateTestCommand } from "./commands/generateTest";
import { checkOllamaCommand } from "./commands/checkOllama";
import { activateProCommand } from "./commands/activatePro";

export function activate(context: vscode.ExtensionContext) {
  console.log("LocalUnit activated.");

  context.subscriptions.push(
    vscode.commands.registerCommand("localunit.generateTest", () =>
      generateTestCommand(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("localunit.checkOllama", () =>
      checkOllamaCommand()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("localunit.activatePro", () =>
      activateProCommand(context)
    )
  );
}

export function deactivate() {}
