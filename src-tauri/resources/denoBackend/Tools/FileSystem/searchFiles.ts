export const description = "Recursively searches for files matching a specific name pattern within a directory";

// - Use this when the user is looking for a file but doesn't know the exact path.
// - 'rootPath': The starting directory for the search (e.g., user's home or project folder).
// - 'query': The partial name or extension to look for (e.g., ".ts" or "config").
// - This operation can be slow on large directories; prefer specific root paths over generic ones like root "/".

export interface SearchFilesParams {
  rootPath: string;
  query: string;
}

export interface SearchFilesResult {
  success: boolean;
  matches?: string[];
  error?: string;
}

export async function searchFiles(params: SearchFilesParams): Promise<SearchFilesResult> {
  const matches: string[] = [];
  
  async function walk(currentPath: string) {
    try {
      for await (const entry of Deno.readDir(currentPath)) {
        const fullPath = `${currentPath}/${entry.name}`;
        
        if (entry.isDirectory) {
          await walk(fullPath);
        } else if (entry.isFile && entry.name.includes(params.query)) {
          matches.push(fullPath);
        }
      }
    } catch (_err) {
      // Ignore permission errors or unreadable folders during search
    }
  }

  try {
    await walk(params.rootPath);
    return { success: true, matches };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}