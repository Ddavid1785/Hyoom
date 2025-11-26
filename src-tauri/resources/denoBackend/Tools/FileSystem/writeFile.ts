// deno-lint-ignore-file no-explicit-any
export const description = "Writes text data to a file, either creating a new one or overwriting/appending to an existing one";

// - Requires a full absolute path. Do not invent paths.
// - If the user asks to "update" or "add to" a file, set 'append' to true.
// - If the user asks to "create" or "overwrite" a file, set 'append' to false (default).
// - If the content is complex code, ensure it is properly stringified before passing it here.

export interface WriteFileParams {
  path: string;
  content: string;
  append?: boolean;
}

export interface WriteFileResult {
  success: boolean;
  path?: string;
  error?: string;
}

export async function writeFile(params: WriteFileParams): Promise<WriteFileResult> {
  try {
    await Deno.writeTextFile(params.path, params.content, { append: params.append ?? false });
    return { success: true, path: params.path };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}