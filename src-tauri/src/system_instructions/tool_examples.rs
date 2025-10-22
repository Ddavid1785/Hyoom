pub fn build_tool_examples() -> String {
    let desktop = dirs::desktop_dir().unwrap().display().to_string();
    let documents = dirs::document_dir().unwrap().display().to_string();
    let downloads = dirs::download_dir().unwrap().display().to_string();

    format!(
        r#"
    EXAMPLES:

User: "list files, open YouTube, and read a file"
CORRECT:
{{
  "groups": [
    {{
      "mode": "Independent",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}},
        {{"tool": "open_url", "args": ["https://youtube.com"]}},
        {{"tool": "read_file", "args": ["{desktop}\\notes.txt"]}}
      ]
}}
  ]
}}

INCORRECT:
{{
  "groups": [
    {{"mode": "Independent", "tools": [{{"tool": "list_files", "args": ["{desktop}"]}}]}},
    {{"mode": "Independent", "tools": [{{"tool": "open_url", "args": ["https://youtube.com"]}}]}},
    {{"mode": "Independent", "tools": [{{"tool": "read_file", "args": ["{desktop}\\notes.txt"]}}]}}
  ]
}}
Why incorrect? All three are independent, so they must be in ONE group, not three separate groups.

---

User: "find my resume file"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "locate and return the path to the user's resume file",
      "tools": [
        {{"tool": "search_files", "args": ["resume", "{documents}", "3"]}}
      ]
    }}
  ]
}}
Why? You don't know where the resume is, so search Documents folder (and 3 levels deep) for anything with "resume" in the name. SelfReprompt will handle next steps based on what's found (multiple results? ask user which one, etc.)

---

INCORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "list_files", "args": ["{documents}"]}},
        {{"tool": "list_files", "args": ["{documents}\\Work"]}},
        {{"tool": "list_files", "args": ["{documents}\\Personal"]}}
      ]
    }}
  ]
}}
Why incorrect? You're guessing folder names and making multiple calls. search_files does this in one call and searches recursively.

---

User: "I have a folder called ProjectX somewhere on my D drive, can you find it?"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "locate the ProjectX folder on D drive",
      "tools": [
        {{"tool": "search_files", "args": ["ProjectX", "D:\\", "4"]}}
      ]
    }}
  ]
}}
Why? Searching entire D drive for "ProjectX" folder. Depth 4 is reasonable for a drive search. SelfReprompt will present the results to user.

---

User: "create a backup of all my Python files from my projects folder"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "find all Python files in projects folder and create backups",
      "tools": [
        {{"tool": "search_files", "args": [".py", "{documents}\\Projects", "5"]}}
      ]
    }}
  ]
}}
Why? search_files will find ALL .py files recursively within Projects folder. Then SelfReprompt decides how to back them up.

---

User: "list files on my desktop and in my documents folder"
CORRECT:
{{
  "groups": [
    {{
      "mode": "Independent",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}},
        {{"tool": "list_files", "args": ["{documents}"]}}
      ]
    }}
  ]
  }}
Why? Both tasks are independent and refer to different paths, so they go in the same Independent group. Use {desktop} and {documents} explicitly.
  
INCORRECT:
{{
  "groups": [
    {{"mode": "Independent", "tools": [{{"tool": "list_files", "args": ["{desktop}"]}}]}},
    {{"mode": "Independent", "tools": [{{"tool": "list_files", "args": ["{documents}"]}}]}}
  ]
    }}
Why incorrect? Still just two independent tasks — must be in one Independent group.

---

User: "create a folder called reports in my documents and put a text file in it"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "make_dir", "args": ["{documents}\\reports"]}},
        {{"tool": "write_file", "args": ["{documents}\\reports\\summary.txt", "Report summary"]}}
      ]
    }}
  ]
}}

---

User: "create folder called work in downloads and put a file in it"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "make_dir", "args": ["{downloads}\\work"]}},
        {{"tool": "write_file", "args": ["{downloads}\\work\\notes.txt", "Hello"]}}
      ]
}}
  ]
}}
Why? Folder must exist before file can be written inside it. Use SequentialChain because we don't need the folder creation result.

---

User: "read file A and write its contents to file B"
CORRECT:
{{
  "groups": [
    {{
      "mode": "DependentChain",
      "tools": [
        {{"tool": "read_file", "args": ["{desktop}\\A.txt"]}},
        {{"tool": "write_file", "args": ["{desktop}\\B.txt", "{{{{PREVIOUS_RESULT}}"]}}}}
      ]
}}
  ]
}}
Why? The second tool needs the OUTPUT from the first tool. {{{{PREVIOUS_RESULT}}}} gets replaced with the file contents.

INCORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "read_file", "args": ["{desktop}\\A.txt"]}},
        {{"tool": "write_file", "args": ["{desktop}\\B.txt", "some text"]}}
      ]
}}
  ]
}}
Why incorrect? This would just write "some text", not the contents of A.txt. Need DependentChain with {{{{PREVIOUS_RESULT}}.}}

---

