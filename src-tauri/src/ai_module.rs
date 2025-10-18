use crate::commands;
use crate::types::{Prompt, ToolCall};

const SYSTEM_INSTRUCTIONS: &str = r#"
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
                Use this when the user asks about their computer's performance, memory, CPU, or general system status.
                Do not add any extra explanation — just return the information in JSON.
-"open_url": opens a given URL in the default web browser.
                Use this when the user asks to visit a website, open a link, or navigate to an online page.
                Do not add any extra explanation — just open the URL as-is.
-"respond_to_user": sends a text message back to the user through the console (or UI in future versions).  
                Use this when you want to communicate information, ask for clarification, or report results directly to the user instead of performing a system action.  
                Do not use this for file creation, system actions, or launching programs — it is purely for sending messages back to the user.

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
→ {"tool":"open_url","args":["https://www.google.com"]}

User: Tell me that the backup finished successfully
→ {"tool":"respond_to_user","args":["All files have been successfully backed up."]}

Do not output anything else — no code blocks, no explanations.
Always assume the desktop is at C:\\Users\\David\\Desktop.
"#;

#[tauri::command]
pub async fn get_gemma_response(prompt: Prompt) -> Result<String, String> {
    let full_prompt = format!("{}\nUser: {}", SYSTEM_INSTRUCTIONS, prompt.text);
    let client = reqwest::Client::new();

    if let Some(img_b64) = &prompt.base_image {
        let cleaned_b64 = img_b64
            .trim()
            .replace("data:image/png;base64,", "")
            .replace("data:image/jpeg;base64,", "")
            .replace("data:image/jpg;base64,", "")
            .replace("data:image/webp;base64,", "");

        let response = client
            .post("http://localhost:11434/api/chat")
            .json(&serde_json::json!({
                "model": "gemma3-4b-mmproj-f16:latest",
                "messages": [{
                    "role": "user",
                    "content": full_prompt,
                    "images": [cleaned_b64]
                }],
                "stream": false
            }))
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = result["message"]["content"]
            .as_str()
            .ok_or("Invalid response format")?
            .to_string();

        Ok(content)
    } else {
        let response = client
            .post("http://localhost:11434/api/chat")
            .json(&serde_json::json!({
                "model": "gemma3-4b-qat:latest",
                "messages": [{
                    "role": "user",
                    "content": full_prompt
                }],
                "stream": false
            }))
            .send()
            .await
            .map_err(|e| format!("API request failed: {}", e))?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = result["message"]["content"]
            .as_str()
            .ok_or("Invalid response format")?
            .to_string();

        Ok(content)
    }
}

#[tauri::command]
pub async fn gemma_tool_calling(prompt: Prompt) -> Result<String, String> {
    let response = get_gemma_response(prompt.clone()).await?;
    //println!("Raw Gemma response:\n{}", response);

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
                commands::make_dir(tool_call.args);
                Ok("make_dir called".into())
            }
            "respond_to_user" => {
                if let Some(text) = tool_call.args.first() {
                    commands::respond_to_user(text.clone())
                } else {
                    Err("Missing argument for respond_to_user".into())
                }
            }
            "list_files" => {
                if let Some(path) = tool_call.args.first() {
                    match commands::list_files(path.clone()) {
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
                if let Some(path) = tool_call.args.first() {
                    commands::open_app(path.clone())
                } else {
                    Err("Missing argument for open_app".into())
                }
            }
            "close_app" => {
                if let Some(path) = tool_call.args.first() {
                    commands::close_app(path.clone())
                } else {
                    Err("Missing argument for close_app".into())
                }
            }
            "delete_path" => {
                if let Some(path) = tool_call.args.first() {
                    commands::delete_path(path.clone())
                } else {
                    Err("Missing argument for delete_path".into())
                }
            }
            "read_file" => {
                if let Some(path) = tool_call.args.first() {
                    commands::read_file(path.clone())
                } else {
                    Err("Missing argument for read_file".into())
                }
            }
            "list_processes" => match commands::list_processes() {
                Ok(processes) => {
                    let json = serde_json::to_string(&processes).unwrap_or("[]".into());
                    Ok(format!("list_processes result: {}", json))
                }
                Err(e) => Err(e),
            },
            "get_system_info" => {
                let info = commands::get_system_info();
                let json = serde_json::to_string(&info).unwrap_or("[]".into());
                Ok(format!("info about system: {}", json))
            }
            "write_file" => {
                if tool_call.args.len() >= 2 {
                    let path = tool_call.args[0].clone();
                    let content = tool_call.args[1].clone();
                    commands::write_file(path, content).map(|_| "write_file succeeded".to_string())
                } else {
                    Err("Missing arguments for write_file (expected path and content)".into())
                }
            }
            "copy_path" => {
                if tool_call.args.len() >= 2 {
                    let old_path = tool_call.args[0].clone();
                    let new_path = tool_call.args[1].clone();
                    commands::copy_path(old_path, new_path)
                } else {
                    Err("Missing argument for copy_path".into())
                }
            }
            "move_path" => {
                if tool_call.args.len() >= 2 {
                    let old_path = tool_call.args[0].clone();
                    let new_path = tool_call.args[1].clone();
                    commands::move_path(old_path, new_path).map(|_| "move path succeeded".to_string())
                } else {
                    Err("Missing argument for copy_path".into())
                }
            }
            "open_url" => {
                if let Some(url) = tool_call.args.first() {
                    commands::open_url(url.clone()).map(|_| "open url succeeded".to_string())
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
        Ok(format!("Failed to parse: {}", clean_response))
    }
}
