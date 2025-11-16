mod settings;
mod types;

use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;
use types::DenoProcess;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let deno_process = spawn_deno_server()?;
            
            app.manage(DenoProcess(Mutex::new(Some(deno_process))));
            
            println!("✅ Deno server started on http://localhost:3000");
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.try_state::<DenoProcess>() {
                    if let Ok(mut process) = state.0.lock() {
                        if let Some(mut child) = process.take() {
                            let _ = child.kill();
                            println!("🛑 Deno server stopped");
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            handle_prompt,
            settings::save_settings,
            settings::load_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn spawn_deno_server() -> Result<Child, Box<dyn std::error::Error>> {
    let child = Command::new("deno")
        .arg("run")
        .arg("--allow-net")
        .arg("--allow-read")
        .arg("--allow-write")
        .arg("--allow-env")
        .arg("--allow-run")
        .arg("../src/denoBackend/main.ts")
        .spawn()?;
    
    std::thread::sleep(std::time::Duration::from_millis(1000));
    
    Ok(child)
}

#[tauri::command]
async fn handle_prompt(
    prompt: String, 
    images: Option<Vec<String>>, 
    history: Vec<serde_json::Value>
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post("http://localhost:3000/chat")
        .json(&serde_json::json!({
            "prompt": prompt,
            "images": images,
            "history": history
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let text = response.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}