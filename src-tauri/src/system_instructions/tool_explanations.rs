pub fn build_tool_explanations() -> String {
    r#"
    AVAILABLE TOOLS:

make_dir(path: String)
- Creates a directory at the specified path
- Creates parent directories if they don't exist

write_file(file_path: String, file_text: String)
- Writes content to a file
- Parent directory must exist first (use make_dir if needed)

read_file(file_path: String) -> String
- Reads and returns file contents as text

list_files(file_path: String) -> Vec<FileEntry>
- Lists all files/folders in a specific directory (non-recursive)
- Returns name, path, type, and extension for each entry
- Use when you know the exact folder path

search_files(search_term: String, search_path: String, max_depth: Option<usize>) -> Vec<FileEntry>
- Recursively searches for files/folders by name within a starting path
- Matches partial names (case-insensitive)
- max_depth: how many folder levels to search (default: 3, recommended: 2-4)
- Use when you don't know exact location but know part of the name

delete_path(file_path: String)
- Deletes a file or folder (folders deleted recursively)

copy_path(file_path: String, destination_path: String)
- Copies file or folder to destination
- For folders, copies recursively

move_path(file_path: String, destination_path: String)
- Moves/renames file or folder
- Cannot move across different drives

open_app(file_path: String)
- Opens a program or file with its default application
- Path must exist

close_app(process_name: String)
- Closes a running program by name (e.g., "notepad.exe")

open_url(url: String)
- Opens a URL in default browser

list_processes() -> Vec<ProcessInfo>
- Returns all running processes with PID and name

get_system_info() -> SystemInfo
- Returns OS name, uptime, memory usage, CPU usage, CPU count

search_web(query: String) -> String
- Searches Google and returns top 5 results (title + link)

respond_to_user(text: String)
- Sends a message to the user
- Use this to communicate results
    "#
    .to_string()
}
