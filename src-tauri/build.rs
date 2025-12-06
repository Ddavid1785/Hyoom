use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("Failed to get CARGO_MANIFEST_DIR");
    let manifest_path = PathBuf::from(&manifest_dir);
    
    let vosk_dir = manifest_path.join("resources").join("vosk_dlls");
    
    println!("cargo:rustc-link-search=native={}", vosk_dir.display());

    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    let target_dir = manifest_path.join("target").join(&profile);
    
    let _ = fs::create_dir_all(&target_dir);

    let dlls = vec![
        "libvosk.dll",
        "libgcc_s_seh-1.dll",
        "libstdc++-6.dll",
        "libwinpthread-1.dll",
    ];

    for dll in dlls {
        let src = vosk_dir.join(dll);
        let dest = target_dir.join(dll);

        if src.exists() {
            match fs::copy(&src, &dest) {
                Ok(_) => println!("✅ Copied {} to {:?}", dll, dest),
                Err(e) => println!("cargo:warning=Failed to copy {}: {}", dll, e),
            }
        } else {
            println!("cargo:warning=⚠️ FILE NOT FOUND: {}", src.display());
            println!("cargo:warning=Please check if you have an extra subfolder inside 'vosk_dlls'");
        }
    }

    tauri_build::build();
}