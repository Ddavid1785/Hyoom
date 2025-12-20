use std::{collections::HashMap, process::Child, sync::Mutex};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct InferenceProviderConfig {
    pub api_key: Option<String>,
    pub custom_base_url: Option<String>,
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
    pub active_model_id: String,
    pub active_provider_id: String,
    pub active_search_provider: String,

    pub context_limit: Option<u32>,
    pub enable_compression: Option<bool>,

    pub inference_providers: HashMap<String, InferenceProviderConfig>,
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

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CustomModel {
    pub id: String,
    pub display_name: String,
    pub creator: String,
    pub icon_path: String,
    pub capabilities: LLMCapabilities,
    pub provider_model_ids: std::collections::HashMap<String, Option<String>>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LLMCapabilities {
    pub vision: bool,
    pub image_generation: bool,
    pub function_calling: bool,
}

pub struct DenoProcess(pub Mutex<Option<Child>>);
