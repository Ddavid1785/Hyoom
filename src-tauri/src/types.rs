use std::{process::Child, sync::Mutex};

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub llm_api_key: String,
    pub llm_choice: String, //pub google_search_api_key: Option<String>,
                            //pub google_search_engine_id: Option<String>,
}

pub struct DenoProcess(pub Mutex<Option<Child>>);
