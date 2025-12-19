import { LLMProvider } from "../LLM/LLMtypes.ts";
import { AppSettings, LLMMessage } from "../shared/sharedTypes.ts";

async function generateNewSummary(
  provider: LLMProvider, 
  currentSummary: string, 
  messagesToCompress: LLMMessage[]
): Promise<string> {
  
  const conversationText = messagesToCompress
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
  You are a Context Manager. Your job is to maintain a concise running summary of a conversation.
  
  ### CURRENT SUMMARY:
  ${currentSummary || "No summary yet."}
  
  ### NEW INTERACTION TO MERGE:
  ${conversationText}
  
  ### INSTRUCTION:
  1. Update the Current Summary to include key details from the New Interaction.
  2. DELETE outdated information (e.g., if user changed their mind).
  3. IMPORTANT: Keep the output CONCISE (under 300 words). Do not just append text; rewrite the summary to be dense and factual.
  
  Output ONLY the new summary text.
  `;

  const response = await provider.call([
    { role: "system", content: "You are a background process managing memory." },
    { role: "user", content: prompt }
  ]);

  return response.content || currentSummary;
}

export async function manageContext(provider: LLMProvider, limit: number, settings: AppSettings, messages: LLMMessage[], runningSummary: string) {
  const historyCount = messages.length - 1; 

  if (historyCount <= limit) return runningSummary;

  if (settings.enableCompression) {
    console.log("🗜️ Triggering Compression...");
    
    const targetRemaining = Math.floor(limit * 0.5); 

    const countToCompress = historyCount - targetRemaining; 
    
     if (countToCompress <= 0) return runningSummary;

    const chunk = messages.slice(1, 1 + countToCompress);

    try {
      const newSummary = await generateNewSummary(provider, runningSummary, chunk);
      
      messages.splice(1, countToCompress);
      
      console.log("✅ Compressed. Messages reduced to:", messages.length);
      console.log(newSummary)
      return newSummary;
    } catch (e) {
      console.error("Compression failed, skipping this turn:", e);
      return runningSummary;
    }

  } else {
    const excess = historyCount - limit;
    if (excess > 0) {
      messages.splice(1, excess);
      console.log(`✂️ Pruned ${excess} old messages.`);
    }
    return runningSummary;
  }
}

export function getMessagesWithContext(messages: LLMMessage[], runningSummary: string): LLMMessage[] {
  if (!runningSummary) return messages;

  const originalSystem = messages[0];
  
  const enrichedSystem: LLMMessage = {
    ...originalSystem,
    content: `${originalSystem.content}\n\n### PREVIOUS CONVERSATION SUMMARY:\n${runningSummary}`
  };

  return [enrichedSystem, ...messages.slice(1)];
}

export function clearMessages(messages: LLMMessage[], SYSTEM_PROMPT: string) {
  if (messages.length > 0){
  messages.length = 0;
  messages.push({ role: "system", content: SYSTEM_PROMPT, images: undefined });
  console.log("🧹 Context cleared by user");
}
return ""; // Return the reset summary
}