import { findLLMChoice } from "./LLM/LLMChoices.ts";
import { AppSettings } from "../src/types.ts";
import { createProvider } from "./LLM/index.ts";
import { LLMMessage } from "./LLM/types.ts";

const appName = "Hyoom";
let SETTINGS_PATH;

if (Deno.build.os === "windows") {
  SETTINGS_PATH = `C:/Users/${Deno.env.get("USERNAME")}/AppData/Roaming/${appName}/settings.json`;
} else if (Deno.build.os === "darwin") {
  SETTINGS_PATH = `${Deno.env.get("HOME")}/Library/Application Support/${appName}/settings.json`;
} else {
  SETTINGS_PATH = `${Deno.env.get("HOME")}/.config/${appName}/settings.json`;
}


Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  
  const headers = {
    "Access-Control-Allow-Origin": "*",   
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

const messages:LLMMessage[] = [];

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === "/chat" && req.method === "POST") {
    const body = await req.json();
    
let settings: AppSettings;
    try {
      const raw = await Deno.readTextFile(SETTINGS_PATH);
      settings = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read settings:", err);
      return Response.json({ error: "Failed to load settings" }, { headers, status: 500 });
    }

    console.log("📨 Received:", body);
    console.log("⚙️ Current settings:", settings);

messages.push({content:body.prompt, role:"user"});

const llmChoice = findLLMChoice(settings.llmChoice);

if (!llmChoice){
    return Response.json({
      content: "No LLM choice yet"
    }, {headers});
}

const provider = createProvider(settings.llmApiKey ,llmChoice);

const res = await provider.call(messages);

    return Response.json({
      content: res
    }, {headers});
  }
  
  if (url.pathname === "/health") {
    return Response.json({ status: "ok" }, {headers});
  }
  
  return new Response("Not Found", { status: 404, headers });
});

console.log("✅ Server running on http://localhost:3000");