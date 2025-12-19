use crate::types::StoredMemory;
use std::fs;
use std::path::PathBuf;

fn get_memories_path() -> PathBuf {
    let mut path = dirs::config_dir().expect("Could not find config directory");
    path.push("Hyoom");
    if let Err(e) = fs::create_dir_all(&path) {
        log::error!("Failed to create config directory: {}", e);
    }
    path.push("memories.json");
    path
}

#[tauri::command]
pub fn load_memories() -> Result<Vec<StoredMemory>, String> {
    let path = get_memories_path();

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read memories file: {}", e))?;

    if content.trim().is_empty() {
        return Ok(Vec::new());
    }

    let memories: Vec<StoredMemory> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse memories JSON: {}", e))?;

    let mut sorted_memories = memories;
    sorted_memories.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(sorted_memories)
}

#[tauri::command]
pub fn delete_memory(id: String) -> Result<(), String> {
    let path = get_memories_path();

    let mut memories = load_memories()?;

    let initial_len = memories.len();
    memories.retain(|m| m.id != id);

    if memories.len() == initial_len {
        return Err("Memory ID not found".to_string());
    }

    let json = serde_json::to_string_pretty(&memories)
        .map_err(|e| format!("Failed to serialize memories: {}", e))?;

    fs::write(&path, json).map_err(|e| format!("Failed to write memories file: {}", e))?;

    Ok(())
}
