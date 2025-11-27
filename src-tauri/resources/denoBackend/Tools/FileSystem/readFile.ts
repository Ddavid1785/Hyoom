export const description = "Reads the text content of a specific file";

// - You must obtain the full absolute path from the user or infer it from highly specific context (e.g., "read package.json on my desktop").
// - If the file name is generic (e.g., "notes.txt") and the location is unknown, ask for the directory.
// - This tool assumes the file is text-based (UTF-8). Do not use this for binary files like images.

export interface ReadFileParams {
  path: string;
}

export interface ReadFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

export async function readFile(params: ReadFileParams): Promise<ReadFileResult> {
  try {
    const content = await Deno.readTextFile(params.path);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}