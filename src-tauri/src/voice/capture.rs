use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::mpsc;

pub struct AudioCapture {
    target_sample_rate: u32,
}

pub type AudioStream = (cpal::Stream, mpsc::Receiver<Vec<f32>>);

impl AudioCapture {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            target_sample_rate: 16000,
        })
    }

    pub fn start_recording(&self) -> Result<AudioStream, Box<dyn std::error::Error>> {
        let host = cpal::default_host();

        let device = host
            .default_input_device()
            .ok_or("No input device available")?;

        println!("🎤 Input Device: {}", device.name().unwrap_or("Unknown".to_string()));

        let mut supported_configs_range = device.supported_input_configs()
            .map_err(|e| format!("Error querying configs: {}", e))?;

        let supported_config = supported_configs_range
            .next()
            .ok_or("Device has no supported configs")?
            .with_max_sample_rate();

        let err_fn = |err| eprintln!("❌ Stream error: {}", err);
        let sample_format = supported_config.sample_format();
        let config: cpal::StreamConfig = supported_config.into();

        println!("🔧 Device Config: {:?}Hz, {:?} channels, {:?}", 
                 config.sample_rate.0, config.channels, sample_format);

        let (tx, rx) = mpsc::channel();
        let target_rate = self.target_sample_rate as f32;
        let source_rate = config.sample_rate.0 as f32;
        let channels = config.channels as usize;

        let mut resampler_state = 0.0;

        let stream = match sample_format {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config,
                move |data: &[f32], _: &_| {
                    process_audio(data, channels, source_rate, target_rate, &tx, &mut resampler_state)
                },
                err_fn,
                None,
            )?,
            cpal::SampleFormat::I16 => device.build_input_stream(
                &config,
                move |data: &[i16], _: &_| {
                    let float_data: Vec<f32> = data.iter().map(|&s| s as f32 / 32768.0).collect();
                    process_audio(&float_data, channels, source_rate, target_rate, &tx, &mut resampler_state)
                },
                err_fn,
                None,
            )?,
            cpal::SampleFormat::U16 => device.build_input_stream(
                &config,
                move |data: &[u16], _: &_| {
                    let float_data: Vec<f32> = data.iter().map(|&s| (s as f32 - 32768.0) / 32768.0).collect();
                    process_audio(&float_data, channels, source_rate, target_rate, &tx, &mut resampler_state)
                },
                err_fn,
                None,
            )?,
            cpal::SampleFormat::U8 => device.build_input_stream(
                &config,
                move |data: &[u8], _: &_| {
                    let float_data: Vec<f32> = data.iter().map(|&s| (s as f32 - 128.0) / 128.0).collect();
                    process_audio(&float_data, channels, source_rate, target_rate, &tx, &mut resampler_state)
                },
                err_fn,
                None,
            )?,
            _ => return Err(format!("Unsupported sample format: {:?}", sample_format).into()),
        };

        stream.play()?;
        println!("✅ Audio capture started");

        Ok((stream, rx))
    }
}

fn process_audio(
    input: &[f32],
    channels: usize,
    source_rate: f32,
    target_rate: f32,
    tx: &mpsc::Sender<Vec<f32>>,
    resample_index: &mut f32,
) {
    let frame_count = input.len() / channels;
    let mut mono_data = Vec::with_capacity(frame_count);

    for i in 0..frame_count {
        let start = i * channels;
        let end = start + channels;
        let sum: f32 = input[start..end].iter().sum();
        mono_data.push(sum / channels as f32);
    }

    if (source_rate - target_rate).abs() < 1.0 {
        let _ = tx.send(mono_data);
        return;
    }

    let step = source_rate / target_rate;
    let mut output_buffer = Vec::new();

    while *resample_index < (mono_data.len() as f32 - 1.0) {
        let idx = *resample_index;
        let idx_floor = idx.floor() as usize;
        let frac = idx - idx_floor as f32;

        let sample_a = mono_data[idx_floor];
        let sample_b = mono_data[idx_floor + 1];
        let interpolated = sample_a + (sample_b - sample_a) * frac;

        output_buffer.push(interpolated);

        *resample_index += step;
    }

    *resample_index -= mono_data.len() as f32;

    if !output_buffer.is_empty() {
        let _ = tx.send(output_buffer);
    }
}