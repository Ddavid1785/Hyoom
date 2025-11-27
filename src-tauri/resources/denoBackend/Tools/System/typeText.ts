// Tools/System/typeText.ts

// deno-lint-ignore-file no-explicit-any
// 🔴 UPDATED DESCRIPTION TO CATCH 'PASTE' SEARCHES
export const description = "Simulates global keyboard presses to TYPE text, PASTE content (Ctrl+V), or press shortcuts in the active window.";

// - CAUTION: Sends keys to the CURRENTLY FOCUSED window.
// - Use this when the user asks to "type", "paste", "write", or "enter" text into an app.
// - Usage sequence: openApp -> wait -> typeText.
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
    const safeText = params.text.replace(/'/g, "''");

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