use crate::types::AppSettings;
use std::fs;
use std::path::PathBuf;

fn get_settings_path() -> PathBuf {
    let mut path = dirs::config_dir().expect("Could not find config directory");
    path.push("Hyoom");
    if let Err(e) = fs::create_dir_all(&path) {
        log::error!("Failed to create config directory: {}", e);
    }
    path.push("settings.json");
    path
}

#[tauri::command]
pub fn load_settings() -> Result<AppSettings, String> {
    let path = get_settings_path();

    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| {
            log::error!("Failed to read settings file: {}", e);
            format!("Failed to read settings: {}", e)
        })?;

        let settings = serde_json::from_str(&content).map_err(|e| {
            log::error!("Failed to parse settings JSON: {}", e);
            format!("Failed to parse settings: {}", e)
        })?;

        log::debug!("Settings loaded successfully");
        Ok(settings)
    } else {
        log::info!("No settings file found, creating defaults");
        let default = AppSettings::default();
        save_settings(default.clone())?;
        Ok(default)
    }
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    let json = serde_json::to_string_pretty(&settings).map_err(|e| {
        log::error!("Failed to serialize settings: {}", e);
        format!("Failed to serialize settings: {}", e)
    })?;

    fs::write(&path, json).map_err(|e| {
        log::error!("Failed to write settings file: {}", e);
        format!("Failed to write settings: {}", e)
    })?;

    log::info!("Settings saved successfully");
    Ok(())
}
