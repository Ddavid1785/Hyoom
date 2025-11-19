import { join } from "std/path/mod.ts";

export async function executeAICode(code: string) {
  try {
    const toolsDir = join(Deno.cwd(), "..", "denoBackend", "Tools");
    
    let rewrittenCode = code.replace(
      /from ['"]\.\.\/Tools\/(.*?)['"]/g,
      `from 'file://${toolsDir.replace(/\\/g, "/")}/$1'`
    );
    
    rewrittenCode = rewrittenCode.replace(
      /(['"])([A-Z]:\\[^'"]+)\1/g,
      (_match, quote, path) => {
        const escapedPath = path.replace(/\\/g, '\\\\');
        return `${quote}${escapedPath}${quote}`;
      }
    );
    
    console.log("🚀 Executing code:");
    console.log(rewrittenCode);
    
    const tempDir = await Deno.makeTempDir();
    const tempFile = join(tempDir, `code_${Date.now()}.ts`);
    
    await Deno.writeTextFile(tempFile, rewrittenCode);
    
    await import(`file://${tempFile}`);
    
    await Deno.remove(tempDir, { recursive: true });
    
    console.log("✅ Code executed successfully");
    return { success: true };
  // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    console.error("❌ Code execution failed:", error);
    return { success: false, error: error.message };
  }
}