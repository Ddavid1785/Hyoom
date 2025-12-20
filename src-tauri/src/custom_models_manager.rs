use std::{fs, path::PathBuf};

use crate::types::CustomModel;

fn get_custom_models_path() -> PathBuf {
    let mut path = dirs::config_dir().expect("Could not find config directory");
    path.push("Hyoom");
    if let Err(e) = fs::create_dir_all(&path) {
        log::error!("Failed to create config directory: {}", e);
    }
    path.push("customModels.json");
    path
}

#[tauri::command]
pub fn load_custom_models() -> Result<Vec<CustomModel>, String> {
    let path = get_custom_models_path();
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let models: Vec<CustomModel> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(models)
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn save_custom_models(models: Vec<CustomModel>) -> Result<(), String> {
    let path = get_custom_models_path();
    let json = serde_json::to_string_pretty(&models).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}
