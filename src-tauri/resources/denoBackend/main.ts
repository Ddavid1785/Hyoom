import { findLLMChoice } from "./LLM/LLMChoices.ts";
import { AppSettings, LLMChoice, LLMMessage } from "./shared/sharedTypes.ts";
import { LLMProvider, LLMResponse } from "./LLM/LLMtypes.ts";
import { createProvider } from "./LLM/ProviderChooser.ts";
import { SYSTEM_PROMPT } from "./LLM/SystemPrompt.ts";
import { executeMetaTools } from "./MetaTools/metaToolExecutor.ts";
import { getFilePath } from "./filePath.ts";
import { loadTools } from "./Semantic/loadTools.ts";
import { createToolValues } from "./Semantic/createToolValues.ts";
import { executeAICode } from "./LLM/LLMCodeExecutor.ts";
import { getToolsInfo } from "./Semantic/getToolsInfo.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type StreamUpdate = 
  | { type: "status"; message: string }
  | { type: "content"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

(async () => {
  const tools = await loadTools();

  if (!tools || tools.length === 0) {
    console.log("Tool embeddings missing, generating...");

    const toolsInfo = await getToolsInfo();
    console.log("TOOLS INFO:", toolsInfo);
    await createToolValues(toolsInfo);
    console.log("Tool embeddings generated ✅");
  } else {
    console.log("Tool embeddings loaded ✅");
  }
})();

const SETTINGS_PATH = getFilePath();
const MAX_MESSAGES = 20;

const messages: LLMMessage[] = [
  { role: "system", content: SYSTEM_PROMPT, images: undefined }
];

function addMessage(msg: LLMMessage) {
  const nonSystem = messages.filter(m => m.role !== "system");
  nonSystem.push(msg);
  const recent = nonSystem.slice(-MAX_MESSAGES);

  messages.length = 0;
  messages.push({ role: "system", content: SYSTEM_PROMPT, images: undefined });
  messages.push(...recent);
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

  if (url.pathname === "/chat" && req.method === "POST") {
    try {
      const body = await req.json();
      console.log("user message: ", body.message);
      addMessage(body.message);
      const settings = await loadSettings();
      const llmChoice = validateSettings(settings);
      
      if (!llmChoice) return Response.json({ error: "No LLM" }, { status: 400, headers });

      const provider = createProvider(settings, llmChoice!);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          const send = (update: StreamUpdate) => {
            controller.enqueue(encoder.encode(JSON.stringify(update) + "\n"));
          };

          try {
            await agentLoop(provider, messages, send);
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
  send: (update: StreamUpdate) => void
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
      
      addMessage({ role: "assistant", content: JSON.stringify({ metaToolCalls: response.metaToolCalls }), images: undefined });
      addMessage({ role: "user", content: `[TOOL SEARCH RESULTS]:\n${JSON.stringify(results)}`, images: undefined });
      continue;
    }
    
    if (response.code) {
      send({ type: "status", message: "Writing and executing code..." });

await sleep(1000); 

      const executionResult = await executeAICode(response.code);

      addMessage({ role: "assistant", content: JSON.stringify({ content: response.content, code: response.code }), images: undefined });
      addMessage({ role: "user", content: `[CODE EXECUTION OUTPUT]:\n${executionResult}`, images: undefined });
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

function validateSettings(settings: AppSettings): LLMChoice | null {
  if (!settings.activeLlmId) return null;
  
  const choice = findLLMChoice(settings.activeLlmId);
  if (!choice) return null;

  if (choice.provider === "OpenAI" && !settings.llmKeys.openai) return null;
  if (choice.provider === "Anthropic" && !settings.llmKeys.anthropic) return null;
  if (choice.provider === "Google" && !settings.llmKeys.gemini) return null;

  return choice;
}