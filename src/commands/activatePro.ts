import * as vscode from "vscode";

/**
 * IMPORTANT SECURITY NOTE:
 * Do NOT ship Lemon Squeezy private API keys in a VS Code extension.
 * A common pattern: call your own backend (localunit.app) to verify the key, then store a signed token locally.
 */
async function verifyLicenseViaBackend(_key: string): Promise<boolean> {
  // TODO: Replace with your server endpoint, e.g. https://localunit.app/api/verify
  // Keep this as a stub in the MVP.
  await new Promise((r) => setTimeout(r, 250));
  return true;
}

export async function activateProCommand(context: vscode.ExtensionContext): Promise<void> {
  const key = await vscode.window.showInputBox({
    title: "Activate LocalUnit Pro",
    prompt: "Enter your license key",
    password: true,
    ignoreFocusOut: true
  });

  if (!key) return;

  try {
    const ok = await verifyLicenseViaBackend(key);
    if (!ok) {
      vscode.window.showErrorMessage("LocalUnit Pro: Invalid license key.");
      return;
    }

    await context.globalState.update("localunit.pro.activated", true);
    await context.globalState.update("localunit.pro.licenseKey", key);

    vscode.window.showInformationMessage("LocalUnit Pro activated!");
  } catch (e: any) {
    vscode.window.showErrorMessage(`Activation failed: ${e?.message ?? String(e)}`);
  }
}

export function isProActivated(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>("localunit.pro.activated") === true;
}
