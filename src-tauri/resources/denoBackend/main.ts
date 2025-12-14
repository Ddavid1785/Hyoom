import { AppSettings, LLMMessage } from "./shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "./LLM/LLMtypes.ts";
import { SYSTEM_PROMPT } from "./LLM/SystemPrompt.ts";
import { executeMetaTools } from "./MetaTools/metaToolExecutor.ts";
import { getFilePath } from "./filePath.ts";
import { loadTools, resetToolCache } from "./Semantic/loadTools.ts";
import { createToolValues } from "./Semantic/createToolValues.ts";
import { executeAICode } from "./LLM/LLMCodeExecutor.ts";
import { getToolsInfo } from "./Semantic/getToolsInfo.ts";
import { createProvider } from "./LLM/ProviderChooser.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type StreamUpdate = 
  | { type: "status"; message: string }
  | { type: "content"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

(async () => {
  console.log("🚀 Starting Hyoom...");

  const liveTools = await getToolsInfo();
  const liveCount = liveTools.length;

  const cachedTools = await loadTools();
  const cachedCount = cachedTools ? cachedTools.length : 0;

  if (!cachedTools || liveCount !== cachedCount) {
    console.log(`⚠️ Change detected! Disk: ${liveCount} tools, Cache: ${cachedCount} tools.`);
    console.log("♻️ Regenerating embeddings...");

    await createToolValues(liveTools);
    
    resetToolCache();
    
    console.log(`✅ Tool embeddings generated (${liveCount} tools).`);
  } else {
    console.log(`✅ Tool embeddings loaded and match disk (${cachedCount} tools).`);
  }
})();

const SETTINGS_PATH = getFilePath();

const messages: LLMMessage[] = [
  { role: "system", content: SYSTEM_PROMPT, images: undefined }
];

function addMessage(msg: LLMMessage, limit: number) {
  const nonSystem = messages.filter(m => m.role !== "system");
  nonSystem.push(msg);
  
  const recent = nonSystem.slice(-limit);

  messages.length = 0;
  messages.push({ role: "system", content: SYSTEM_PROMPT, images: undefined });
  messages.push(...recent);
}

function clearMessages() {
  if (messages.length > 0){
  messages.length = 0;
  messages.push({ role: "system", content: SYSTEM_PROMPT, images: undefined });
  console.log("🧹 Context cleared by user");
}
}

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
    clearMessages();
    return Response.json({ status: "cleared" }, { status: 200, headers });
  }

  if (url.pathname === "/chat" && req.method === "POST") {
    try {
      const body = await req.json();
      const settings = await loadSettings();

const contextLimit = Math.max(10, settings.contextLimit || 20);

      addMessage(body.message,contextLimit );

      console.log("user message: ", body.message);

      const provider = createProvider(settings);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          const send = (update: StreamUpdate) => {
            controller.enqueue(encoder.encode(JSON.stringify(update) + "\n"));
          };

          try {
            await agentLoop(provider, messages, send, contextLimit);
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

async function agentLoop(
  provider: LLMProvider, 
  messages: LLMMessage[], 
  send: (update: StreamUpdate) => void,
  contextLimit: number
) {
  let maxIterations = 10;
  
  while (maxIterations-- > 0) {
    console.log(`🔄 Turn ${10 - maxIterations}`);
    
    send({ type: "status", message: "Thinking..." });

    const response: LLMResponse = await provider.call(messages);

    if (response.metaToolCalls && response.metaToolCalls.length > 0) {
      const toolName = response.metaToolCalls[0].name === "tool_search" ? "Searching for tools..." : "Reading tool...";
      send({ type: "status", message: toolName });

await sleep(800);

      const results = await executeMetaTools(response.metaToolCalls);
      
      addMessage({ role: "assistant", content: JSON.stringify({ metaToolCalls: response.metaToolCalls }), images: undefined }, contextLimit);
      addMessage({ role: "user", content: `[TOOL SEARCH RESULTS]:\n${JSON.stringify(results)}`, images: undefined }, contextLimit);
      continue;
    }
    
    if (response.code) {
      send({ type: "status", message: "Writing and executing code..." });

await sleep(1000); 

      const executionResult = await executeAICode(response.code);

      addMessage({ role: "assistant", content: JSON.stringify({ content: response.content, code: response.code }), images: undefined }, contextLimit);
      addMessage({ role: "user", content: `[CODE EXECUTION OUTPUT]:\n${executionResult}`, images: undefined }, contextLimit);
      continue;
    }
    
    if (response.content) {
      await sleep(500); 
      send({ type: "content", text: response.content });
      return;
    }
  }
  
  send({ type: "error", error: "Max iterations reached" });
}

async function loadSettings() {
  let settings: AppSettings;
  try {
    const raw = await Deno.readTextFile(`${SETTINGS_PATH}/settings.json`);
    settings = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read settings:", err);
    return {} as AppSettings;
  }
  return settings;
}