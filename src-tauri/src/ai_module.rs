use std::collections::HashMap;

use reqwest::Client;
use serde_json::json;

use crate::commands;
use crate::types::{Prompt, ToolCall, ToolFn};

const SYSTEM_INSTRUCTIONS: &str = r#"
You are a local AI assistant that can call tools on the user's computer. Always respond only with valid JSON.

If you want to call a single tool, the format is: {"tool": "string", "args": ["string", "string", ...]}.

If you want to call multiple tools at once, send a JSON array of tool calls: [{"tool": "make_dir", "args": ["C:\Users\David\Desktop\Test"]}, {"tool": "write_file", "args": ["C:\Users\David\Desktop\Notes.txt", "Hello World"]}]. Each object in the array must follow the same "tool" + "args" structure.

Available tools:

"make_dir": creates a directory at a given absolute path.

"list_files": lists all files and folders in a directory. Returns an array of file info (name, path, extension, type).

"open_app": opens or launches a program from the provided absolute file path.

"close_app": closes a running application by name or path.

"delete_path": deletes a file or folder at a given absolute path.

"read_file": reads the contents of a text file and returns it as a string.

"list_processes": lists all currently running processes (name and PID).

"write_file": writes text to a file at a given absolute path.

"copy_path": copies a file or folder from a source path to a destination path.

"move_path": moves a file or folder from a source path to a destination path.

"get_system_info": retrieves basic system information, including OS name, uptime, memory usage, CPU usage, etc.

"open_url": opens a given URL in the default web browser.

"respond_to_user": sends a text message back to the user (console/UI).

Examples:
Single tool call:
User: Create a folder named Test → {"tool":"make_dir","args":["C:\Users\David\Desktop\Test"]}
User: Show me files on my desktop → {"tool":"list_files","args":["C:\Users\David\Desktop"]}

Multiple tool calls at once:
User: Create a folder and save a note inside it → [{"tool":"make_dir","args":["C:\Users\David\Desktop\NewFolder"]}, {"tool":"write_file","args":["C:\Users\David\Desktop\NewFolder\note.txt", "Hello World"]}]

Rules: Always respond with valid JSON (either a single object or an array of objects). Do not include explanations, code blocks, or any extra text. Always assume the desktop is at C:\Users\David\Desktop.
"#;

