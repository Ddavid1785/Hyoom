export const description = "Writes text to the system clipboard";

export interface SetClipboardParams {
  content: string;
}

export interface SetClipboardResult {
  success: boolean;
  error?: string;
}

export async function setClipboard(params: SetClipboardParams): Promise<SetClipboardResult> {
  try {
    // Escape single quotes for PowerShell
    const escapedContent = params.content.replace(/'/g, "''");
    
    const cmd = new Deno.Command("powershell", {
      args: ["-Command", `Set-Clipboard -Value '${escapedContent}'`],
    });

    await cmd.output();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}