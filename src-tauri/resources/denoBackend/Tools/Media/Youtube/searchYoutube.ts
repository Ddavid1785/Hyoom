import { getFilePath } from "../../../filePath.ts";
import { AppSettings } from "../../../shared/sharedTypes.ts";
import { performWebSearch } from "../../../WebSearch/searchRouter.ts";

export const description = "Searches YouTube or YouTube Music and returns a list of video titles and URLs. Does NOT play them.";

// - Use this first to find the correct video/song.
// - Analyze the results, pick the best match (avoiding reaction videos if user wants music), then use 'playYoutube'.
// - Service: 'video' (default) or 'music'.

export interface SearchYoutubeParams {
  query: string;
  service?: "video" | "music";
}

export interface SearchYoutubeResult {
  success: boolean;
  results?: Array<{ title: string; url: string; description: string }>;
  error?: string;
}

export async function searchYoutube(params: SearchYoutubeParams): Promise<SearchYoutubeResult> {
  try {
    const settingsPath = getFilePath();
    const raw = await Deno.readTextFile(`${settingsPath}/settings.json`);
    const settings: AppSettings = JSON.parse(raw);

    const isMusic = params.service === "music";
    const siteFilter = isMusic ? "site:music.youtube.com/watch" : "site:youtube.com/watch";
    
    const results = await performWebSearch(`${siteFilter} ${params.query}`, settings);

    const validResults = results.filter(r => r.url.includes("watch?v="));

    return {
      success: true,
      results: validResults.slice(0, 5) 
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}