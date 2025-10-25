use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(serde::Deserialize, Debug, Serialize, Clone)]
pub struct ToolCall {
    pub tool: String,
    pub args: Vec<String>,
}
#[derive(serde::Serialize, Debug)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub is_dir: bool,
    pub extension: Option<String>,
}
#[derive(Serialize)]
pub struct ProcessInfo {
    pub pid: i32,
    pub name: String,
}

#[derive(Serialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub uptime_seconds: u64,
    pub total_memory_mb: u64,
    pub used_memory_mb: u64,
    pub cpu_usage_percent: f32,
    pub number_of_cpus: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Model
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Role::User => write!(f, "user"),
            Role::Model => write!(f, "model"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: Role,
    pub parts: Vec<serde_json::Value>,
}

#[derive(Serialize, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub text: String,
    pub base_image: Option<String>,
    pub chat_history: Option<Vec<ChatMessage>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum ExecutionMode {
    Independent,     // tools run in parallel
    SequentialChain, // ordered, no data passing
    DependentChain,  // ordered, with data passing
    SelfReprompt,    // AI loop
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TaskGroup {
    pub tools: Vec<ToolCall>,
    pub mode: ExecutionMode,
    pub end_goal: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TaskRequest {
    pub groups: Vec<TaskGroup>, // each group runs on separate threads
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolResult {
    pub tool_name: String,
    pub success: bool,
    pub result: String,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupResult {
    pub mode: ExecutionMode,
    pub tool_results: Vec<ToolResult>,
    pub user_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub groups: Vec<GroupResult>,
    pub raw_ai_response: String
}

pub type ToolFn = Box<dyn Fn(Vec<String>) -> Result<String, String>>;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub gemini_api_key: String,
    pub google_search_api_key: Option<String>,
    pub google_search_engine_id: Option<String>,
}
