import { join } from "std/path/mod.ts";

export async function toolRead(relativePath: string): Promise<string> {
  // Normalize and clean the path
  let cleanPath = relativePath.replace(/\\\\/g, "/").replace(/\\/g, "/");
  
  // Remove leading ../ since we're building from absolute base
  cleanPath = cleanPath.replace(/^\.\.\//, "");
  
  // Build absolute path: src-tauri -> Hyoom -> denoBackend -> Tools/...
  const absolutePath = join(Deno.cwd(), cleanPath);
  
  console.log("📖 Reading tool from:", absolutePath);
  console.log("📖 Original path was:", relativePath);
  console.log("📖 Cleaned path is:", cleanPath);
  
  try {
    return await Deno.readTextFile(absolutePath);
  // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    throw new Error(`Failed to read tool at ${relativePath}: ${err.message}`);
  }
}