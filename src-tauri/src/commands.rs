use crate::types::FileEntry;
use crate::types::ProcessInfo;
use crate::types::SystemInfo;
use crate::types::ToolCall;
use std::fs;
use std::fs::read_to_string;
use std::io;
use std::path::PathBuf;
use std::{path::Path, process::Command};
use sysinfo::System;

#[tauri::command]
pub async fn get_gemma_response(prompt: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let system_instructions = r#"
You are a local AI assistant that can call tools on the user's computer.

Always respond ONLY with valid JSON:
{
  "tool": "string",
  "args": ["string", "string", ...]
}

Available tools:
- "make_dir": creates a directory at a given absolute path.
- "list_files": lists all files and folders in a directory. 
                Returns an array of file info (name, path, extension, type).
- "open_app": opens or launches a program from the provided absolute file path.
- "close_app": closes a running application by name or path.
               If the user says something like "close Discord",
               you should infer that the executable is likely "Discord.exe"
               and call the tool as:
               {"tool":"close_app","args":["Discord.exe"]}
- "delete_path": deletes a file or folder at a given absolute path.
- "read_file": reads the contents of a text file and returns it as a string.
                Use this when the user asks to open, view, or read a file.
                Do not summarize — simply return the text content.
- "list_processes": lists all currently running processes on the system.
                    Returns an array of process information including name and PID (process ID).
                    Use this when the user asks things like "what apps are running", "list active processes",
                    or "show me all running programs".
- "write_file": writes text to a file at a given absolute path.
                If the file does not exist, it will be created automatically as a plain text (.txt) file.
                Use this when the user asks to create or save content to a file.
                Do not add any extra explanation — just write the text as-is.
-"copy_path": copies a file or folder from a source path to a destination path.
If the source is a folder, all contents are copied recursively. Use this when the user asks to duplicate or back up files or folders.
Do not add any extra explanation — just perform the copy.
-"move_path": moves a file or folder from a source path to a destination path.
If the destination is on a different drive, the operation may fail unless the path is copied manually instead.
Use this when the user asks to relocate, rename, or organize files or folders.
Do not add any extra explanation — just perform the move.
-"get_system_info": retrieves basic system information, including OS name, uptime, total and used memory, CPU usage, and number of CPU cores.
Use this when the user asks about their computer’s performance, memory, CPU, or general system status.
Do not add any extra explanation — just return the information in JSON.
-"open_url": opens a given URL in the default web browser.
Use this when the user asks to visit a website, open a link, or navigate to an online page.
Do not add any extra explanation — just open the URL as-is.

Examples:
User: Create a folder named Test
→ {"tool":"make_dir","args":["C:\\Users\\David\\Desktop\\Test"]}

User: Show me files on my desktop
→ {"tool":"list_files","args":["C:\\Users\\David\\Desktop"]}

User: Launch Discord from my desktop
→ {"tool":"open_app","args":["C:\\Users\\David\\Desktop\\Discord.lnk"]}

User: Close Discord
→ {"tool":"close_app","args":["Discord.exe"]}

User: Delete a folder named work from my desktop
→ {"tool":"delete_path","args":["C:\\Users\\David\\Desktop\\work"]}

User: Read the file notes.txt from my desktop
→ {"tool":"read_file","args":["C:\\Users\\David\\Desktop\\notes.txt"]}

User: Show me what's currently running
→ {"tool":"list_processes","args":[]}

User: Save a note saying "Hello World" as Notes.txt on my desktop
→ {"tool":"write_file","args":["C:\\Users\\David\\Desktop\\Notes.txt", "Hello World"]}

User: Copy my Projects folder to Documents
→ {"tool":"copy_path","args":["C:\Users\David\Desktop\Projects","C:\Users\David\Documents\ProjectsBackup"]}

User: Move my Projects folder to D drive
→ {"tool":"move_path","args":["C:\Users\David\Desktop\Projects","D:\Projects"]}

User: Show me my system stats
→ {"tool":"get_system_info","args":[]}

User: Open Google in my browser
→ {"tool":"open_url","args":["https://www.google.com
"]}

Do not output anything else — no code blocks, no explanations.
Always assume the desktop is at C:\\Users\\David\\Desktop.
"#;

        let full_prompt = format!("{}\nUser: {}", system_instructions, prompt);

        let output = Command::new("ollama")
            .args(["run", "gemma3-4b-qat:latest", &full_prompt])
            .output()
            .map_err(|e| e.to_string())?;

        let response = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(response.trim().to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn make_dir(args: Vec<String>) {
    for arg in args {
        println!("Creating: {}", arg);
        let path = Path::new(&arg);
        if let Err(e) = fs::create_dir_all(path) {
            eprintln!("Failed to create {}: {}", arg, e);
        } else {
            println!("Successfully created {}", arg);
        }
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
pub fn delete_path(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);

    if !path.exists() {
        return Err("File or folder does not exist".to_string());
    }

    let metadata = path.metadata().map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
        Ok(format!("Folder deleted: {}", file_path))
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())?;
        Ok(format!("File deleted: {}", file_path))
    }
}

#[tauri::command]
pub fn open_app(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    match Command::new("cmd")
        .args(&["/C", "start", "", &file_path])
        .spawn()
    {
        Ok(_) => Ok(format!("Launched: {}", file_path)),
        Err(e) => Err(format!("Failed to launch: {}", e)),
    }
}

#[tauri::command]
pub fn close_app(process_name: String) -> Result<String, String> {
    match Command::new("cmd")
        .args(&["/C", "taskkill", "/IM", &process_name, "/F"])
        .spawn()
    {
        Ok(_) => Ok(format!("Closed: {}", process_name)),
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
pub fn copy_path(file_path: String, destination_path: String) -> Result<String, String> {
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
        Ok(_) => Ok(format!("Copied {} to {}", file_path, destination_path)),
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
pub async fn gemma_tool_calling(prompt: String) -> Result<String, String> {
    let response = get_gemma_response(prompt.clone()).await?;
    println!("Raw Gemma response:\n{}", response);

    let clean_response = response
        .replace("```json", "")
        .replace("```", "")
        .trim()
        .to_string();

    let maybe_tool: Result<ToolCall, _> = serde_json::from_str(&clean_response);

    if let Ok(tool_call) = maybe_tool {
        println!("Parsed ToolCall: {:?}", tool_call);
        match tool_call.tool.as_str() {
            "make_dir" => {
                make_dir(tool_call.args);
                Ok("make_dir called".into())
            }
            "list_files" => {
                if let Some(path) = tool_call.args.get(0) {
                    match list_files(path.clone()) {
                        Ok(files) => {
                            let json = serde_json::to_string(&files).unwrap_or("[]".into());
                            Ok(format!("list_files result: {}", json))
                        }
                        Err(e) => Err(e),
                    }
                } else {
                    Err("Missing argument for list_files".into())
                }
            }
            "open_app" => {
                if let Some(path) = tool_call.args.get(0) {
                    open_app(path.clone())
                } else {
                    Err("Missing argument for open_app".into())
                }
            }
            "close_app" => {
                if let Some(path) = tool_call.args.get(0) {
                    close_app(path.clone())
                } else {
                    Err("Missing argument for close_app".into())
                }
            }
            "delete_path" => {
                if let Some(path) = tool_call.args.get(0) {
                    delete_path(path.clone())
                } else {
                    Err("Missing argument for delete_path".into())
                }
            }
            "read_file" => {
                if let Some(path) = tool_call.args.get(0) {
                    read_file(path.clone())
                } else {
                    Err("Missing argument for read_file".into())
                }
            }
            "list_processes" => match list_processes() {
                Ok(processes) => {
                    let json = serde_json::to_string(&processes).unwrap_or("[]".into());
                    Ok(format!("list_processes result: {}", json))
                }
                Err(e) => Err(e),
            },
            "get_system_info" => {
                let info = get_system_info();
                let json = serde_json::to_string(&info).unwrap_or("[]".into());
                Ok(format!("info about system: {}", json))
            }
            "write_file" => {
                if tool_call.args.len() >= 2 {
                    let path = tool_call.args[0].clone();
                    let content = tool_call.args[1].clone();
                    write_file(path, content).map(|_| "write_file succeeded".to_string())
                } else {
                    Err("Missing arguments for write_file (expected path and content)".into())
                }
            }
            "copy_path" => {
                if tool_call.args.len() >= 2 {
                    let old_path = tool_call.args[0].clone();
                    let new_path = tool_call.args[1].clone();
                    copy_path(old_path, new_path)
                } else {
                    Err("Missing argument for copy_path".into())
                }
            }
            "move_path" => {
                if tool_call.args.len() >= 2 {
                    let old_path = tool_call.args[0].clone();
                    let new_path = tool_call.args[1].clone();
                    move_path(old_path, new_path).map(|_| "move path succeeded".to_string())
                } else {
                    Err("Missing argument for copy_path".into())
                }
            }
            "open_url" => {
                if let Some(url) = tool_call.args.get(0) {
                    open_url(url.clone()).map(|_| "open url succeded".to_string())
                } else {
                    Err("Missing argument for open_url".into())
                }
            }
            _ => {
                println!("Unknown tool");
                Ok("Unknown tool".into())
            }
        }
    } else {
        println!("Failed to parse response as ToolCall JSON");
        return Ok(format!("Failed to parse: {}", clean_response));
    }
}
