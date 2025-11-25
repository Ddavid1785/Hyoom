use hound::{WavSpec, WavWriter};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

pub struct WhisperTranscriber {
    whisper_path: PathBuf,
    tiny_model_path: PathBuf,
    base_model_path: PathBuf,
    temp_dir: PathBuf,
}

impl WhisperTranscriber {
    pub fn new(resource_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let whisper_path = resource_dir.join("bin").join("whisper-cli.exe");
        let tiny_model_path = resource_dir.join("resources/voice_models/ggml-tiny.en.bin");
        let base_model_path = resource_dir.join("resources/voice_models/ggml-base.en.bin");
        let temp_dir = std::env::temp_dir().join("hyoom_audio");

        std::fs::create_dir_all(&temp_dir)?;

        let strip_unc = |path: PathBuf| -> PathBuf {
            PathBuf::from(path.to_string_lossy().replace(r"\\?\", ""))
        };

        let whisper_path = strip_unc(whisper_path);
        let tiny_model_path = strip_unc(tiny_model_path);
        let base_model_path = strip_unc(base_model_path);

        if !whisper_path.exists() {
            return Err(format!("Whisper executable not found at {:?}", whisper_path).into());
        }
        if !tiny_model_path.exists() {
            return Err(format!("Tiny model not found at {:?}", tiny_model_path).into());
        }
        if !base_model_path.exists() {
            return Err(format!("Base model not found at {:?}", base_model_path).into());
        }

        println!("✅ Whisper initialized");

        Ok(Self {
            whisper_path,
            tiny_model_path,
            base_model_path,
            temp_dir,
        })
    }

    pub fn transcribe_tiny(&self, audio: &[f32]) -> Result<String, Box<dyn std::error::Error>> {
        self.transcribe_internal(audio, &self.tiny_model_path)
    }

    pub fn transcribe_base(&self, audio: &[f32]) -> Result<String, Box<dyn std::error::Error>> {
        self.transcribe_internal(audio, &self.base_model_path)
    }

    fn transcribe_internal(
        &self,
        audio: &[f32],
        model_path: &Path,
    ) -> Result<String, Box<dyn std::error::Error>> {
        if audio.is_empty() {
            return Err("Empty audio buffer".into());
        }

        let uuid = uuid::Uuid::new_v4();
        let wav_path = self.temp_dir.join(format!("temp_{}.wav", uuid));

        self.save_wav(&wav_path, audio)?;

        let bin_dir = self
            .whisper_path
            .parent()
            .ok_or("Could not get whisper bin directory")?;

        let path_var = std::env::var("PATH").unwrap_or_default();
        let new_path = format!("{};{}", bin_dir.display(), path_var);

        let mut child = Command::new(&self.whisper_path)
            .env("PATH", new_path)
            .current_dir(bin_dir)
            .args([
                "-m",
                model_path.to_str().unwrap(),
                "-f",
                wav_path.to_str().unwrap(),
                "--no-timestamps",
                "--threads",
                "4",
                "--processors",
                "1",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()?;

        let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
        let reader = BufReader::new(stdout);

        let output_lines: Vec<String> = reader.lines().map_while(Result::ok).collect();

        let status = child.wait()?;
        let _ = std::fs::remove_file(&wav_path); // clean up temp file

        if !status.success() {
            return Err(format!("Whisper failed with exit code: {:?}", status.code()).into());
        }

        let output_text = output_lines.join("\n");
        let transcription = self.parse_whisper_output(&output_text);

        if transcription.is_empty() {
            return Err("No transcription returned".into());
        }

        Ok(transcription)
    }

    fn save_wav(&self, path: &Path, audio: &[f32]) -> Result<(), Box<dyn std::error::Error>> {
        let spec = WavSpec {
            channels: 1,
            sample_rate: 16000,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = WavWriter::create(path, spec)?;

        for &sample in audio {
            let sample_i16 = (sample * 32767.0).clamp(-32768.0, 32767.0) as i16;
            writer.write_sample(sample_i16)?;
        }

        writer.finalize()?;
        Ok(())
    }

    fn parse_whisper_output(&self, output: &str) -> String {
        output
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .filter(|line| !line.starts_with("whisper_"))
            .filter(|line| !line.contains("processing"))
            .filter(|line| !line.starts_with('['))
            .collect::<Vec<_>>()
            .join(" ")
            .trim()
            .to_string()
    }
}
