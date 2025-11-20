// deno-lint-ignore-file no-explicit-any
export const description = "Creates a directory at a specified path"

export interface CreateDirParams {
  path: string;
}

export interface CreateDirResult {
  success: boolean;
  path?: string;
  error?: string;
}

export async function createDir(params: CreateDirParams): Promise<CreateDirResult> {
  try {
    await Deno.mkdir(params.path, { recursive: true });
    return { success: true, path: params.path };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}