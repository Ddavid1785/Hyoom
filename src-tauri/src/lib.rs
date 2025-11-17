use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;
use tokio::time::{sleep, Duration};
use crate::types::DenoProcess;

mod types;
mod settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                match spawn_deno_server().await {
                    Ok(process) => {
                        app_handle.manage(DenoProcess(Mutex::new(Some(process))));
                        println!("✅ Deno server started");
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to start Deno: {}", e);
                    }
                }
            });

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
        .invoke_handler(tauri::generate_handler![handle_prompt, settings::load_settings, settings::save_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn spawn_deno_server() -> Result<Child, Box<dyn std::error::Error>> {
    let child = Command::new("deno")
        .arg("run")
        .arg("--allow-net")
        .arg("--allow-read")
        .arg("--allow-write")
        .arg("--allow-env")
        .arg("--allow-run")
        .arg("../denoBackend/main.ts")
        .spawn()?;

    let client = reqwest::Client::new();
    let max_attempts = 50;

    for attempt in 1..=max_attempts {
        sleep(Duration::from_millis(100)).await;

        if let Ok(response) = client.get("http://localhost:3000/health").send().await {
            if response.status().is_success() {
                println!("✅ Deno ready after {}ms", attempt * 100);
                return Ok(child);
            }
        }
    }

    Err("Deno server failed to start within 5 seconds".into())
}

#[tauri::command]
async fn handle_prompt(
    prompt: String,
    images: Option<Vec<String>>,
    history: Vec<serde_json::Value>,
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
