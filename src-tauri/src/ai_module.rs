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
      "mode": "Independent" or "SequentialChain" or "DependentChain" or "SelfReprompt",
      "tools": [
        {"tool": "tool_name", "args": ["arg1", "arg2"]}
      ],
      "end_goal": "optional - only for SelfReprompt mode"
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
  - Tools don't use each other's results
  - Example: creating a folder, then writing a file inside it

"DependentChain": Tools run one at a time, passing results to the next tool.
  - Use when a tool needs the OUTPUT from the previous tool
  - Use {{PREVIOUS_RESULT}} in args to get the previous tool's output
  - Example: read a file, then write its contents somewhere else

"SelfReprompt": AI decides each next step based on the previous result.
  - Use for complex tasks where the next step depends on what you discover
  - Must include "end_goal" field describing what to achieve
  - Start with ONE tool, AI will decide the rest automatically
  - Example: organize files (need to see what files exist first, then decide how to organize)

CRITICAL: Never create multiple Independent groups. If you have 5 independent tasks, they ALL go in the same Independent group.

AVAILABLE TOOLS:

"make_dir" - creates directory
"write_file" - writes to file (folder must exist first!)
"read_file" - reads file contents and returns them
"list_files" - lists directory contents and returns them
"delete_path" - deletes file/folder
"copy_path" - copies file/folder
"move_path" - moves file/folder
"open_app" - opens program
"close_app" - closes program
"open_url" - opens URL in browser
"list_processes" - lists running processes and returns them
"get_system_info" - returns system info
"respond_to_user" - sends message to user
"search_web" - searches the web and returns top 5 results (titles and links)

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
Why? Folder must exist before file can be written inside it. Use SequentialChain because we don't need the folder creation result.

---

User: "read file A and write its contents to file B"
CORRECT:
{
  "groups": [
    {
      "mode": "DependentChain",
      "tools": [
        {"tool": "read_file", "args": ["C:\\Users\\David\\Desktop\\A.txt"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\B.txt", "{{PREVIOUS_RESULT}}"]}
      ]
    }
  ]
}
Why? The second tool needs the OUTPUT from the first tool. {{PREVIOUS_RESULT}} gets replaced with the file contents.

INCORRECT:
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "read_file", "args": ["C:\\Users\\David\\Desktop\\A.txt"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\B.txt", "some text"]}
      ]
    }
  ]
}
Why incorrect? This would just write "some text", not the contents of A.txt. Need DependentChain with {{PREVIOUS_RESULT}}.

---

User: "organize my desktop files by type"
CORRECT:
{
  "groups": [
    {
      "mode": "SelfReprompt",
      "end_goal": "organize desktop files by type into appropriate folders",
      "tools": [
        {"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]}
      ]
    }
  ]
}
Why? You need to see what files exist before deciding how to organize them. SelfReprompt will automatically decide the next steps (create folders, move files, etc.) based on what it finds. The end_goal tells the AI what to achieve.

INCORRECT:
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]},
        {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\Images"]}
      ]
    }
  ]
}
Why incorrect? You don't know what folders to create until you see what file types exist. Use SelfReprompt to decide dynamically.

---

User: "find and delete all .tmp files on my desktop"
CORRECT:
{
  "groups": [
    {
      "mode": "SelfReprompt",
      "end_goal": "find and delete all .tmp files on desktop",
      "tools": [
        {"tool": "list_files", "args": ["C:\\Users\\David\\Desktop"]}
      ]
    }
  ]
}
Why? Need to see what files exist, then delete only the .tmp ones. SelfReprompt will list files, identify .tmp files, and delete them one by one. The end_goal guides the AI's decisions.

---

User: "get system info and write it to a log file"
CORRECT:
{
  "groups": [
    {
      "mode": "DependentChain",
      "tools": [
        {"tool": "get_system_info", "args": []},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\system_log.txt", "{{PREVIOUS_RESULT}}"]}
      ]
    }
  ]
}
Why? get_system_info returns data, and write_file needs that data. Use {{PREVIOUS_RESULT}} to pass it.

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
Why? Must copy before deleting. Use SequentialChain because we don't need the copy result.

---

