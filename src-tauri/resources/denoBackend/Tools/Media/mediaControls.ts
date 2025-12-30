// tools/media/mediaControls.ts

export const description = "Controls the system's global media playback (Play, Pause, Next, Previous)";

// - Use this when the user says 'pause', 'resume', 'skip song', or 'go back'.
// - This affects the system globally (Spotify, YouTube, Media Player).
// - Action mapping:
//   - 'play_pause': Toggles between play and pause.
//   - 'next': Skips to the next track.
//   - 'previous': Goes back to the previous track.

export interface MediaControlParams {
  action: "play_pause" | "next" | "previous";
}

export interface MediaControlResult {
  success: boolean;
  error?: string;
}

export async function mediaControl(params: MediaControlParams): Promise<MediaControlResult> {
  try {
    // We use a PowerShell script to send the specific keystroke to the Windows Shell.
    // Keys: 0xB3 (Play/Pause), 0xB0 (Next), 0xB1 (Previous)
    
    let key = "";
    
    switch (params.action) {
      case "play_pause":
        key = "0xB3"; // VK_MEDIA_PLAY_PAUSE
        break;
      case "next":
        key = "0xB0"; // VK_MEDIA_NEXT_TRACK
        break;
      case "previous":
        key = "0xB1"; // VK_MEDIA_PREV_TRACK
        break;
      default:
        throw new Error("Invalid media action");
    }

    const psScript = `
      $wsh = New-Object -ComObject WScript.Shell;
      $wsh.SendKeys([char]${key});
    `;

    const cmd = new Deno.Command("powershell", {
      args: ["-Command", psScript],
    });

    await cmd.spawn();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}