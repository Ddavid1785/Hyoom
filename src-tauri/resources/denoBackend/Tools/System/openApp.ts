export const description = "Launches an application or opens a file with the default program";

// - 'target': Can be an app name (e.g., 'notepad', 'calc') or a full file path.
// - This tool starts the process and returns immediately (does not wait for it to close).

export interface OpenAppParams {
  target: string;
}

export interface OpenAppResult {
  success: boolean;
  error?: string;
}

export async function openApp(params: OpenAppParams): Promise<OpenAppResult> {
  try {
    // on Windows, 'start' command handles both apps and file associations
    const cmd = new Deno.Command("cmd", {
      args: ["/c", "start", "", params.target],
    });
    
    await cmd.spawn(); // spawn() runs it in background/detached
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}