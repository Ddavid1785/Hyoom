export const description = "Checks if a file or directory exists at the specified path";

// - Use this to verify existence before creating or deleting.
// - Returns 'exists': boolean, and 'isDirectory': boolean.

export interface CheckPathParams {
  path: string;
}

export interface CheckPathResult {
  exists: boolean;
  isDirectory?: boolean;
  isFile?: boolean;
  error?: string;
}

export async function checkPath(params: CheckPathParams): Promise<CheckPathResult> {
  try {
    const stat = await Deno.stat(params.path);
    return { 
      exists: true, 
      isDirectory: stat.isDirectory, 
      isFile: stat.isFile 
    };
  } catch (error: any) {
    if (error instanceof Deno.errors.NotFound) {
      return { exists: false };
    }
    return { exists: false, error: error.message };
  }
}