import { SearchResult } from "../types.ts";

export async function searchGoogle(
  query: string, 
  apiKey: string, 
  cx: string
): Promise<SearchResult[]> {
  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "3");

    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google API Error: ${err}`);
    }

    const data = await response.json();

    // Map Google's specific response format to our common format
    // deno-lint-ignore no-explicit-any
    return data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      description: item.snippet,
      source: "google",
    })) || [];

  } catch (error) {
    console.error("Google search failed:", error);
    return [];
  }
}