// deno-lint-ignore-file no-explicit-any
export const description = "Permanently deletes a specified file";

// - DANGER: This action is irreversible.
// - You must have the specific, absolute path.
// - If the user says "delete everything" or is vague, ASK FOR CONFIRMATION or clarification of the specific target first.
// - Do not use this to delete directories; use a removeDir tool if available, or ask the user.

export interface DeleteFileParams {
  path: string;
}

export interface DeleteFileResult {
  success: boolean;
  error?: string;
}

export async function deleteFile(params: DeleteFileParams): Promise<DeleteFileResult> {
  try {
    await Deno.remove(params.path);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}