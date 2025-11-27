export const description = "Terminates a running process by Name or PID";

// - Prefer using PID if you have it (use listProcesses first).
// - If using name, it might kill ALL instances of that app.
// - 'target': Either a PID (number/string) or an Image Name (e.g. 'notepad.exe').

export interface KillAppParams {
  target: string;
}

export interface KillAppResult {
  success: boolean;
  error?: string;
}

export async function killApp(params: KillAppParams): Promise<KillAppResult> {
  try {
    const isPid = /^\d+$/.test(params.target);
    const args = isPid 
      ? ["/F", "/PID", params.target] 
      : ["/F", "/IM", params.target];

    const cmd = new Deno.Command("taskkill", {
      args: args,
      stdout: "piped",
      stderr: "piped"
    });

    const output = await cmd.output();
    
    if (output.code !== 0) {
      const errStr = new TextDecoder().decode(output.stderr);
      return { success: false, error: errStr || "Failed to kill process" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}