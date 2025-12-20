import { LLMMessage } from "./shared/sharedTypes.ts";
import { SYSTEM_PROMPT } from "./LLM/SystemPrompt.ts";
import { loadTools, resetToolCache } from "./Semantic/loadTools.ts";
import { createToolValues } from "./Semantic/createToolValues.ts";
import { getToolsInfo } from "./Semantic/getToolsInfo.ts";
import { createProvider } from "./LLM/ProviderChooser.ts";
import { clearMessages, getMessagesWithContext, manageContext } from "./mainUtils/contextUtils.ts";
import { agentLoop, loadSettings } from "./mainUtils/generalUtils.ts";
import { StreamUpdate } from "./mainUtils/utilTypes.ts";

(async () => {
  console.log("🚀 Starting Hyoom...");

  const liveTools = await getToolsInfo();
  const liveCount = liveTools.length;

  const cachedTools = await loadTools();
  const cachedCount = cachedTools ? cachedTools.length : 0;

  if (!cachedTools || liveCount !== cachedCount) {
    //console.log(`⚠️ Change detected! Disk: ${liveCount} tools, Cache: ${cachedCount} tools.`);
    //console.log("♻️ Regenerating embeddings...");

    await createToolValues(liveTools);
    
    resetToolCache();
    
    //console.log(`✅ Tool embeddings generated (${liveCount} tools).`);
  } else {
   // console.log(`✅ Tool embeddings loaded and match disk (${cachedCount} tools).`);
  }
})();

const messages: LLMMessage[] = [
  { role: "system", content: SYSTEM_PROMPT, images: undefined }
];

let runningSummary = "";

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (url.pathname === "/health") {
    return Response.json({ status: "OK" }, { status: 200, headers });
  }

 if (url.pathname === "/clear" && req.method === "POST") {
    runningSummary = clearMessages(messages, SYSTEM_PROMPT);
    if (messages.length>0)
    return Response.json({ status: "Cleared" }, { status: 200, headers });
  else
        return Response.json({ status: "Nothing to clear" }, { status: 200, headers });
  }

  if (url.pathname === "/chat" && req.method === "POST") {
    try {
      const body = await req.json();
      const settings = await loadSettings();

const contextLimit = Math.max(10, settings.contextLimit || 40);

      messages.push(body.message);

      //console.log("user message: ", body.message);

      const provider = await createProvider(settings);

      runningSummary =  await manageContext(provider, contextLimit, settings, messages, runningSummary);
 
        const messagesToSend = getMessagesWithContext(messages, runningSummary);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          const send = (update: StreamUpdate) => {
            controller.enqueue(encoder.encode(JSON.stringify(update) + "\n"));
          };

          try {
            await agentLoop(provider, messagesToSend, messages, send);
          // deno-lint-ignore no-explicit-any
          } catch (error: any) {
            send({ type: "error", error: error.message });
          } finally {
            send({ type: "done" });
            controller.close();
          }
        },
      });

      return new Response(stream, { 
        headers: { ...headers, "Content-Type": "application/x-ndjson" } 
      });

    // deno-lint-ignore no-explicit-any
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500, headers });
    }
  }
  
  return new Response("Not Found", { status: 404, headers });
});