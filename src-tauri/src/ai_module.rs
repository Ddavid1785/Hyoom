use std::collections::HashMap;

use crate::commands;
use crate::types::{ExecutionMode, Prompt, TaskRequest, ToolCall, ToolFn};
use reqwest::Client;
use serde_json::json;

const SYSTEM_INSTRUCTIONS: &str = r#"
You are a local AI assistant that can call tools on the user's computer. Always respond only with valid JSON.

RESPONSE FORMAT:

{
  "groups": [
    {
      "mode": "Independent" or "SequentialChain",
      "tools": [
        {"tool": "tool_name", "args": ["arg1", "arg2"]}
      ]
    }
  ]
}

EXECUTION MODES:

"Independent": Tools run in parallel (at the same time). Use when:
  - Tasks are completely unrelated
  - No task needs another task to finish first
  - Example: Opening YouTube and turning on lights

"SequentialChain": Tools run one by one in order. Use when:
  - One task must complete before the next can start
  - A later task depends on an earlier task finishing
  - Example: Creating a folder THEN writing a file inside it (the folder must exist first!)

CRITICAL RULES:
- If a file/folder is being created and then used, you MUST use SequentialChain
- Each group should be SELF-CONTAINED - if you're creating folder X and files in folder X, they should ALL be in the SAME group
- Multiple groups run in parallel, so never split dependent tasks across groups

AVAILABLE TOOLS:

"make_dir": creates a directory at absolute path
"write_file": writes text to file at absolute path (folder must exist first!)
"read_file": reads text file contents
"list_files": lists files/folders in directory
"delete_path": deletes file or folder
"copy_path": copies file/folder (source, destination)
"move_path": moves file/folder (source, destination)
"open_app": opens program from absolute path
"close_app": closes running application
"open_url": opens URL in browser
"list_processes": lists running processes
"get_system_info": returns OS, memory, CPU info
"respond_to_user": sends message to user

EXAMPLES:

User: "Create a folder and write a file inside it"
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\work"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\work\\notes.txt", "Hello"]}
      ]
    }
  ]
}
Why? Folder must exist before file can be created inside it.

User: "Create 2 folders called work and chill, and put a text file in each"
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\work"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\work\\file1.txt", "Work stuff"]}
      ]
    },
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\chill"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\chill\\file2.txt", "Chill stuff"]}
      ]
    }
  ]
}
Why? Each folder+file pair is in its own group. This way both groups can run in parallel without conflicts.

User: "Open YouTube and Spotify"
{
  "groups": [
    {
      "mode": "Independent",
      "tools": [
        {"tool": "open_url", "args": ["https://youtube.com"]},
        {"tool": "open_app", "args": ["C:\\Program Files\\Spotify\\Spotify.exe"]}
      ]
    }
  ]
}
Why? These tasks don't depend on each other.

User: "Create a folder with a file in it, and also open YouTube"
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\docs"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\docs\\todo.txt", "Buy milk"]}
      ]
    },
    {
      "mode": "Independent",
      "tools": [
        {"tool": "open_url", "args": ["https://youtube.com"]}
      ]
    }
  ]
}
Why? The folder+file are dependent (same group), but YouTube is unrelated (separate group).

User: "Copy file A to B, then delete A"
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "copy_path", "args": ["C:\\Users\\David\\Desktop\\A.txt", "C:\\Users\\David\\Desktop\\B.txt"]},
        {"tool": "delete_path", "args": ["C:\\Users\\David\\Desktop\\A.txt"]}
      ]
    }
  ]
}
Why? Must copy before deleting, otherwise the file is gone.

RULES:
- Always return valid JSON, no markdown or explanations
- Desktop path is always: C:\\Users\\David\\Desktop
- Keep related tasks (folder + its files) in the SAME group
- Use separate groups only when tasks are truly independent
- Think: "Does this folder and its files all belong together?" If yes → same group
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

    // LM Studio uses OpenAI format for images (different from Ollama)
    if let Some(imgs) = images {
        // For vision models, need to format as content array
        message["content"] = json!([
            {"type": "text", "text": content},
            {"type": "image_url", "image_url": {"url": format!("data:image/jpeg;base64,{}", imgs[0])}}
        ]);
    }

    let response = client
        .post("http://localhost:1234/v1/chat/completions") // Changed URL
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

    // LM Studio response format is different
    result["choices"][0]["message"]["content"]
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
            "meta-llama-3.1-8b-instruct",
            &prompt.text,
            Some(vec![cleaned]),
        )
        .await
    } else {
        send_ai_request(&client, "meta-llama-3.1-8b-instruct", &prompt.text, None).await
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
            commands::make_dir(path).map(|_| String::new())
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
            commands::open_app(path).map(|_| String::new())
        }),
    );

    tools.insert(
        "close_app",
        Box::new(|args| {
            let path = get_arg(&args, 0, "close_app")?;
            commands::close_app(path).map(|_| String::new())
        }),
    );

    tools.insert(
        "delete_path",
        Box::new(|args| {
            let path = get_arg(&args, 0, "delete_path")?;
            commands::delete_path(path).map(|_| String::new())
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
            commands::copy_path(old_path, new_path).map(|_| String::new())
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

pub async fn call_tools(tool_call: ToolCall) -> Result<String, String> {
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

    let task_request: TaskRequest = serde_json::from_str(&clean_response)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let mut group_handles = vec![];

    for group in task_request.groups {
        let handle = tokio::spawn(async move {
            match group.mode {
                ExecutionMode::Independent => {
                    let mut handles = vec![];

                    for tool in group.tools {
                        let handle = tokio::spawn(async move { call_tools(tool).await });
                        handles.push(handle);
                    }

                    for handle in handles {
                        match handle.await {
                            Ok(Ok(result)) => println!("Tool result: {}", result),
                            Ok(Err(e)) => eprintln!("Tool error: {}", e),
                            Err(e) => eprintln!("Task join error: {}", e),
                        }
                    }
                }
                ExecutionMode::SequentialChain => {
                    for tool in group.tools {
                        if let Err(e) = call_tools(tool).await {
                            eprintln!("Sequential tool error: {e}");
                            break;
                        }
                    }
                }
                ExecutionMode::DependentChain => {}
                ExecutionMode::SelfReprompt => {}
            }
        });
        group_handles.push(handle);
    }

    // Wait for all groups to finish
    for handle in group_handles {
        if let Err(e) = handle.await {
            eprintln!("Group execution error: {}", e);
        }
    }

    Ok("All tool calls executed successfully".into())
}
