use crate::settings;
use crate::types::FileEntry;
use crate::types::ProcessInfo;
use crate::types::SystemInfo;
use std::fs;
use std::fs::read_to_string;
use std::fs::File;
use std::io;
use std::io::Read;
use std::io::Write;
use std::path::PathBuf;
use std::{path::Path, process::Command};
use sysinfo::System;
use walkdir::WalkDir;
use zip::write::FileOptions;
use zip::CompressionMethod;

#[tauri::command]
pub fn make_dir(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    fs::create_dir_all(path).map_err(|e| format!("Failed to create {}: {}", path.display(), e))
}

#[tauri::command]
pub fn respond_to_user(text: String) -> Result<String, String> {
    if text.is_empty() {
        Ok(text)
    } else {
        Err("Model didn't respond".to_string())
    }
}

#[tauri::command]
pub fn list_files(file_path: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&file_path);
    let mut files: Vec<FileEntry> = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    entries.for_each(|file| {
        if let Ok(f) = file {
            let name = f.file_name().to_string_lossy().to_string();
            let path_str = f.path().display().to_string();
            let metadata = f.metadata().ok();
            let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
            let file_type = if is_dir {
                "dir".to_string()
            } else {
                "file".to_string()
            };
            let extension = f
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|s| s.to_string());

            let fe = FileEntry {
                name,
                path: path_str,
                file_type,
                is_dir,
                extension,
            };
            files.push(fe);
        }
    });
    Ok(files)
}

#[tauri::command]
pub fn search_files(
    search_term: String,
    search_path: String,
    max_depth: Option<usize>,
) -> Result<Vec<FileEntry>, String> {
    let max_depth = max_depth.unwrap_or(3);
    let search_term_lower = search_term.to_lowercase();
    let mut results = Vec::new();

    fn search_recursive(
        path: &Path,
        term: &str,
        results: &mut Vec<FileEntry>,
        current_depth: usize,
        max_depth: usize,
    ) {
        if current_depth > max_depth {
            return;
        }

        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let name_lower = name.to_lowercase();

                if name_lower.contains(term) {
                    if let Ok(metadata) = entry.metadata() {
                        let is_dir = metadata.is_dir();
                        let extension = entry
                            .path()
                            .extension()
                            .and_then(|ext| ext.to_str())
                            .map(|s| s.to_string());

                        results.push(FileEntry {
                            name,
                            path: entry.path().display().to_string(),
                            file_type: if is_dir {
                                "dir".to_string()
                            } else {
                                "file".to_string()
                            },
                            is_dir,
                            extension,
                        });
                    }
                }

                if entry.path().is_dir() {
                    search_recursive(&entry.path(), term, results, current_depth + 1, max_depth);
                }
            }
        }
    }

    let path = Path::new(&search_path);
    search_recursive(path, &search_term_lower, &mut results, 0, max_depth);

    Ok(results)
}

#[tauri::command]
pub fn list_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut system = System::new_all();
    system.refresh_all();

    let processes: Vec<ProcessInfo> = system
        .processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32() as i32,
            name: process.name().to_string(),
        })
        .collect();

    Ok(processes)
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(file_path: String, file_text: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);
    if path.is_dir() {
        return Err("Cannot write to a directory.".into());
    }
    fs::write(path, file_text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_path(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);

    if !path.exists() {
        return Err("File or folder does not exist".to_string());
    }

    let metadata = path.metadata().map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[tauri::command]
pub fn open_app(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    match Command::new("cmd")
        .args(["/C", "start", "", &file_path])
        .spawn()
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to launch: {}", e)),
    }
}

