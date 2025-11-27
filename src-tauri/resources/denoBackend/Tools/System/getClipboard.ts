export const description = "Reads the current text content of the system clipboard";

export interface GetClipboardResult {
  success: boolean;
  content?: string;
  error?: string;
}

export async function getClipboard(): Promise<GetClipboardResult> {
  try {
    // PowerShell is the most reliable way on Windows without external binaries
    const cmd = new Deno.Command("powershell", {
      args: ["-Command", "Get-Clipboard"],
      stdout: "piped",
    });

    const output = await cmd.output();
    const content = new TextDecoder().decode(output.stdout).trim();

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}