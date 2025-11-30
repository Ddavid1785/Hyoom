export const description = "Fetches the content of a webpage and converts it to readable plain text.";

// - Use this to read the contents of a search result or specific documentation page.
// - This tool automatically strips HTML tags, scripts, and styles to return cleaner text.

export interface GetPageContentParams {
  url: string;
}

export interface GetPageContentResult {
  success: boolean;
  content?: string;
  error?: string;
}

export async function getPageContent(params: GetPageContentParams): Promise<GetPageContentResult> {
  try {
    const response = await fetch(params.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    let text = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]+>/g, " ")                              
      .replace(/\s+/g, " ")                              
      .trim();

      const maxLength = 6000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + "... [Truncated]";
    }

    return { success: true, content: text };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}