async fn send_ai_request(
    client: &Client,
    model: &str,
    content: &str,
    images: Option<Vec<String>>,
) -> Result<String, String> {
    let mut message = json!({
        "role": "user",
        "content": content,
    });

    if let Some(imgs) = images {
        message["images"] = json!(imgs);
    }

    let response = client
        .post("http://localhost:11434/api/chat")
        .json(&json!({
            "model": model,
            "messages": [message],
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

    result["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid response format".to_string())
}

pub async fn call_ai(prompt: Prompt, client: Client) -> Result<String, String> {
    if let Some(img_b64) = &prompt.base_image {
        let cleaned = img_b64
            .trim()
            .replace("data:image/png;base64,", "")
            .replace("data:image/jpeg;base64,", "")
            .replace("data:image/jpg;base64,", "")
            .replace("data:image/webp;base64,", "");

        send_ai_request(
            &client,
            "gemma3-4b-mmproj-f16:latest",
            &prompt.text,
            Some(vec![cleaned]),
        )
        .await
    } else {
        send_ai_request(&client, "gemma3-4b-qat:latest", &prompt.text, None).await
    }
}

#[tauri::command]
pub async fn get_ai_response(prompt: Prompt) -> Result<String, String> {
    let full_prompt = format!("{}\nUser: {}", SYSTEM_INSTRUCTIONS, prompt.text);
    let client = Client::new();
    let parsed_prompt = Prompt {
        text: full_prompt,
        base_image: prompt.base_image,
    };

    call_ai(parsed_prompt, client).await
}

fn get_arg(args: &[String], index: usize, tool_name: &str) -> Result<String, String> {
    args.get(index)
        .cloned()
        .ok_or_else(|| format!("Missing argument {} for {}", index, tool_name))
}

pub fn build_tool_map() -> HashMap<&'static str, ToolFn> {
    let mut tools: HashMap<&str, ToolFn> = HashMap::new();

    tools.insert(
        "make_dir",
        Box::new(|args| {
            let path = get_arg(&args, 0, "make_dir")?;
            commands::make_dir(path)
        }),
    );

    tools.insert(
        "respond_to_user",
        Box::new(|args| {
            let text = get_arg(&args, 0, "respond_to_user")?;
            commands::respond_to_user(text)
        }),
    );

    tools.insert(
        "list_files",
        Box::new(|args| {
            let path = get_arg(&args, 0, "list_files")?;
            match commands::list_files(path) {
                Ok(files) => Ok(serde_json::to_string(&files).unwrap_or("[]".into())),
                Err(e) => Err(e),
            }
        }),
    );

    tools.insert(
        "open_app",
        Box::new(|args| {
            let path = get_arg(&args, 0, "open_app")?;
            commands::open_app(path)
        }),
    );

    tools.insert(
        "close_app",
        Box::new(|args| {
            let path = get_arg(&args, 0, "close_app")?;
            commands::close_app(path)
        }),
    );

    tools.insert(
        "delete_path",
        Box::new(|args| {
            let path = get_arg(&args, 0, "delete_path")?;
            commands::delete_path(path)
        }),
    );

    tools.insert(
        "read_file",
        Box::new(|args| {
            let path = get_arg(&args, 0, "read_file")?;
            commands::read_file(path)
        }),
    );

    tools.insert(
        "list_processes",
        Box::new(|_| match commands::list_processes() {
            Ok(processes) => Ok(serde_json::to_string(&processes).unwrap_or("[]".into())),
            Err(e) => Err(e),
        }),
    );

    tools.insert(
        "get_system_info",
        Box::new(|_| {
            let info = commands::get_system_info();
            Ok(serde_json::to_string(&info).unwrap_or("[]".into()))
        }),
    );

    tools.insert(
        "write_file",
        Box::new(|args| {
            let path = get_arg(&args, 0, "write_file")?;
            let content = get_arg(&args, 1, "write_file")?;
            commands::write_file(path, content).map(|_| "write_file succeeded".into())
        }),
    );

    tools.insert(
        "copy_path",
        Box::new(|args| {
            let old_path = get_arg(&args, 0, "copy_path")?;
            let new_path = get_arg(&args, 1, "copy_path")?;
            commands::copy_path(old_path, new_path)
        }),
    );

    tools.insert(
        "move_path",
        Box::new(|args| {
            let old_path = get_arg(&args, 0, "move_path")?;
            let new_path = get_arg(&args, 1, "move_path")?;
            commands::move_path(old_path, new_path).map(|_| "move path succeeded".into())
        }),
    );

    tools.insert(
        "open_url",
        Box::new(|args| {
            let url = get_arg(&args, 0, "open_url")?;
            commands::open_url(url).map(|_| "open url succeeded".into())
        }),
    );

    tools
}

pub fn call_tools(tool_call: ToolCall) -> Result<String, String> {
    println!("Parsed ToolCall: {:?}", tool_call);
    let tools = build_tool_map();

    if let Some(tool_fn) = tools.get(tool_call.tool.as_str()) {
        tool_fn(tool_call.args.clone())
    } else {
        println!("Unknown tool: {}", tool_call.tool);
        Ok("Unknown tool".into())
    }
}

#[tauri::command]
pub async fn ai_tool_calling(prompt: Prompt) -> Result<String, String> {
    let response = get_ai_response(prompt.clone()).await?;
    println!("Raw Gemma response:\n{}", response);

let clean_response = response
    .replace("```json", "")
    .replace("```", "")
    .trim()
    .to_string();

    let tool_calls: Vec<ToolCall> =
        serde_json::from_str(&clean_response).map_err(|e| format!("Failed to parse JSON: {}", e))?;

    for tool_call in tool_calls {
        call_tools(tool_call)?;
    }

    Ok("All tool calls executed successfully".into())
}