User: "list all processes and write them to a file"
CORRECT:
{
  "groups": [
    {
      "mode": "DependentChain",
      "tools": [
        {"tool": "list_processes", "args": []},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\processes.txt", "{{PREVIOUS_RESULT}}"]}
      ]
    }
  ]
}
Why? list_processes returns data, write_file needs that data. Use DependentChain with {{PREVIOUS_RESULT}}.

INCORRECT:
{
  "groups": [
    {
      "mode": "SequentialChain",
      "tools": [
        {"tool": "list_processes", "args": []},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\processes.txt", "{{PREVIOUS_RESULT}}"]}
      ]
    }
  ]
}
Why incorrect? Using {{PREVIOUS_RESULT}} requires DependentChain, not SequentialChain!

User: "search for Python tutorials and save the results to a file"
CORRECT:
{
  "groups": [
    {
      "mode": "DependentChain",
      "tools": [
        {"tool": "search_web", "args": ["Python tutorials"]},
        {"tool": "write_file", "args": ["C:\\Users\\David\\Desktop\\search_results.txt", "{{PREVIOUS_RESULT}}"]}
      ]
    }
  ]
}
Why? Saving ALL search results to a file - DependentChain passes all results through.

User: "play the song circles on youtube"
CORRECT:
{
  "groups": [
    {
      "mode": "SelfReprompt",
      "end_goal": "play circles song on youtube",
      "tools": [
        {"tool": "search_web", "args": ["circles song youtube"]}
      ]
    }
  ]
}
Why? Need to search, then pick the right link, then open it - multiple decision steps. Use SelfReprompt.

RULES:
1. Maximum ONE Independent group per response
2. Put ALL independent tasks in that one group
3. Use SequentialChain when order matters but tools don't need each other's output
4. Use DependentChain when a tool needs the previous tool's output (use {{PREVIOUS_RESULT}})
5. Use SelfReprompt for complex tasks where next steps depend on discovering information first
6. For SelfReprompt, MUST include "end_goal" field and only provide the FIRST tool
7. If creating a folder and using it, keep them in the same SequentialChain group
8. Return only valid JSON, no explanations or markdown
"#;

const SELF_REPROMPT_INSTRUCTIONS: &str = r#"
You are deciding the next step to achieve a goal. Reply with ONE tool call in JSON format.

Available tools:
"make_dir" - creates directory
"write_file" - writes to file (folder must exist first!)
"read_file" - reads file contents and returns them
"list_files" - lists directory contents and returns them
"delete_path" - deletes file/folder
"copy_path" - copies file/folder
"move_path" - moves file/folder
"open_app" - opens program
"close_app" - closes program
"open_url" - opens URL in browser
"list_processes" - lists running processes and returns them
"get_system_info" - returns system info
"respond_to_user" - sends message to user
"search_web" - searches the web and returns top 5 results (titles and links)

Desktop path: C:\\Users\\David\\Desktop

Format: {"tool": "tool_name", "args": ["arg1", "arg2"]}

When the goal is completely achieved, reply: {"done": true}

Example:
Goal: Organize desktop files
Last: list_files at C:\\Desktop, Result: [file1.txt, photo.jpg, doc.pdf]
Next: {"tool": "make_dir", "args": ["C:\\Users\\David\\Desktop\\Documents"]}
"#;

