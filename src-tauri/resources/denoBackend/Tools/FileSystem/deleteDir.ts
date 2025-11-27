export const description = "Deletes a directory and optionally all its contents";

// - Use this specifically for removing FOLDERS.
// - If 'recursive' is true, it deletes the folder and everything inside it.
// - If 'recursive' is false (default), it only works if the folder is empty.

export interface DeleteDirParams {
  path: string;
  recursive?: boolean;
}

export interface DeleteDirResult {
  success: boolean;
  error?: string;
}

export async function deleteDir(params: DeleteDirParams): Promise<DeleteDirResult> {
  try {
    await Deno.remove(params.path, { recursive: params.recursive ?? true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}