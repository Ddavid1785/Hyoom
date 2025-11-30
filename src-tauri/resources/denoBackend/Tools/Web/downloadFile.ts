export const description = "Downloads a file from a URL and saves it to a local destination path.";

// - Ensure the destination directory exists before calling this (use createDir if needed).
// - Provide the full absolute path for the destination, including the filename and extension.

export interface DownloadFileParams {
  url: string;
  destinationPath: string;
}

export interface DownloadFileResult {
  success: boolean;
  bytesWritten?: number;
  path?: string;
  error?: string;
}

export async function downloadFile(params: DownloadFileParams): Promise<DownloadFileResult> {
  try {
    const response = await fetch(params.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty.");
    }

    const file = await Deno.open(params.destinationPath, { write: true, create: true });
    
    await response.body.pipeTo(file.writable);

    const stats = await Deno.stat(params.destinationPath);

    return { 
      success: true, 
      path: params.destinationPath,
      bytesWritten: stats.size
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}