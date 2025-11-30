import { SearchResult } from "./types.ts";
import { searchBrave } from "./providers/brave.ts";
import { searchGoogle } from "./providers/google.ts";
import { AppSettings } from "../shared/sharedTypes.ts";

export async function performWebSearch(query: string, settings: AppSettings): Promise<SearchResult[]> {
  const provider = settings.activeSearchProvider;

  if (!provider) {
    throw new Error("No search provider selected in settings.");
  }

  console.log(`🔎 Performing web search via [${provider}] for: "${query}"`);

  if (provider === "brave") {
    const key = settings.searchKeys.brave;
    if (!key) throw new Error("CONFIGURATION ERROR: Brave API Key is missing in App Settings.");
    return await searchBrave(query, key);
  }

  if (provider === "google") {
    const config = settings.searchKeys.google;
    if (!config?.apiKey || !config?.searchEngineId) {
      throw new Error("CONFIGURATION ERROR: Google API Key or Search Engine ID is missing in App Settings.");
    }
    return await searchGoogle(query, config.apiKey, config.searchEngineId);
  }

  throw new Error(`Unknown search provider: ${provider}`);
}