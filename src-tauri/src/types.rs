use std::{process::Child, sync::Mutex};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct LlmKeys {
    pub openai: Option<String>,
    pub anthropic: Option<String>,
    pub gemini: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GoogleSearchConfig {
    pub api_key: String,
    pub search_engine_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct SearchKeys {
    pub brave: Option<String>,
    pub google: Option<GoogleSearchConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub active_llm_id: String,
    pub active_search_provider: String,

    pub context_limit: Option<u32>,

    pub llm_keys: LlmKeys,
    pub search_keys: SearchKeys,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StoredMemory {
    pub id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub timestamp: String,
}

pub struct DenoProcess(pub Mutex<Option<Child>>);
