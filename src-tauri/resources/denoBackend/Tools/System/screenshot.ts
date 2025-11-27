export const description = "Captures a screenshot of the primary display and saves it to a file";

// - 'outputPath': Full path where the .png image will be saved.
// - If the user doesn't specify a path, generate a temp one or ask.

export interface ScreenshotParams {
  outputPath: string;
}

export interface ScreenshotResult {
  success: boolean;
  path?: string;
  error?: string;
}

export async function screenshot(params: ScreenshotParams): Promise<ScreenshotResult> {
  try {
    // PowerShell script to capture screen using .NET System.Drawing
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
      
      $bitmap.Save('${params.outputPath}')
    `;

    const cmd = new Deno.Command("powershell", {
      args: ["-Command", psScript],
      stdout: "piped",
      stderr: "piped"
    });

    const output = await cmd.output();
    
    if (output.code !== 0) {
      return { success: false, error: new TextDecoder().decode(output.stderr) };
    }

    return { success: true, path: params.outputPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}