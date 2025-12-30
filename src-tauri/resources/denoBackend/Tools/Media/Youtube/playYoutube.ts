export const description = "Opens a specific YouTube URL in the default browser.";

// - Use this AFTER calling 'searchYoutube' and selecting the best URL.
// - Do NOT invent URLs. Only use URLs returned from the search tool.
// - If the user provides a song name (e.g. "Sky"), try to infer or include the artist name in the query (e.g. "Sky Playboi Carti") to avoid generic results.

export interface PlayYoutubeParams {
  url: string;
}

export interface PlayYoutubeResult {
  success: boolean;
  error?: string;
}

export async function playYoutube(params: PlayYoutubeParams): Promise<PlayYoutubeResult> {
  try {
    let url = params.url;

    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        throw new Error("Invalid URL. Must be a YouTube link.");
    }
    
    const cmd = new Deno.Command("cmd", {
      args: ["/c", "start", "", url],
    });
    
    await cmd.spawn();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}