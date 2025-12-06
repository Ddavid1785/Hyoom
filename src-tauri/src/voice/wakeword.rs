use std::path::PathBuf;
use vosk::{DecodingState, Model, Recognizer};

pub struct WakeWordDetector {
    recognizer: Recognizer,
    consecutive_matches: i8,
}

impl WakeWordDetector {
    pub fn new(resource_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let dev_path = resource_dir.join("resources/vosk_model");
        let prod_path = resource_dir.join("vosk_model");

        let model_path = if dev_path.exists() {
            dev_path
        } else if prod_path.exists() {
            prod_path
        } else {
            return Err(format!(
                "Vosk model not found! Checked: \n1. {:?}\n2. {:?}",
                dev_path, prod_path
            )
            .into());
        };

        let mut model_str = model_path.to_string_lossy().to_string();

        #[cfg(windows)]
        {
            const PREFIX: &str = r"\\?\";
            if model_str.starts_with(PREFIX) {
                model_str = model_str[PREFIX.len()..].to_string();
            }
        }

        println!("🧠 Loading Vosk Wake Word Model from: {}", model_str);

        let model = Model::new(&*model_str).ok_or_else(|| {
            format!(
                "Could not create Vosk model. \nPath Exists: {}\nAttempted Path: {}",
                model_path.exists(),
                model_str
            )
        })?;

        let grammar = ["hey hume", "hey human", "hey whom", "hey home", "[unk]"];

        let mut recognizer = Recognizer::new_with_grammar(&model, 16000.0, &grammar)
            .ok_or("Could not create Vosk recognizer")?;

        recognizer.set_max_alternatives(0);
        recognizer.set_words(true);

        Ok(Self {
            recognizer,
            consecutive_matches: 0,
        })
    }

    pub fn process_chunk(&mut self, audio_i16: &[i16]) -> bool {
        let state = self.recognizer.accept_waveform(audio_i16);

        let text_to_check = match state {
            Ok(DecodingState::Running) => {
                let partial = self.recognizer.partial_result();
                partial.partial.to_string()
            }
            Ok(DecodingState::Finalized) => {
                let final_res = self.recognizer.final_result();
                match final_res {
                    vosk::CompleteResult::Single(s) => s.text.to_string(),
                    vosk::CompleteResult::Multiple(m) => m
                        .alternatives
                        .first()
                        .map(|a| a.text.to_string())
                        .unwrap_or_default(),
                }
            }
            _ => String::new(),
        };

        self.check_text_persistence(&text_to_check)
    }

    fn check_text_persistence(&mut self, text: &str) -> bool {
        if text.trim().is_empty() {
            if self.consecutive_matches > 0 {
                self.consecutive_matches -= 1;
            }
            return false;
        }

        let clean = text.to_lowercase();

        let is_match = clean.contains("hey hume")
            || clean.contains("hey human")
            || clean.contains("hey whom")
            || clean.contains("hey home");

        if is_match {
            self.consecutive_matches += 1;
            if self.consecutive_matches >= 4 {
                self.consecutive_matches = 0;
                self.recognizer.reset();
                return true;
            }
        } else {
            self.consecutive_matches = 0;
        }

        false
    }

    pub fn reset(&mut self) {
        self.recognizer.reset();
        self.consecutive_matches = 0;
    }
}
