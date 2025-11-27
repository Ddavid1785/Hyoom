export const description = "Lists currently running processes";

// - Use this to find a PID before using killApp.
// - 'filter': Optional string to filter results by name (e.g., 'chrome').
// - Returns a simplified list of Name and PID.

export interface ListProcessesParams {
  filter?: string;
}

export interface ProcessEntry {
  name: string;
  pid: string;
}

export interface ListProcessesResult {
  success: boolean;
  processes?: ProcessEntry[];
  error?: string;
}

export async function listProcesses(params: ListProcessesParams): Promise<ListProcessesResult> {
  try {
    // tasklist /FO CSV returns: "Image Name","PID","Session Name","Session#","Mem Usage"
    const cmd = new Deno.Command("tasklist", {
      args: ["/FO", "CSV", "/NH"], // /NH = No Header
      stdout: "piped",
    });

    const output = await cmd.output();
    const outStr = new TextDecoder().decode(output.stdout);
    
    let processes: ProcessEntry[] = outStr
      .split("\r\n")
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Simple CSV parse: split by "," then strip quotes
        const parts = line.split('","');
        if (parts.length < 2) return null;
        return {
          name: parts[0].replace(/^"/, ""), // remove leading quote
          pid: parts[1]
        };
      })
      .filter((p): p is ProcessEntry => p !== null);

    if (params.filter) {
      const lowerFilter = params.filter.toLowerCase();
      processes = processes.filter(p => p.name.toLowerCase().includes(lowerFilter));
    }

    // Limit to top 50 to avoid token overload if no filter
    if (!params.filter && processes.length > 50) {
      processes = processes.slice(0, 50);
    }

    return { success: true, processes };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}