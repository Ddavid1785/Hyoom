use std::collections::HashMap;

use crate::types::{ExecutionMode, Prompt, TaskRequest, ToolCall, ToolFn};
use crate::{commands, settings, system_instructions};
use reqwest::Client;
use serde_json::json;

async fn send_ai_request(
    client: &Client,
    content: &str,
    images: Option<Vec<String>>,
    api_key: &str,
) -> Result<String, String> {
    let url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    let mut parts = vec![json!({"text": content})];

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
    let settings = settings::load_settings()?;
    let api_key = settings.gemini_api_key.as_str();

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
    let full_prompt = format!(
        "{}\nUser: {}",
        system_instructions::system_prompt::build_full_prompt(),
        prompt.text
    );
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
    tools.insert(
        "search_files",
        Box::new(|args| {
            let search_term = get_arg(&args, 0, "search_files")?;
            let search_path = get_arg(&args, 1, "search_files")?;
            let max_depth_str = get_arg(&args, 2, "search_files")?;

            let max_depth = max_depth_str.parse::<usize>().ok();

            commands::search_files(search_term, search_path, max_depth)
                .map(|results| serde_json::to_string(&results).unwrap_or_default())
        }),
    );
        tools.insert(
        "zip_path",
        Box::new(|args| {
            let file_path = get_arg(&args, 0, "zip_path")?;
            commands::zip_path(file_path).map(|_| String::new())
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
                system_instructions::system_prompt::build_self_reprompt(),
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
