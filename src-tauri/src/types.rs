use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub gemini_api_key: String,
    pub google_search_api_key: Option<String>,
    pub google_search_engine_id: Option<String>,
}
