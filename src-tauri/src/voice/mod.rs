pub mod capture;
pub mod transcribe;
pub mod vad;

use std::path::PathBuf;
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

use capture::AudioCapture;
use transcribe::WhisperTranscriber;
use vad::VoiceDetector;

#[derive(Debug, Clone)]
pub enum VoiceEvent {
    WakeWordDetected,
    PartialTranscription(String),
    CommandTranscribed(String),
    Error(String),
    BackToListening,
}

#[derive(Debug)]
pub enum VoiceCommand {
    StartListening,
}

enum WakeWordResult {
    Detected,
    NotDetected,
    Error(String),
}

enum PartialResult {
    Success(String),
    Error(String),
}

pub fn start_voice_thread(
    resource_dir: PathBuf,
    app_handle: AppHandle,
) -> (mpsc::Sender<VoiceCommand>, mpsc::Receiver<VoiceEvent>) {
    let (event_tx, event_rx) = mpsc::channel();
    let (cmd_tx, cmd_rx) = mpsc::channel();
    let (ww_result_tx, ww_result_rx) = mpsc::channel::<WakeWordResult>();
    let (partial_tx, partial_rx) = mpsc::channel::<PartialResult>();

    std::thread::spawn(move || {
        println!("🎙️ Voice thread started!");

        let transcriber = match WhisperTranscriber::new(resource_dir) {
            Ok(t) => Arc::new(t),
            Err(e) => {
                let _ = event_tx.send(VoiceEvent::Error(format!("Whisper init error: {}", e)));
                return;
            }
        };

        let audio_capture = match AudioCapture::new() {
            Ok(ac) => ac,
            Err(e) => {
                let _ = event_tx.send(VoiceEvent::Error(format!("Audio init error: {}", e)));
                return;
            }
        };

        let mut vad = match VoiceDetector::new() {
            Ok(v) => v,
            Err(e) => {
                let _ = event_tx.send(VoiceEvent::Error(format!("VAD init error: {}", e)));
                return;
            }
        };

        let (_stream, audio_rx) = match audio_capture.start_recording() {
            Ok(s) => s,
            Err(e) => {
                let _ = event_tx.send(VoiceEvent::Error(format!("Recording error: {}", e)));
                return;
            }
        };

        const FRAME_SIZE: usize = 480;
        const SILENCE_THRESHOLD_FRAMES: usize = 25;
        const WAKE_WORD_WINDOW_SIZE: usize = 48000;

        let mut buffer: Vec<f32> = Vec::with_capacity(WAKE_WORD_WINDOW_SIZE * 2);
        let mut speech_buffer: Vec<f32> = Vec::new();

        let mut is_recording_command = false;
        let mut silence_counter = 0;

        let mut is_checking_wake_word = false;
        let mut last_vad_activity = Instant::now();

        let mut last_partial_time = Instant::now();
        let mut is_processing_partial = false;

        println!("👂 Listening for 'Hey Hyoom'...");

        loop {
            if let Ok(VoiceCommand::StartListening) = cmd_rx.try_recv() {
                println!("🖱️ Manual Trigger received!");

                is_recording_command = true;
                silence_counter = 0;

                let _ = event_tx.send(VoiceEvent::WakeWordDetected);

                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.set_focus();
                }
            }

            if let Ok(result) = ww_result_rx.try_recv() {
                is_checking_wake_word = false;
                match result {
                    WakeWordResult::Detected => {
                        println!("🎯 Wake Word Detected!");
                        let _ = event_tx.send(VoiceEvent::WakeWordDetected);

                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_focus();
                        }

                        is_recording_command = true;
                        silence_counter = 0;
                    }
                    WakeWordResult::NotDetected => {}
                    WakeWordResult::Error(e) => eprintln!("Wake word check error: {}", e),
                }
            }

            if let Ok(result) = partial_rx.try_recv() {
                is_processing_partial = false;
                match result {
                    PartialResult::Success(text) => {
                        if !text.trim().is_empty() {
                            let _ = event_tx.send(VoiceEvent::PartialTranscription(text));
                        }
                    }
                     PartialResult::Error(e) => {
                        eprintln!("⚠️ Partial Transcription Error: {}", e); 
                    }
                }
            }

            if let Ok(audio_chunk) = audio_rx.recv() {
                buffer.extend_from_slice(&audio_chunk);

                while buffer.len() >= FRAME_SIZE {
                    let frame: Vec<f32> = buffer.drain(..FRAME_SIZE).collect();
                    let frame_i16 = vad::f32_to_i16(&frame);

                    let is_speech = vad.is_speech(&frame_i16).unwrap_or(false);

                    if is_speech {
                        last_vad_activity = Instant::now();
                    }

                    speech_buffer.extend_from_slice(&frame);

                    if !is_recording_command {
                        // === MODE: LISTENING FOR WAKE WORD ===
                        if speech_buffer.len() > WAKE_WORD_WINDOW_SIZE {
                            let overflow = speech_buffer.len() - WAKE_WORD_WINDOW_SIZE;
                            speech_buffer.drain(0..overflow);
                        }

                        if !is_checking_wake_word
                            && speech_buffer.len() >= WAKE_WORD_WINDOW_SIZE
                            && last_vad_activity.elapsed() < Duration::from_secs(1)
                        {
                            is_checking_wake_word = true;

                            let buffer_clone = speech_buffer.clone();
                            let transcriber_clone = transcriber.clone();
                            let tx_clone = ww_result_tx.clone();

                            std::thread::spawn(move || {
                                match transcriber_clone.transcribe_tiny(&buffer_clone) {
                                    Ok(text) => {
                                        let clean = text
                                            .to_lowercase()
                                            .replace(&['.', ',', '!', '?'][..], "");
                                        if clean.contains("hey hyoom")
                                            || clean.contains("hey hume")
                                            || clean.contains("hey human")
                                        {
                                            let _ = tx_clone.send(WakeWordResult::Detected);
                                        } else {
                                            let _ = tx_clone.send(WakeWordResult::NotDetected);
                                        }
                                    }
                                    Err(e) => {
                                        let _ = tx_clone.send(WakeWordResult::Error(e.to_string()));
                                    }
                                }
                            });
                        }
                    } else {
                        // === MODE: RECORDING COMMAND ===
                        if is_speech {
                            silence_counter = 0;
                        } else {
                            silence_counter += 1;
                        }

                        if !is_processing_partial
                            && last_partial_time.elapsed().as_millis() > 500
                            && speech_buffer.len() > 16000
                        // At least 1 second of audio
                        {
                            is_processing_partial = true;
                            last_partial_time = Instant::now();

                            let buffer_clone = speech_buffer.clone();
                            let transcriber_clone = transcriber.clone();
                            let p_tx = partial_tx.clone();

                            std::thread::spawn(move || {
                                match transcriber_clone.transcribe_tiny(&buffer_clone) {
                                    Ok(text) => {
                                        let _ = p_tx.send(PartialResult::Success(text));
                                    }
                                    Err(e) => {
                                        let _ = p_tx.send(PartialResult::Error(e.to_string()));
                                    }
                                }
                            });
                        }

                        if silence_counter >= SILENCE_THRESHOLD_FRAMES {
                            println!("🛑 Command Complete. Processing...");

                            match transcriber.transcribe_base(&speech_buffer) {
                                Ok(full_text) => {
                                    let final_command = clean_command(&full_text);
                                    println!("📝 Transcribed: '{}'", final_command);

                                    if !final_command.trim().is_empty() {
                                        let _ = event_tx
                                            .send(VoiceEvent::CommandTranscribed(final_command));
                                    }
                                }
                                Err(e) => eprintln!("Transcribe Error: {}", e),
                            }

                            is_recording_command = false;
                            is_processing_partial = false;
                            speech_buffer.clear();
                            let _ = event_tx.send(VoiceEvent::BackToListening);
                            println!("👂 Listening...");
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
    let wake_words = ["hey hyoom", "hey hume", "hey human", "hey hoom"];

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
