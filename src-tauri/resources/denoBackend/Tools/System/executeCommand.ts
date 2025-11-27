export const description = "Executes a shell command on the system (PowerShell). Use this for PING, network checks, ipconfig, or running CLI tools.";

// - WARNING: Use with extreme caution. Only run commands you understand.
// - Useful for system tasks not covered by other tools (e.g., 'ipconfig', 'ping', 'whoami').
// - Commands run in a PowerShell instance.

export interface ExecuteCommandParams {
  command: string;
}

export interface ExecuteCommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function executeCommand(params: ExecuteCommandParams): Promise<ExecuteCommandResult> {
  try {
    const cmd = new Deno.Command("powershell", {
      args: ["-Command", params.command],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await cmd.output();
    const outStr = new TextDecoder().decode(output.stdout);
    const errStr = new TextDecoder().decode(output.stderr);

    if (output.code !== 0) {
      return { success: false, output: outStr, error: errStr || "Command failed" };
    }

    return { success: true, output: outStr.trim() };
  } catch (error: any) {
    return { success: false, output: "", error: error.message };
  }
}