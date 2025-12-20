use webrtc_vad::{Vad, VadMode};

pub struct VoiceDetector {
    vad: Vad,
}

impl VoiceDetector {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let vad = Vad::new_with_rate_and_mode(webrtc_vad::SampleRate::Rate16kHz, VadMode::Quality);

        Ok(Self { vad })
    }

    /// frame must be 160 (10ms), 320 (20ms), or 480 (30ms) samples at 16kHz
    pub fn is_speech(&mut self, audio: &[i16]) -> Result<bool, Box<dyn std::error::Error>> {
        if matches!(audio.len(), 160 | 320 | 480) {
            self.vad
                .is_voice_segment(audio)
                .map_err(|e| format!("VAD error: {:?}", e).into())
        } else {
            Err(format!(
                "Invalid frame size: {} (expected 160, 320, or 480)",
                audio.len()
            )
            .into())
        }
    }
}

/// convert f32 audio samples to i16 for VAD processing
pub fn f32_to_i16(samples: &[f32]) -> Vec<i16> {
    samples
        .iter()
        .map(|&s| (s * 32767.0).clamp(-32768.0, 32767.0) as i16)
        .collect()
}
