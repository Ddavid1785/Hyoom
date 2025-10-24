mod ai_module;
mod commands;
mod settings;
mod types;
pub mod system_instructions;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ai_module::get_ai_response,
            ai_module::ai_tool_calling,
            commands::make_dir,
            commands::list_files,
            commands::open_app,
            commands::close_app,
            commands::delete_path,
            commands::read_file,
            commands::list_processes,
            commands::write_file,
            commands::copy_path,
            commands::move_path,
            commands::get_system_info,
            commands::open_url,
            commands::respond_to_user,
            commands::search_web,
            commands::search_files,
            commands::zip_path,
            settings::save_settings,
            settings::load_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
