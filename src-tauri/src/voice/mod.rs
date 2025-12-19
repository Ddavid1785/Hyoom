pub mod capture;
pub mod transcribe;
pub mod vad;
pub mod wakeword;

use capture::AudioCapture;
use std::path::PathBuf;
use std::sync::{mpsc, Arc};
use transcribe::WhisperTranscriber;
use vad::VoiceDetector;

use crate::voice::wakeword::WakeWordDetector;

#[derive(Debug, Clone)]
pub enum VoiceEvent {
    WakeWordDetected,
    Transcribing,
    CommandTranscribed(String),
    Error(String),
    BackToListening,
}

#[derive(Debug)]
pub enum VoiceCommand {
    StartListening,
}

pub fn start_voice_thread(
    resource_dir: PathBuf,
) -> (mpsc::Sender<VoiceCommand>, mpsc::Receiver<VoiceEvent>) {
    let (event_tx, event_rx) = mpsc::channel();
    let (cmd_tx, cmd_rx) = mpsc::channel();

    std::thread::spawn(move || {
        log::info!("🎙️ Voice thread started!");

        // 1. Initialize Whisper
        let transcriber = match WhisperTranscriber::new(resource_dir.clone()) {
            Ok(t) => Arc::new(t),
            Err(e) => {
                log::error!("Whisper init error: {}", e);
                let _ = event_tx.send(VoiceEvent::Error(format!("Whisper init error: {}", e)));
                return;
            }
        };

        // 2. Initialize Vosk (Wake Word)
        let mut wakeword_detector = match WakeWordDetector::new(resource_dir) {
            Ok(w) => w,
            Err(e) => {
                log::error!("Vosk init error: {}", e);
                let _ = event_tx.send(VoiceEvent::Error(format!("Vosk init error: {}", e)));
                return;
            }
        };

        // 3. Initialize Audio
        let audio_capture = match AudioCapture::new() {
            Ok(ac) => ac,
            Err(e) => {
                log::error!("Audio init error: {}", e);
                let _ = event_tx.send(VoiceEvent::Error(format!("Audio init error: {}", e)));
                return;
            }
        };

        // 4. Initialize VAD
        let mut vad = match VoiceDetector::new() {
            Ok(v) => v,
            Err(e) => {
                log::error!("VAD init error: {}", e);
                let _ = event_tx.send(VoiceEvent::Error(format!("VAD init error: {}", e)));
                return;
            }
        };

        // Start Recording
        let (_stream, audio_rx) = match audio_capture.start_recording() {
            Ok(s) => s,
            Err(e) => {
                log::error!("Recording error: {}", e);
                let _ = event_tx.send(VoiceEvent::Error(format!("Recording error: {}", e)));
                return;
            }
        };

        const FRAME_SIZE: usize = 480; // 30ms at 16kHz
        const SILENCE_THRESHOLD_FRAMES: usize = 30; // ~1 second silence

        let mut buffer: Vec<f32> = Vec::with_capacity(FRAME_SIZE * 2);
        let mut speech_buffer: Vec<f32> = Vec::new();

        let mut is_recording_command = false;
        let mut silence_counter = 0;

        log::info!("👂 Listening for 'Hey Hyoom'...");

        loop {
            if let Ok(VoiceCommand::StartListening) = cmd_rx.try_recv() {
                log::info!("🖱️ Manual Trigger!");
                is_recording_command = true;
                silence_counter = 0;
                wakeword_detector.reset();
                speech_buffer.clear();
                let _ = event_tx.send(VoiceEvent::WakeWordDetected);
            }

            if let Ok(audio_chunk) = audio_rx.recv() {
                buffer.extend_from_slice(&audio_chunk);

                while buffer.len() >= FRAME_SIZE {
                    let frame: Vec<f32> = buffer.drain(..FRAME_SIZE).collect();
                    let frame_i16 = vad::f32_to_i16(&frame);

                    if is_recording_command {
                        // === MODE 1: RECORDING COMMAND (VAD + Whisper) ===

                        // Check for speech (to detect silence)
                        let is_speech = vad.is_speech(&frame_i16).unwrap_or(false);

                        speech_buffer.extend_from_slice(&frame);

                        if is_speech {
                            silence_counter = 0;
                        } else {
                            silence_counter += 1;
                        }

                        // Silence detected -> Stop and Transcribe
                        if silence_counter >= SILENCE_THRESHOLD_FRAMES {
                            log::debug!("🛑 Command Complete. Transcribing...");

                            let _ = event_tx.send(VoiceEvent::Transcribing);

                            match transcriber.transcribe_base(&speech_buffer) {
                                Ok(full_text) => {
                                    let final_command = clean_command(&full_text);

                                    if final_command.contains("[BLANK_AUDIO]")
                                        || final_command.trim().is_empty()
                                        || final_command.to_lowercase().trim() == "you"
                                    {
                                        log::debug!("🗑️ Discarding empty/blank audio");
                                        let _ = event_tx.send(VoiceEvent::BackToListening);
                                    } else {
                                        log::info!("📝 Result: '{}'", final_command);
                                        let _ = event_tx
                                            .send(VoiceEvent::CommandTranscribed(final_command));
                                        let _ = event_tx.send(VoiceEvent::BackToListening);
                                    }
                                }
                                Err(e) => {
                                    log::error!("Transcribe Error: {}", e);
                                    let _ = event_tx.send(VoiceEvent::BackToListening);
                                }
                            }

                            // Reset state
                            is_recording_command = false;
                            speech_buffer.clear();
                        }
                    } else {
                        // === MODE 2: WAITING FOR WAKE WORD (Vosk) ===

                        // We run Vosk on every chunk
                        if wakeword_detector.process_chunk(&frame_i16) {
                            log::info!("🎯 Wake Word Detected!");
                            let _ = event_tx.send(VoiceEvent::WakeWordDetected);

                            is_recording_command = true;
                            silence_counter = 0;
                            speech_buffer.clear();
                        }
                    }
                }
            }
        }
    });

    (cmd_tx, event_rx)
}

fn clean_command(text: &str) -> String {
    let lower = text.to_lowercase();
    let wake_words = ["hey hyoom", "hey hume", "hey human", "hey hoom", "hey home"];

    for ww in wake_words {
        if let Some(idx) = lower.find(ww) {
            let start = idx + ww.len();
            if start < text.len() {
                let remainder = &text[start..];
                let cleaned = remainder.trim_start_matches(|c: char| {
                    c == ',' || c == '.' || c == '!' || c == '?' || c == ' ' || c == ':'
                });
                return cleaned.to_string();
            }
            return "".to_string();
        }
    }
    text.to_string()
}
