export interface AppSettings {
    llmApiKey: string;
    //googleSearchApiKey: string;
    //googleSearchEngineId: string;
    llmChoice: string
}

export interface LLMChoice{
  name: string,
  pathToIcon: string,
  provider: string; 
  modelId: string;
}