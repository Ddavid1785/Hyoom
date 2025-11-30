import { SearchResult } from "../types.ts";

export async function searchBrave(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "3"); 

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // deno-lint-ignore no-explicit-any
    return data.web?.results?.map((item: any) => ({
      title: item.title,
      url: item.url,
      description: item.description,
      source: "brave",
    })) || [];

  } catch (error) {
    console.error("Brave search failed:", error);
    return [];
  }
}