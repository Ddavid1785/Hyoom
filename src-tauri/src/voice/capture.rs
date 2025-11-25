use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use dasp::{interpolate::linear::Linear, signal, Signal};
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

        println!("Using: {}", device.name()?);

        let default_config = device.default_input_config()?;
        let device_sample_rate = default_config.sample_rate().0;
        let channels = default_config.channels() as usize;

        println!("{}Hz ({}ch) → {}Hz (mono)", 
                 device_sample_rate, channels, self.target_sample_rate);

        let config = cpal::StreamConfig {
            channels: default_config.channels(),
            sample_rate: cpal::SampleRate(device_sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        let (tx, rx) = mpsc::channel();
        let target_rate = self.target_sample_rate as f64;
        let source_rate = device_sample_rate as f64;

        let stream = device.build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                let mono_data = if channels == 2 {
                    data.chunks(2)
                        .map(|chunk| (chunk[0] + chunk.get(1).unwrap_or(&0.0)) / 2.0)
                        .collect::<Vec<f32>>()
                } else {
                    data.to_vec()
                };

                let resampled = resample(&mono_data, source_rate, target_rate);
                let _ = tx.send(resampled);
            },
            |err| eprintln!("❌ Audio stream error: {}", err),
            None,
        )?;

        stream.play()?;
        println!("✅ Audio capture started");

        Ok((stream, rx))
    }
}

fn resample(input: &[f32], source_rate: f64, target_rate: f64) -> Vec<f32> {
    let ratio = source_rate / target_rate;

    if (ratio - 1.0).abs() < 0.01 {
        return input.to_vec();
    }

    let mut source = signal::from_iter(input.iter().copied());
    let interp = Linear::new(source.next(), source.next());

    source
        .from_hz_to_hz(interp, source_rate, target_rate)
        .take((input.len() as f64 / ratio) as usize)
        .collect()
}