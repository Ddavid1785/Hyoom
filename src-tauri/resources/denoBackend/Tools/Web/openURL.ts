export const description = "Opens a specific URL in the system's default web browser.";

// - You must provide a valid, fully formed URL (e.g., https://www.google.com).
// - CRITICAL: Do NOT guess specific URLs (like YouTube video IDs or deep links). 
// - If the user asks for a specific resource (video, article), use 'webSearch' to find the actual URL first.

export interface OpenURLParams {
  url: string;
}

export interface OpenURLResult {
  success: boolean;
  error?: string;
}

export async function openURL(params: OpenURLParams): Promise<OpenURLResult> {
  try {
    let command = "";
    let args: string[] = [];

    switch (Deno.build.os) {
      case "windows":
        command = "cmd";
        args = ["/c", "start", "", params.url];
        break;
      case "darwin":
        command = "open";
        args = [params.url];
        break;
      case "linux":
        command = "xdg-open";
        args = [params.url];
        break;
      default:
        throw new Error(`Unsupported OS: ${Deno.build.os}`);
    }

    const cmd = new Deno.Command(command, {
      args: args,
      stdout: "null",
      stderr: "piped"
    });

    const output = await cmd.output();

    if (!output.success) {
      const errText = new TextDecoder().decode(output.stderr);
      throw new Error(`Command failed: ${errText}`);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}