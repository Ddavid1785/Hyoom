use serde::Serialize;

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
