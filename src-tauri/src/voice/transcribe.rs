use std::path::PathBuf;
use std::ptr;
use whisper_rs::{
    set_log_callback, FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters,
};

pub struct WhisperTranscriber {
    ctx_base: WhisperContext,
}

impl WhisperTranscriber {
    pub fn new(resource_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        unsafe {
            unsafe extern "C" fn log_callback(
                _level: i32,
                _msg: *const i8,
                _user_data: *mut std::ffi::c_void,
            ) {
            }

            set_log_callback(Some(log_callback), ptr::null_mut());
        }

        let dev_path = resource_dir.join("resources/voice_models/ggml-base.en.bin");
        let prod_path = resource_dir.join("voice_models/ggml-base.en.bin");

        let base_model_path = if dev_path.exists() {
            dev_path
        } else if prod_path.exists() {
            prod_path
        } else {
            return Err(format!(
                "Whisper model not found! Checked: \n1. {:?}\n2. {:?}",
                dev_path, prod_path
            )
            .into());
        };

        println!("🧠 Loading Whisper Base model...");

        // Load Base
        let params = WhisperContextParameters::default();
        let ctx_base = WhisperContext::new_with_params(&base_model_path.to_string_lossy(), params)
            .map_err(|e| format!("Failed to load Base model: {}", e))?;

        whisper_rs::print_system_info();

        println!("✅ Models loaded successfully!");

        Ok(Self { ctx_base })
    }

    pub fn transcribe_base(&self, audio: &[f32]) -> Result<String, Box<dyn std::error::Error>> {
        self.run_inference(&self.ctx_base, audio)
    }

    fn run_inference(
        &self,
        ctx: &WhisperContext,
        audio: &[f32],
    ) -> Result<String, Box<dyn std::error::Error>> {
        let mut state = ctx
            .create_state()
            .map_err(|e| format!("Failed to create state: {}", e))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

        params.set_n_threads(4);
        params.set_translate(false);
        params.set_language(Some("en"));

        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        state
            .full(params, audio)
            .map_err(|e| format!("Whisper inference failed: {}", e))?;

        let num_segments = state.full_n_segments();
        let mut text = String::new();

        for i in 0..num_segments {
            if let Some(segment) = state.get_segment(i) {
                let segment_text = segment
                    .to_str_lossy()
                    .map_err(|e| format!("String error: {}", e))?;
                text.push_str(&segment_text);
            }
        }

        Ok(text.trim().to_string())
    }
}
