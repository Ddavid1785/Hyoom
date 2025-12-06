fn main() {
println!("cargo:rustc-link-search=native=."); 

    tauri_build::build()
}
