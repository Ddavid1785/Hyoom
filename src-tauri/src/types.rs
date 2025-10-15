use serde::{Deserialize, Serialize};

#[derive(serde::Deserialize, Debug)]
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

#[derive(Serialize, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub text: String,
    pub base_image: Option<String>,
}