async fn send_ai_request(
    client: &Client,
    content: &str,
    images: Option<Vec<String>>,
    api_key: &str,
) -> Result<String, String> {
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    let mut parts = vec![json!({"text": content})];

    // Add image if provided
    if let Some(imgs) = images {
        for img in imgs {
            parts.push(json!({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img
                }
            }));
        }
    }

    let response = client
        .post(url)
        .header("x-goog-api-key", api_key)
        .header("Content-Type", "application/json")
        .json(&json!({
            "contents": [{
                "parts": parts
            }]
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

    result["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid response format".to_string())
}

pub async fn call_ai(prompt: Prompt, client: Client) -> Result<String, String> {
    let api_key = "AIzaSyD-MR3wktGCly6h64DH_f7lstxCTxA3iKQ";

    if let Some(img_b64) = &prompt.base_image {
        let cleaned = img_b64
            .trim()
            .replace("data:image/png;base64,", "")
            .replace("data:image/jpeg;base64,", "")
            .replace("data:image/jpg;base64,", "")
            .replace("data:image/webp;base64,", "");

        send_ai_request(&client, &prompt.text, Some(vec![cleaned]), api_key).await
    } else {
        send_ai_request(&client, &prompt.text, None, api_key).await
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
    // refractor the whole function to be async later
    tools.insert(
        "search_web",
        Box::new(|args| {
            let query = get_arg(&args, 0, "search_web")?;
            tokio::task::block_in_place(|| {
                tokio::runtime::Handle::current().block_on(commands::search_web(query))
            })
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
    println!("Raw response:\n{}", response);

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
                ExecutionMode::DependentChain => {
                    let mut last_result = String::new();

                    for mut tool in group.tools {
                        tool.args = tool
                            .args
                            .iter()
                            .map(|arg| {
                                if arg == "{{PREVIOUS_RESULT}}" {
                                    last_result.clone()
                                } else {
                                    arg.clone()
                                }
                            })
                            .collect();

                        match call_tools(tool).await {
                            Ok(result) => {
                                last_result = result;
                                println!("Tool result: {}", last_result);
                            }
                            Err(e) => {
                                eprintln!("DependentChain tool error: {}", e);
                                break;
                            }
                        }
                    }
                }
                ExecutionMode::SelfReprompt => {
                    let end_goal = group.end_goal.clone().unwrap_or("Complete the task".into());
                    let max_steps = 10;
                    let mut step_count = 0;

                    if let Some(first_tool) = group.tools.first() {
                        let mut last_tool = first_tool.clone();
                        let mut last_result = match call_tools(last_tool.clone()).await {
                            Ok(result) => result,
                            Err(e) => {
                                eprintln!("SelfReprompt initial tool error: {}", e);
                                return;
                            }
                        };
                        println!(
                            "SelfReprompt step 1: executed {:?}, result: {}",
                            last_tool, last_result
                        );

                        while step_count < max_steps {
                            step_count += 1;

                            let prompt = format!(
                "{}\n\nGoal: {}\nLast action: {:?}\nResult: {}\n\nWhat's the next step to achieve the goal?",
                SELF_REPROMPT_INSTRUCTIONS,
                end_goal,
                last_tool,
                last_result
            );

                            let ai_response = match get_ai_response(Prompt {
                                text: prompt,
                                base_image: None,
                            })
                            .await
                            {
                                Ok(response) => response,
                                Err(e) => {
                                    eprintln!("SelfReprompt AI call error: {}", e);
                                    break;
                                }
                            };

                            let clean_response = ai_response
                                .replace("```json", "")
                                .replace("```", "")
                                .trim()
                                .to_string();

                            if let Ok(done_check) =
                                serde_json::from_str::<serde_json::Value>(&clean_response)
                            {
                                if done_check
                                    .get("done")
                                    .and_then(|v| v.as_bool())
                                    .unwrap_or(false)
                                {
                                    println!("SelfReprompt completed after {} steps", step_count);
                                    break;
                                }
                            }

                            match serde_json::from_str::<ToolCall>(&clean_response) {
                                Ok(next_tool) => {
                                    last_tool = next_tool.clone();
                                    match call_tools(next_tool.clone()).await {
                                        Ok(result) => {
                                            last_result = result;
                                            println!(
                                                "SelfReprompt step {}: executed {:?}, result: {}",
                                                step_count + 1,
                                                next_tool,
                                                last_result
                                            );
                                        }
                                        Err(e) => {
                                            eprintln!(
                                                "SelfReprompt tool error at step {}: {}",
                                                step_count + 1,
                                                e
                                            );
                                            break;
                                        }
                                    }
                                }
                                Err(e) => {
                                    eprintln!("Failed to parse SelfReprompt response: {}", e);
                                    break;
                                }
                            }
                        }

                        if step_count >= max_steps {
                            eprintln!("SelfReprompt hit max steps ({})", max_steps);
                        }
                    }
                }
            }
        });
        group_handles.push(handle);
    }

    // wait for all groups to finish
    for handle in group_handles {
        if let Err(e) = handle.await {
            eprintln!("Group execution error: {}", e);
        }
    }

    Ok("All tool calls executed successfully".into())
}