#[tauri::command]
pub fn close_app(process_name: String) -> Result<(), String> {
    match Command::new("cmd")
        .args(["/C", "taskkill", "/IM", &process_name, "/F"])
        .spawn()
    {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to close {}: {}", process_name, e)),
    }
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn copy_path(file_path: String, destination_path: String) -> Result<(), String> {
    let old_path = Path::new(&file_path);
    let new_path = Path::new(&destination_path);

    if !old_path.exists() {
        return Err("Source path does not exist".into());
    }

    let result = if old_path.is_dir() {
        copy_dir_recursive(old_path, new_path)
    } else {
        fs::copy(old_path, new_path).map(|_| ())
    };

    match result {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to copy: {}", e)),
    }
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage = sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32;

    SystemInfo {
        os_name: System::name().unwrap_or_else(|| "Unknown".into()),
        uptime_seconds: System::uptime(),
        total_memory_mb: sys.total_memory() / 1024,
        used_memory_mb: (sys.total_memory() - sys.available_memory()) / 1024,
        cpu_usage_percent: cpu_usage,
        number_of_cpus: sys.cpus().len(),
    }
}

#[tauri::command]
pub fn move_path(file_path: String, destination_path: String) -> Result<(), String> {
    let old_path = Path::new(&file_path);
    let mut new_path = PathBuf::from(&destination_path);

    if !old_path.exists() {
        return Err("Source path does not exist.".into());
    }

    if new_path.is_dir() {
        if let Some(name) = old_path.file_name() {
            new_path.push(name);
        }
    }
    match fs::rename(old_path, &new_path) {
        Ok(_) => Ok(()),
        Err(e) => {
            if let Some(18) = e.raw_os_error() {
                Err("Cannot move across drives (different file systems).".into())
            } else {
                Err(format!("Failed to move: {}", e))
            }
        }
    }
}

#[tauri::command]
pub async fn search_web(query: String) -> Result<String, String> {
    let settings = settings::load_settings()?;
    let api_key = settings.google_search_api_key.unwrap_or_default();
    let search_engine_id = settings.google_search_engine_id.unwrap_or_default();
    if api_key.is_empty() || search_engine_id.is_empty() {
        return Err("Search api or search engine id not provided".to_string());
    }

    let client = reqwest::Client::new();
    let url = format!(
        "https://www.googleapis.com/customsearch/v1?key={}&cx={}&q={}",
        api_key, search_engine_id, query
    );

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    let results = json["items"]
        .as_array()
        .map(|items| {
            items
                .iter()
                .take(5)
                .map(|item| format!("{}: {}", item["title"], item["link"]))
                .collect::<Vec<_>>()
                .join("\n")
        })
        .unwrap_or_else(|| "No results".into());

    Ok(results)
}

#[tauri::command]
pub fn read_file(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    match read_to_string(path) {
        Ok(contents) => Ok(contents),
        Err(_) => Err("Could't read file".to_string()),
    }
}

#[tauri::command]
pub fn zip_path(path: String) -> Result<String, String> {
    let source_path = Path::new(&path);
    
    if !source_path.exists() {
        return Err("Path does not exist".to_string());
    }

    let parent_dir = source_path.parent()
        .ok_or("Cannot get parent directory")?;
    
    let base_name = source_path.file_name()
        .ok_or("Cannot get file name")?
        .to_str()
        .ok_or("Invalid file name")?;
    
    let zip_path = parent_dir.join(format!("{}.zip", base_name));
    let zip_file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(zip_file);
    
    let file_options: FileOptions<()> = FileOptions::default()
        .compression_method(CompressionMethod::Deflated);

    if source_path.is_file() {
        let file_name = source_path.file_name().unwrap().to_str().unwrap();
        zip.start_file(file_name, file_options).map_err(|e| e.to_string())?;
        
        let mut input_file = File::open(source_path).map_err(|e| e.to_string())?;
        let mut buffer = Vec::new();
        input_file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        zip.write_all(&buffer).map_err(|e| e.to_string())?;
    } else {
        let walkdir = WalkDir::new(source_path);
        let it = walkdir.into_iter().filter_map(|e| e.ok());

        for entry in it {
            let entry_path = entry.path();
            let relative_path = entry_path.strip_prefix(source_path)
                .map_err(|e| e.to_string())?;
            
            if relative_path.as_os_str().is_empty() {
                continue;
            }

            let name = relative_path.to_str().unwrap();

            if entry_path.is_file() {
                zip.start_file(name, file_options).map_err(|e| e.to_string())?;
                
                let mut input_file = File::open(entry_path).map_err(|e| e.to_string())?;
                let mut buffer = Vec::new();
                input_file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
                zip.write_all(&buffer).map_err(|e| e.to_string())?;
            } else if entry_path.is_dir() {
                zip.add_directory(format!("{}/", name), file_options)
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    
    Ok(zip_path.to_str().unwrap().to_string())
}