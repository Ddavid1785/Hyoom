import { join, relative, normalize } from "std/path/mod.ts";
import { ToolInfo } from "./types.ts";

export async function getToolsInfo(): Promise<ToolInfo[]> {
  const tools: ToolInfo[] = [];

  // Absolute paths from project root
  const rootDir = join(Deno.cwd(),"..","denoBackend", "Tools");
  const llmDir = join(Deno.cwd(),"..","denoBackend", "LLM");

  console.log("Scanning tools in:", rootDir);
  console.log("CWD is:", Deno.cwd());

  // Check if directory exists
  try {
    const stat = await Deno.stat(rootDir);
    if (!stat.isDirectory) {
      console.error("Tools path exists but is not a directory!");
      return tools;
    }
  } catch (err) {
    console.error("Tools directory doesn't exist:", err);
    return tools;
  }

  async function walkDir(dir: string, depth = 0) {
    console.log("  ".repeat(depth) + "Walking:", dir);
    
    try {
      for await (const entry of Deno.readDir(dir)) {
        const entryPath = join(dir, entry.name);
        console.log("  ".repeat(depth + 1) + "Found:", entry.name, entry.isDirectory ? "(dir)" : "(file)");

        if (entry.isDirectory) {
          await walkDir(entryPath, depth + 1);
        } else if (entry.isFile && entry.name.endsWith(".ts")) {
          console.log("  ".repeat(depth + 1) + "Reading .ts file:", entryPath);
          
          try {
            const content = await Deno.readTextFile(entryPath);
            console.log("  ".repeat(depth + 1) + "File content length:", content.length);

            const match = content.match(
              /export\s+const\s+description\s*=\s*(["'`])([\s\S]*?)\1/
            );
            
            if (match) {
              const toolInfo = {
                name: entry.name.replace(/\.ts$/, ""),
                description: match[2],
                relativePath: normalize(relative(llmDir, entryPath)).replace(/\\/g, "/"),
              };
              console.log("  ".repeat(depth + 1) + "✓ Found tool:", toolInfo.name);
              tools.push(toolInfo);
            } else {
              console.log("  ".repeat(depth + 1) + "✗ No description export found");
            }
          } catch (err) {
            console.warn(`Failed to read ${entryPath}: ${err}`);
          }
        }
      }
    } catch (err) {
      console.error("Failed to read directory:", dir, err);
    }
  }

  await walkDir(rootDir);
  console.log(`Found ${tools.length} tools total`);
  return tools;
}