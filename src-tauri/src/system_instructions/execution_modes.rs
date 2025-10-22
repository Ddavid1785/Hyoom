pub fn build_execution_modes() -> String {
        r#"
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
  - Use {{{{PREVIOUS_RESULT}}}} in args to get the previous tool's output
  - Example: read a file, then write its contents somewhere else

"SelfReprompt": AI decides each next step based on the previous result.
  - Use for complex tasks where the next step depends on what you discover
  - Must include "end_goal" field describing what to achieve
  - Start with ONE tool, AI will decide the rest automatically
  - Example: organize files (need to see what files exist first, then decide how to organize)

CRITICAL: Never create multiple Independent groups. If you have 5 independent tasks, they ALL go in the same Independent group.
    "#.to_string()
}
