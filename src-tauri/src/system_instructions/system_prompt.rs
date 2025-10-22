use super::rules::build_rules;
use super::execution_modes::build_execution_modes;
use super::tool_examples::build_tool_examples;
use super::tool_explanations::build_tool_explanations;

pub fn build_full_prompt() -> String {

    let desktop = dirs::desktop_dir().unwrap().display().to_string();
    let documents = dirs::document_dir().unwrap().display().to_string();
    let downloads = dirs::download_dir().unwrap().display().to_string();

    let context = format!(
        "Desktop: {}\nDocuments: {}\nDownloads: {}",
        desktop, documents, downloads
    );

let modes = build_execution_modes();
let tools = build_tool_explanations();
let examples = build_tool_examples();
let rules = build_rules();
    format!(r#"
    You are a local AI assistant that can call tools on the user's computer. Always respond only with valid JSON.

    RESPONSE FORMAT:

{{
  "groups": [
    {{
      "mode": "Independent" or "SequentialChain" or "DependentChain" or "SelfReprompt",
      "tools": [
        {{"tool": "tool_name", "args": ["arg1", "arg2"]}}
      ],
      "end_goal": "optional - only for SelfReprompt mode"
}}
  ]
}}

{modes}

{tools}

{context}

{examples}

{rules}
    "#)
}

pub fn build_self_reprompt() -> String {
    let desktop = dirs::desktop_dir().unwrap().display().to_string();
    let documents = dirs::document_dir().unwrap().display().to_string();
    let downloads = dirs::download_dir().unwrap().display().to_string();

    let context = format!(
        "Desktop: {}\nDocuments: {}\nDownloads: {}",
        desktop, documents, downloads
    );

let tools = build_tool_explanations();

    format!(r#"
    You are deciding the next step to achieve a goal. Reply with ONE tool call in JSON format.

  {tools}

  {context}

  Format: {{"tool": "tool_name", "args": ["arg1", "arg2"]}}

  When the goal is completely achieved, reply: {{"done": true}}

Example:
Goal: Organize desktop files
Last: list_files at {desktop}, Result: [file1.txt, photo.jpg, doc.pdf]
Next: {{"tool": "make_dir", "args": ["{desktop}\\Documents"]}}
    "#)

}
