use crate::types::DenoProcess;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;
use tokio::time::{sleep, Duration};

mod settings;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let resource_dir = match app_handle.path().resource_dir() {
                    Ok(dir) => dir,
                    Err(e) => {
                        eprintln!("❌ Failed to get resource dir: {:?}", e);
                        return;
                    }
                };
                match spawn_deno_server(resource_dir).await {
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
        .invoke_handler(tauri::generate_handler![
            settings::load_settings,
            settings::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn spawn_deno_server(resource_dir: PathBuf) -> Result<Child, Box<dyn std::error::Error>> {
    let deno_path = resource_dir.join("resources").join("denoBackend");
    let deno_exe = resource_dir.join("bin").join("deno.exe");

    #[cfg(all(windows, not(debug_assertions)))]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut command = Command::new(&deno_exe);
    command
        .arg("run")
        .arg("--allow-net")
        .arg("--allow-read")
        .arg("--allow-write")
        .arg("--allow-env")
        .arg("--allow-run")
        .arg("--allow-ffi")
        .arg("main.ts")
        .current_dir(&deno_path);

    #[cfg(all(windows, not(debug_assertions)))]
    {
        command.creation_flags(CREATE_NO_WINDOW);
    }

    #[cfg(debug_assertions)]
    {
        use std::process::Stdio;
        command.stdout(Stdio::inherit());
        command.stderr(Stdio::inherit());
    }

    let child = command.spawn()?;

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

    println!("❌ Deno health check timeout");
    Err("Deno server failed to start within 5 seconds".into())
}