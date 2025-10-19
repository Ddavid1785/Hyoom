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

"Independent": Tools run at the same time in parallel.
  - Use for tasks that don't depend on each other
  - ALL independent tasks must go in ONE group together
  - Examples: reading a file, opening a URL, listing files

"SequentialChain": Tools run one at a time in order.
  - Use when one task needs another to finish first
  - Example: creating a folder, then writing a file inside it

CRITICAL: Never create multiple Independent groups. If you have 5 independent tasks, they ALL go in the same Independent group.

AVAILABLE TOOLS:

"make_dir" - creates directory
"write_file" - writes to file (folder must exist first!)
"read_file" - reads file contents
"list_files" - lists directory contents
"delete_path" - deletes file/folder
"copy_path" - copies file/folder
"move_path" - moves file/folder
"open_app" - opens program
"close_app" - closes program
"open_url" - opens URL in browser
"list_processes" - lists running processes
"get_system_info" - returns system info
"respond_to_user" - sends message to user

Desktop path: C:\\Users\\David\\Desktop

EXAMPLES:

User: "list files, open YouTube, and read a file"
CORRECT:
{
  "groups": [
    {
      "mode": "Independent",
      "tools": [
        {"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]},
        {"tool": "open_url", "args": ["https://youtube.com"]},
        {"tool": "read_file", "args": ["C:\\Users\\David\\Desktop\\notes.txt"]}
      ]
    }
  ]
}

INCORRECT:
{
  "groups": [
    {"mode": "Independent", "tools": [{"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]}]},
    {"mode": "Independent", "tools": [{"tool": "open_url", "args": ["https://youtube.com"]}]},
    {"mode": "Independent", "tools": [{"tool": "read_file", "args": ["C:\\Users\\David\\Desktop\\notes.txt"]}]}
  ]
}
Why incorrect? All three are independent, so they must be in ONE group, not three separate groups.

---

User: "create folder called work and put a file in it"
CORRECT:
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
Why? Folder must exist before file can be written inside it.

---

User: "create 2 folders (work and chill) with a file in each"
CORRECT:
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\work"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\work\\file.txt", "Work"]}
      ]
    },
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\chill"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\chill\\file.txt", "Chill"]}
      ]
    }
  ]
}
Why? Each folder+file is self-contained, so they can run in parallel as separate groups.

---

User: "list files, open YouTube, and create a folder with a file"
CORRECT:
{
  "groups": [
    {
      "mode": "Independent",
      "tools": [
        {"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]},
        {"tool": "open_url", "args": ["https://youtube.com"]}
      ]
    },
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\work"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\work\\todo.txt", "Tasks"]}
      ]
    }
  ]
}
Why? Independent tasks in one group, dependent tasks in another.

INCORRECT:
{
  "groups": [
    {"mode": "Independent", "tools": [{"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]}]},
    {"mode": "Independent", "tools": [{"tool": "open_url", "args": ["https://youtube.com"]}]},
    {"mode": "SequentialChain", "tools": [...]}
  ]
}
Why incorrect? list_files and open_url are both independent, so they must share ONE Independent group.

---

User: "copy file A to B, then delete A"
CORRECT:
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
Why? Must copy before deleting.

RULES:
1. Maximum ONE Independent group per response
2. Put ALL independent tasks in that one group
3. Each SequentialChain group should contain dependent tasks only
4. If creating a folder and using it, keep them in the same SequentialChain group
5. Return only valid JSON, no explanations or markdown
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
            "hermes-3-llama-3.1-8b",
            &prompt.text,
            Some(vec![cleaned]),
        )
        .await
    } else {
        send_ai_request(&client, "hermes-3-llama-3.1-8b", &prompt.text, None).await
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
            commands::open_url(url).map(|_| String::new())
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
