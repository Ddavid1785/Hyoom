export const description = "Launches the Spotify Desktop App to play a specific Track, Album, or Artist URI.";

// - Requires a 'uri' (e.g., 'spotify:track:xyz') usually obtained from 'searchSpotify'.
// - If you don't have a specific URI, use the search tool first.

export interface PlaySpotifyParams {
  uri: string;
}

export interface PlaySpotifyResult {
  success: boolean;
  error?: string;
}

export async function playSpotify(params: PlaySpotifyParams): Promise<PlaySpotifyResult> {
  try {
    if (!params.uri.startsWith("spotify:")) {
        throw new Error("Invalid URI. Must start with 'spotify:'.");
    }

    const openCmd = new Deno.Command("cmd", {
      args: ["/c", "start", "", params.uri],
    });
    await openCmd.spawn();

    const psScript = `
      Start-Sleep -Seconds 3;
      $wsh = New-Object -ComObject WScript.Shell;
      
      # Try to focus the window containing 'Spotify' or the song name logic
      # usually 'Spotify' works as it matches the process window title partially
      if ($wsh.AppActivate('Spotify')) {
          Start-Sleep -Milliseconds 500;
          $wsh.SendKeys('{ENTER}');
      } else {
          # If AppActivate fails, we just try sending it anyway assuming it's on top
          $wsh.SendKeys('{ENTER}');
      }
    `;

    const playCmd = new Deno.Command("powershell", {
      args: ["-Command", psScript],
    });
    
    // We don't await this immediately if we want the tool to return fast, 
    // but waiting ensures the user sees the result before the AI speaks.
    await playCmd.spawn();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}