// deno-lint-ignore-file no-explicit-any
export const description = "Simulates global keyboard input to type text or press key combinations";

// - CAUTION: Sends keys to the CURRENTLY FOCUSED window.
// - Usage: Combine with 'openApp' to launch something, wait a bit, then type.
// - Special Keys: "{ENTER}", "{TAB}", "{ESC}", "{BS}" (backspace).
// - Modifiers: "^" (Ctrl), "%" (Alt), "+" (Shift).
// - To Paste: Use "^v".
// - To Select All: Use "^a".
// - To Save: Use "^s".

export interface TypeTextParams {
  text: string;
}

export interface TypeTextResult {
  success: boolean;
  error?: string;
}

export async function typeText(params: TypeTextParams): Promise<TypeTextResult> {
  try {
    // Escape single quotes for PowerShell string wrapping
    const safeText = params.text.replace(/'/g, "''");

    // PowerShell script using .NET SendWait
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait('${safeText}')
    `;

    const cmd = new Deno.Command("powershell", {
      args: ["-Command", psScript],
      stdout: "piped",
      stderr: "piped"
    });

    const output = await cmd.output();
    
    if (output.code !== 0) {
      return { success: false, error: new TextDecoder().decode(output.stderr) };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}