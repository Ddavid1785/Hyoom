import { getFilePath } from "../../filePath.ts";
import { AppSettings } from "../../shared/sharedTypes.ts";
import { performWebSearch } from "../../WebSearch/searchRouter.ts";

export const description = "Performs a live web search using the user's configured provider (Brave or Google) and returns a list of results.";

// - Use this to find up-to-date information, documentation, or solutions that you don't have in your internal knowledge base.
// - The 'query' should be specific.

export interface WebSearchParams {
  query: string;
}

export interface WebSearchResult {
  success: boolean;
  resultsCount?: number;
  results?: Array<{ title: string; url: string; description: string }>;
  error?: string;
}

export async function webSearch(params: WebSearchParams): Promise<WebSearchResult> {
  try {
    // We need to read the settings to know which provider and key to use
    const settingsPath = getFilePath(); 
    const raw = await Deno.readTextFile(`${settingsPath}/settings.json`);
    const settings: AppSettings = JSON.parse(raw);

    const results = await performWebSearch(params.query, settings);

    return {
      success: true,
      resultsCount: results.length,
      results: results
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}