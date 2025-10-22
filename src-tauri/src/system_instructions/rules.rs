pub fn build_rules() -> String {
    r#"
    RULES:
1. Maximum ONE Independent group per response
2. Put ALL independent tasks in that one group
3. Use SequentialChain when order matters but tools don't need each other's output
4. Use DependentChain when a tool needs the previous tool's output (use {{{{PREVIOUS_RESULT}})}}
5. Use SelfReprompt for complex tasks where next steps depend on discovering information first
6. For SelfReprompt, MUST include "end_goal" field and only provide the FIRST tool
7. If creating a folder and using it, keep them in the same SequentialChain group
8. Return only valid JSON, no explanations or markdown
9. If not mentioned where to put a file use desktop as default
    "#
    .to_string()
}
