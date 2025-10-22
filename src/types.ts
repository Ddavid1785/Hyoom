export interface Prompt{
    text: string,
    baseImage: string | null,
}

export interface AppSettings {
    geminiApiKey: string;
    googleSearchApiKey: string;
    googleSearchEngineId: string;
}