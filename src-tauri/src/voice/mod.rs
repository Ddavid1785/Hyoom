// src/mod.rs
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

pub enum VoiceCommand {
    StartListening,
    StopListening,
    Shutdown,
}

pub enum VoiceEvent {
    WakeWordDetected,
    CommandTranscribed(String),
    Error(String),
    Log(String), // Helper for debugging in frontend
}

// Internal event to communicate back from the thread spawning
enum WakeWordResult {
    Detected,
    NotDetected,
    Error(String),
}

pub fn start_voice_thread(
    resource_dir: PathBuf,
    app_handle: AppHandle,
) -> (mpsc::Sender<VoiceCommand>, mpsc::Receiver<VoiceEvent>) {
    let (cmd_tx, _cmd_rx) = mpsc::channel();
    let (event_tx, event_rx) = mpsc::channel();

    // Channel to receive results from the async wake word check threads
    let (ww_result_tx, ww_result_rx) = mpsc::channel::<WakeWordResult>();

    std::thread::spawn(move || {
        println!("🎙️ Voice thread started!");

        // --- Initialization ---
        // Wrap transcriber in Arc/Mutex so we can share it with check threads
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
        const FRAME_SIZE: usize = 480; // 30ms
        const SILENCE_THRESHOLD_FRAMES: usize = 50; // ~1.5s
        const WAKE_WORD_WINDOW_SIZE: usize = 48000; // 3s

        // --- State ---
        let mut buffer: Vec<f32> = Vec::with_capacity(WAKE_WORD_WINDOW_SIZE * 2);
        let mut speech_buffer: Vec<f32> = Vec::new();

        let mut is_recording_command = false;
        let mut silence_counter = 0;

        // Optimization flags
        let mut is_checking_wakeword = false;
        let mut last_vad_activity = Instant::now(); // Track when we last heard noise

        println!("👂 Listening for 'Hey Hyoom'...");

        loop {
            // 1. Check if a wake word check finished
            if let Ok(result) = ww_result_rx.try_recv() {
                is_checking_wakeword = false; // Unlock checking
                match result {
                    WakeWordResult::Detected => {
                        println!("🎯 Wake Word Detected via Async Thread!");
                        let _ = event_tx.send(VoiceEvent::WakeWordDetected);

                        // Focus Window
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_focus();
                        }

                        is_recording_command = true;
                        silence_counter = 0;
                        // Note: We intentionally keep the current speech_buffer content
                        // so the command includes what was said immediately after "Hey Hyoom"
                    }
                    WakeWordResult::NotDetected => {
                        // Just carry on
                    }
                    WakeWordResult::Error(e) => eprintln!("Wake word check error: {}", e),
                }
            }

            // 2. Process Audio
            if let Ok(audio_chunk) = audio_rx.recv() {
                buffer.extend_from_slice(&audio_chunk);

                while buffer.len() >= FRAME_SIZE {
                    let frame: Vec<f32> = buffer.drain(..FRAME_SIZE).collect();
                    let frame_i16 = vad::f32_to_i16(&frame);

                    let is_speech = vad.is_speech(&frame_i16).unwrap_or(false);

                    // Keep track of recent noise to avoid checking wake word on pure silence
                    if is_speech {
                        last_vad_activity = Instant::now();
                    }

                    // Always buffer for processing
                    speech_buffer.extend_from_slice(&frame);

                    if !is_recording_command {
                        // === MODE: LISTENING FOR WAKE WORD ===

                        // Cap buffer size (Rolling Window)
                        if speech_buffer.len() > WAKE_WORD_WINDOW_SIZE {
                            let overflow = speech_buffer.len() - WAKE_WORD_WINDOW_SIZE;
                            speech_buffer.drain(0..overflow);
                        }

                        // LOGIC: Only check if:
                        // 1. We aren't already checking (prevent backlog)
                        // 2. We have a full 3s buffer
                        // 3. We heard noise recently (within last 1s) - HUGE OPTIMIZATION
                        if !is_checking_wakeword
                            && speech_buffer.len() >= WAKE_WORD_WINDOW_SIZE
                            && last_vad_activity.elapsed() < Duration::from_secs(1)
                        {
                            is_checking_wakeword = true;

                            // Spawn a thread to run Whisper (Non-blocking!)
                            let buffer_clone = speech_buffer.clone();
                            let transcriber_clone = transcriber.clone();
                            let tx_clone = ww_result_tx.clone();

                            std::thread::spawn(move || {
                                match transcriber_clone.transcribe_tiny(&buffer_clone) {
                                    Ok(text) => {
                                        let clean = text
                                            .to_lowercase()
                                            .replace(&['.', ',', '!', '?'][..], "");
                                        if clean.contains("hey hyoom") || clean.contains("hey hume")
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

                        if silence_counter >= SILENCE_THRESHOLD_FRAMES {
                            println!("🛑 Command Complete. Processing...");

                            // Run the heavy model
                            // Note: We can block here briefly because we are about to reset anyway,
                            // but ideally, this should also be threaded if you want to immediately start listening again.
                            // For now, blocking is okay as the user expects a pause.

                            match transcriber.transcribe_base(&speech_buffer) {
                                Ok(full_text) => {
                                    let final_command = clean_command(&full_text);
                                    println!("📝 Transcribed: '{}'", final_command);

                                    if !final_command.trim().is_empty() {
                                        let cmd_clone = final_command.clone();

                                        // ✅ FIX: Use block_on instead of spawn
                                        // This keeps the runtime alive exactly long enough to finish the request.
                                        let rt = tokio::runtime::Runtime::new().unwrap();
                                        rt.block_on(async move {
                println!("🚀 Sending to Deno..."); // Log start
                match send_to_deno(&cmd_clone).await {
                    Ok(_) => println!("✅ Sent successfully"),
                    Err(e) => {
                        eprintln!("❌ Deno send failed: {}", e);
                        // Help debug connection refused errors
                        if e.is_connect() {
                            eprintln!("⚠️ Could not connect to localhost:3000. Is Deno running?");
                        }
                    }
                }
            });

                                        let _ = event_tx
                                            .send(VoiceEvent::CommandTranscribed(final_command));
                                    }
                                }
                                Err(e) => eprintln!("Transcribe Error: {}", e),
                            }

                            // Reset
                            is_recording_command = false;
                            speech_buffer.clear();
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
    let wake_words = ["hey hyoom", "hey hume", "hey human"];
    for ww in wake_words {
        if let Some(idx) = lower.find(ww) {
            let start = idx + ww.len();
            if start < text.len() {
                return text[start..].trim().to_string();
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
    client
        .post("http://localhost:3000/chat")
        .json(&payload)
        .timeout(Duration::from_secs(5))
        .send()
        .await?;
    Ok(())
}
