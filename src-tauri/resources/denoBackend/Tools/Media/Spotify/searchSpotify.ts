import { getFilePath } from "../../../filePath.ts";
import { AppSettings } from "../../../shared/sharedTypes.ts";
import { performWebSearch } from "../../../WebSearch/searchRouter.ts";

export const description = "Searches for Spotify tracks, artists, or albums and returns their Names and Spotify URIs.";

// - Use this to find the correct content on Spotify.
// - The 'uri' field in the result is what you need for the 'playSpotify' tool.

export interface SearchSpotifyParams {
  query: string;
}

export interface SearchSpotifyResult {
  success: boolean;
  matches?: Array<{ title: string; uri: string; description: string }>;
  error?: string;
}

export async function searchSpotify(params: SearchSpotifyParams): Promise<SearchSpotifyResult> {
  try {
    const settingsPath = getFilePath();
    const raw = await Deno.readTextFile(`${settingsPath}/settings.json`);
    const settings: AppSettings = JSON.parse(raw);

    // Search specifically for track/artist/album pages
    const results = await performWebSearch(`site:open.spotify.com ${params.query}`, settings);

    const matches = results.map((res) => {
      let uri = "";
      // Regex to convert https://open.spotify.com/track/123 -> spotify:track:123
      const typeMatch = res.url.match(/(track|artist|album|playlist)\/([a-zA-Z0-9]+)/);
      
      if (typeMatch) {
        uri = `spotify:${typeMatch[1]}:${typeMatch[2]}`;
      } else {
        // Fallback: if we can't parse a direct link, give a search URI
        uri = `spotify:search:${encodeURIComponent(params.query)}`;
      }

      return {
        title: res.title,
        description: res.description,
        uri: uri 
      };
    });

    return {
      success: true,
      matches: matches.slice(0, 5)
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}