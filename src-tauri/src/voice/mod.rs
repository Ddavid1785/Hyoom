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

// ✅ Added Debug, Clone (Fixes "field never read" warnings)
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum VoiceEvent {
    WakeWordDetected,
    CommandTranscribed(String),
    Error(String),
}

// Internal enum for the async thread
enum WakeWordResult {
    Detected,
    NotDetected,
    Error(String),
}

// ✅ Signature changed: We only return the Event Receiver now
pub fn start_voice_thread(
    resource_dir: PathBuf,
    app_handle: AppHandle,
) -> mpsc::Receiver<VoiceEvent> {
    
    let (event_tx, event_rx) = mpsc::channel();
    let (ww_result_tx, ww_result_rx) = mpsc::channel::<WakeWordResult>();

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

        // --- Constants ---
        const FRAME_SIZE: usize = 480; 
        const SILENCE_THRESHOLD_FRAMES: usize = 50; 
        const WAKE_WORD_WINDOW_SIZE: usize = 48000; 
        
        // --- State ---
        let mut buffer: Vec<f32> = Vec::with_capacity(WAKE_WORD_WINDOW_SIZE * 2);
        let mut speech_buffer: Vec<f32> = Vec::new();
        
        let mut is_recording_command = false;
        let mut silence_counter = 0;
        
        let mut is_checking_wake_word = false; 
        let mut last_vad_activity = Instant::now(); 

        println!("👂 Listening for 'Hey Hyoom'...");

        loop {
            // Check async wake word result
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
                    WakeWordResult::NotDetected => {},
                    WakeWordResult::Error(e) => eprintln!("Wake word check error: {}", e),
                }
            }

            // Process Audio
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
                                        let clean = text.to_lowercase().replace(&['.', ',', '!', '?'][..], "");
                                        if clean.contains("hey hyoom") || clean.contains("hey hume") || clean.contains("hey human") {
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

                        if silence_counter >= SILENCE_THRESHOLD_FRAMES {
                            println!("🛑 Command Complete. Processing...");
                            
                            match transcriber.transcribe_base(&speech_buffer) {
                                Ok(full_text) => {
                                    let final_command = clean_command(&full_text);
                                    println!("📝 Transcribed: '{}'", final_command);

                                    if !final_command.trim().is_empty() {
                                        let cmd_clone = final_command.clone();
                                        
                                        // Async Deno Dispatch
                                        let rt = tokio::runtime::Runtime::new().unwrap();
                                        rt.block_on(async move {
                                            println!("🚀 Sending to Deno..."); 
                                            match send_to_deno(&cmd_clone).await {
                                                Ok(_) => println!("✅ Sent successfully"),
                                                Err(e) => eprintln!("❌ Deno send failed: {}", e)
                                            }
                                        });

                                        let _ = event_tx.send(VoiceEvent::CommandTranscribed(final_command));
                                    }
                                }
                                Err(e) => eprintln!("Transcribe Error: {}", e),
                            }

                            is_recording_command = false;
                            speech_buffer.clear();
                            println!("👂 Listening...");
                        }
                    }
                }
            }
        }
    });

    event_rx
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

async fn send_to_deno(message: &str) -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({
        "message": { "role": "user", "content": message }
    });
    client.post("http://localhost:3000/chat") 
        .json(&payload)
        .timeout(Duration::from_secs(60))
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}