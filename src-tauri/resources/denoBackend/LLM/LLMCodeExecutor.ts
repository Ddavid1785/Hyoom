import { join } from "std/path/mod.ts";

export async function executeAICode(code: string): Promise<string> {
  let tempDir = "";

  try {
    const toolsDir = join(Deno.cwd(), "Tools");
    
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

    console.log("🚀 Executing code...");
    
    tempDir = await Deno.makeTempDir();
    const tempFile = join(tempDir, `code_${Date.now()}.ts`);
    await Deno.writeTextFile(tempFile, rewrittenCode);
    

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-all",
        tempFile
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await command.output();
    
    await Deno.remove(tempDir, { recursive: true });
    
    const outStr = new TextDecoder().decode(output.stdout);
    const errStr = new TextDecoder().decode(output.stderr);

    if (errStr) {
      console.log("⚠️ Code had stderr output");
      return `${outStr}\n[Error Log]: ${errStr}`;
    }

    const finalResult = outStr.trim() || "Code executed successfully (no output).";
    console.log("✅ Result:", finalResult);
    return finalResult;

  // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    if(tempDir) {
        // deno-lint-ignore no-empty
        try { await Deno.remove(tempDir, { recursive: true }) } catch(_){}
    }
    console.error("❌ Execution failed:", error);
    return `System Execution Error: ${error.message}`;
  }
}