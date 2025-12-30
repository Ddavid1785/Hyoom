export const description = "Adjusts the computer's audio volume (Up, Down, Mute).";

// - Use 'up' or 'down' to change volume relative to current level.
// - Use 'mute' to toggle sound on/off.
// - 'steps' controls how much to change. 1 step is approx 2%. Default is 5 (approx 10%).
// - If user says "Turn it up a lot", use a higher step count (e.g., 15 or 20).

export interface VolumeParams {
  action: "up" | "down" | "mute";
  steps?: number;
}

export interface VolumeResult {
  success: boolean;
  error?: string;
}

export async function volumeControl(params: VolumeParams): Promise<VolumeResult> {
  try {
    // Windows Key Codes for Volume:
    // 0xAD (173) = Mute
    // 0xAE (174) = Volume Down
    // 0xAF (175) = Volume Up
    
    let keyCharCode = "";
    
    switch (params.action) {
      case "mute":
        keyCharCode = "173";
        break;
      case "down":
        keyCharCode = "174";
        break;
      case "up":
        keyCharCode = "175";
        break;
      default:
        throw new Error("Invalid action. Use 'up', 'down', or 'mute'.");
    }

    // Default to 5 steps (approx 10% volume change) if not specified
    // Mute ignores steps, it's just a toggle.
    const loopCount = params.action === "mute" ? 1 : (params.steps ?? 5);

    // PowerShell script to create the shell object and send keys in a loop
    const psScript = `
      $wsh = New-Object -ComObject WScript.Shell;
      for ($i=0; $i -lt ${loopCount}; $i++) {
        $wsh.SendKeys([char]${keyCharCode});
        Start-Sleep -Milliseconds 10;
      }
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