// deno-lint-ignore-file no-explicit-any
export const description = "Lists all files and directories within a specified path";

// - You must infer or request the absolute path of the directory to list.
// - Use this tool when the user asks "what is in this folder?" or "show me my files".
// - The output will distinguish between files and directories.

export interface ListDirParams {
  path: string;
}

export interface DirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface ListDirResult {
  success: boolean;
  entries?: DirEntry[];
  error?: string;
}

export async function listDir(params: ListDirParams): Promise<ListDirResult> {
  try {
    const entries: DirEntry[] = [];
    for await (const entry of Deno.readDir(params.path)) {
      entries.push({
        name: entry.name,
        isDirectory: entry.isDirectory,
        isFile: entry.isFile,
      });
    }
    return { success: true, entries };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}