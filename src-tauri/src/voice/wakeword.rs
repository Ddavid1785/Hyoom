use std::path::PathBuf;
use vosk::{DecodingState, Model, Recognizer, CompleteResult};

pub struct WakeWordDetector {
    recognizer: Recognizer,
}

impl WakeWordDetector {
    pub fn new(resource_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let model_path = resource_dir.join("resources/vosk_model");
        let model_str = model_path.to_string_lossy();
        
        println!("🧠 Loading Vosk Wake Word Model from: {}", model_str);

        let model = Model::new(model_str).ok_or("Could not create Vosk model")?;
        
        let grammar = ["hey hume", "hey human", "hey whom", "hey home", "[unk]"];

        let mut recognizer = Recognizer::new_with_grammar(&model, 16000.0, &grammar)
            .ok_or("Could not create Vosk recognizer")?;

        recognizer.set_max_alternatives(0);
        recognizer.set_words(true);
        
        Ok(Self { recognizer })
    }

    pub fn process_chunk(&mut self, audio_i16: &[i16]) -> bool {
        let text_to_check: Option<String> = match self.recognizer.accept_waveform(audio_i16) {
            Ok(DecodingState::Running) => {
                let result = self.recognizer.partial_result();
                Some(result.partial.to_string())
            }
            Ok(DecodingState::Finalized) => {
                let result = self.recognizer.final_result();
                match result {
                    CompleteResult::Single(s) => Some(s.text.to_string()),
                    CompleteResult::Multiple(m) => {
                        m.alternatives.first().map(|a| a.text.to_string())
                    }
                }
            }
            _ => None,
        };
        if let Some(text) = text_to_check {
            return self.check_text(&text);
        }

        false
    }

    fn check_text(&mut self, text: &str) -> bool {
        if text.trim().is_empty() { return false; }
        
        let clean = text.to_lowercase();
        
         println!("Vosk: {}", clean);

        if clean.contains("hey hume") 
           || clean.contains("hey human") 
           || clean.contains("hey whom") 
           || clean.contains("hey home") {
            
            self.recognizer.reset();
            return true;
        }
        false
    }
    
    pub fn reset(&mut self) {
        self.recognizer.reset();
    }
}