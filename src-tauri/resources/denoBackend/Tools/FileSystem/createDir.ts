// deno-lint-ignore-file no-explicit-any
export const description = "Creates a directory at a specified path"

// - You may infer the full absolute path ONLY if the user provides enough unambiguous information such as the username, operating system, or explicit location like "on my desktop".
// - If the user's operating system and username are known to you, you may construct the correct absolute path when they refer to common locations such as "Desktop", "Documents", or "Downloads".
// - If the location is unclear or ambiguous (e.g. the user provides only a folder name), you must ask for clarification.
// - Never invent a path when required context is missing.

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