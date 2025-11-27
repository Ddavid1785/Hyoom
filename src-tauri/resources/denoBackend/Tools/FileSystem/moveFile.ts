// deno-lint-ignore-file no-explicit-any
export const description = "Moves or renames a file OR directory from a source path to a destination path"; 

// - Requires absolute paths for both 'from' and 'to'.
// - Use this for Renaming: from "path/old.txt" to "path/new.txt".
// - Use this for Moving: from "path/old.txt" to "other_path/old.txt".
// - If the destination folder does not exist, this operation may fail.

export interface MoveFileParams {
  fromPath: string;
  toPath: string;
}

export interface MoveFileResult {
  success: boolean;
  error?: string;
}

export async function moveFile(params: MoveFileParams): Promise<MoveFileResult> {
  try {
    await Deno.rename(params.fromPath, params.toPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}