User: "organize my desktop files by type"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "organize desktop files by type into appropriate folders",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}}
      ]
}}
  ]
}}
Why? You need to see what files exist before deciding how to organize them. SelfReprompt will automatically decide the next steps (create folders, move files, etc.) based on what it finds. The end_goal tells the AI what to achieve.

INCORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}},
        {{"tool": "make_dir", "args": ["{desktop}\\Images"]}}
      ]
}}
  ]
}}
Why incorrect? You don't know what folders to create until you see what file types exist. Use SelfReprompt to decide dynamically.

---

User: "find and delete all .tmp files on my desktop"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "find and delete all .tmp files on desktop",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}}
      ]
}}
  ]
}}
Why? Need to see what files exist, then delete only the .tmp ones. SelfReprompt will list files, identify .tmp files, and delete them one by one. The end_goal guides the AI's decisions.

---

User: "get system info and write it to a log file"
CORRECT:
{{
  "groups": [
    {{
      "mode": "DependentChain",
      "tools": [
        {{"tool": "get_system_info", "args": []}},
        {{"tool": "write_file", "args": ["{desktop}\\system_log.txt", "{{{{PREVIOUS_RESULT}}"]}}}}
      ]
}}
  ]
}}
Why? get_system_info returns data, and write_file needs that data. Use {{{{PREVIOUS_RESULT}}}} to pass it.

---

User: "create 2 folders (work and chill) with a file in each"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "make_dir", "args": ["{desktop}\\work"]}},
        {{"tool": "write_file", "args": ["{desktop}\\work\\file.txt", "Work"]}}
      ]
}},
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "make_dir", "args": ["{desktop}\\chill"]}},
        {{"tool": "write_file", "args": ["{desktop}\\chill\\file.txt", "Chill"]}}
      ]
}}
  ]
}}
Why? Each folder+file is self-contained, so they can run in parallel as separate groups.

---

User: "list files, open YouTube, and create a folder with a file"
CORRECT:
{{
  "groups": [
    {{
      "mode": "Independent",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}},
        {{"tool": "open_url", "args": ["https://youtube.com"]}}
      ]
}},
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "make_dir", "args": ["{desktop}\\work"]}},
        {{"tool": "write_file", "args": ["{desktop}\\work\\todo.txt", "Tasks"]}}
      ]
}}
  ]
}}
Why? Independent tasks in one group, dependent tasks in another.

INCORRECT:
{{
  "groups": [
    {{"mode": "Independent", "tools": [{{"tool": "list_files", "args": ["{desktop}"]}}]}},
    {{"mode": "Independent", "tools": [{{"tool": "open_url", "args": ["https://youtube.com"]}}]}},
    {{"mode": "SequentialChain", "tools": [...]}}
  ]
}}
Why incorrect? list_files and open_url are both independent, so they must share ONE Independent group.

---

User: "copy file A to B, then delete A"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "copy_path", "args": ["{desktop}\\A.txt", "{desktop}\\B.txt"]}},
        {{"tool": "delete_path", "args": ["{desktop}\\A.txt"]}}
      ]
}}
  ]
}}
Why? Must copy before deleting. Use SequentialChain because we don't need the copy result.

---

User: "list all processes and write them to a file"
CORRECT:
{{
  "groups": [
    {{
      "mode": "DependentChain",
      "tools": [
        {{"tool": "list_processes", "args": []}},
        {{"tool": "write_file", "args": ["{desktop}\\processes.txt", "{{{{PREVIOUS_RESULT}}"]}}}}
      ]
}}
  ]
}}
Why? list_processes returns data, write_file needs that data. Use DependentChain with {{{{PREVIOUS_RESULT}}.}}

INCORRECT:
{{
  "groups": [
    {{
      "mode": "SequentialChain",
      "tools": [
        {{"tool": "list_processes", "args": []}},
        {{"tool": "write_file", "args": ["{desktop}\\processes.txt", "{{{{PREVIOUS_RESULT}}"]}}}}
      ]
}}
  ]
}}
Why incorrect? Using {{{{PREVIOUS_RESULT}}}} requires DependentChain, not SequentialChain!

---

User: "save my notes in the school folder"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "find the 'school' folder and save a notes file in it",
      "tools": [
        {{"tool": "list_files", "args": ["{desktop}"]}}
      ]
    }}
  ]
}}
Why?
The user mentioned a folder ("school") that is not one of the known default paths (Desktop, Documents, Downloads).

---

User: "search for Python tutorials and save the results to a file in downloads"
CORRECT:
{{
  "groups": [
    {{
      "mode": "DependentChain",
      "tools": [
        {{"tool": "search_web", "args": ["Python tutorials"]}},
        {{"tool": "write_file", "args": ["{downloads}\\search_results.txt", "{{{{PREVIOUS_RESULT}}"]}}}}
      ]
}}
  ]
}}
Why? Saving ALL search results to a file - DependentChain passes all results through.

User: "play the song circles on youtube"
CORRECT:
{{
  "groups": [
    {{
      "mode": "SelfReprompt",
      "end_goal": "play circles song on youtube",
      "tools": [
        {{"tool": "search_web", "args": ["circles song youtube"]}}
      ]
}}
  ]
}}
Why? Need to search, then pick the right link, then open it - multiple decision steps. Use SelfReprompt.
    "#)
}
