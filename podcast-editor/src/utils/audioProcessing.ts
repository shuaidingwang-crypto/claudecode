import { AudioSegment } from '../types';

// Load audio file and decode it
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

// Apply noise reduction and normalization (basic cleaning)
export async function cleanAudio(audioBuffer: AudioBuffer): Promise<{ buffer: AudioBuffer; blob: Blob }> {
  const audioContext = new AudioContext();

  // Create an offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Create source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Apply a high-pass filter to remove low-frequency noise
  const highPassFilter = offlineContext.createBiquadFilter();
  highPassFilter.type = 'highpass';
  highPassFilter.frequency.value = 80; // Remove frequencies below 80Hz

  // Apply compression for volume normalization
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Connect the audio graph
  source.connect(highPassFilter);
  highPassFilter.connect(compressor);
  compressor.connect(offlineContext.destination);

  source.start();
  const cleanedBuffer = await offlineContext.startRendering();

  // Convert to blob
  const blob = await audioBufferToBlob(cleanedBuffer);

  return { buffer: cleanedBuffer, blob };
}

// Detect silence and segment audio based on pauses
export function detectSegments(audioBuffer: AudioBuffer, silenceThreshold = 0.01, minSilenceDuration = 0.5): number[] {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const minSilenceSamples = minSilenceDuration * sampleRate;

  const segmentBoundaries: number[] = [0]; // Start with beginning
  let silenceStart = -1;
  let inSilence = false;

  for (let i = 0; i < channelData.length; i++) {
    const amplitude = Math.abs(channelData[i]);

    if (amplitude < silenceThreshold) {
      if (!inSilence) {
        silenceStart = i;
        inSilence = true;
      }
    } else {
      if (inSilence && silenceStart !== -1) {
        const silenceDuration = i - silenceStart;
        if (silenceDuration >= minSilenceSamples) {
          // Found a significant silence, mark this as a segment boundary
          const boundaryTime = (silenceStart + i) / 2 / sampleRate;
          segmentBoundaries.push(boundaryTime);
        }
        inSilence = false;
        silenceStart = -1;
      }
    }
  }

  // Add the end of the audio
  segmentBoundaries.push(audioBuffer.duration);

  return segmentBoundaries;
}

// Create audio segments from boundaries
export async function createSegments(
  audioBuffer: AudioBuffer,
  boundaries: number[],
  originalBlob: Blob
): Promise<Omit<AudioSegment, 'transcript' | 'summary'>[]> {
  const segments: Omit<AudioSegment, 'transcript' | 'summary'>[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const startTime = boundaries[i];
    const endTime = boundaries[i + 1];
    const duration = endTime - startTime;

    // Skip very short segments
    if (duration < 1) continue;

    const segmentBuffer = await extractSegmentBuffer(audioBuffer, startTime, endTime);
    const segmentBlob = await audioBufferToBlob(segmentBuffer);

    segments.push({
      id: `segment-${Date.now()}-${i}`,
      audioBuffer: segmentBuffer,
      audioBlob: segmentBlob,
      startTime,
      endTime,
      duration,
      order: i,
    });
  }

  return segments;
}

// Extract a portion of audio buffer
async function extractSegmentBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const segmentLength = endSample - startSample;

  const segmentBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    segmentLength,
    sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const segmentData = segmentBuffer.getChannelData(channel);
    for (let i = 0; i < segmentLength; i++) {
      segmentData[i] = sourceData[startSample + i];
    }
  }

  return segmentBuffer;
}

// Convert AudioBuffer to Blob
export async function audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;

  // Create WAV file
  const wavBuffer = encodeWAV(audioBuffer, numberOfChannels, sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Encode AudioBuffer to WAV format
function encodeWAV(audioBuffer: AudioBuffer, numberOfChannels: number, sampleRate: number): ArrayBuffer {
  const length = audioBuffer.length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // ByteRate
  view.setUint16(32, numberOfChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let index = offset;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Combine multiple audio segments into one
export async function combineSegments(segments: AudioSegment[]): Promise<Blob> {
  if (segments.length === 0) {
    throw new Error('No segments to combine');
  }

  const audioContext = new AudioContext();
  const sampleRate = segments[0].audioBuffer.sampleRate;
  const numberOfChannels = segments[0].audioBuffer.numberOfChannels;

  // Calculate total length
  const totalLength = segments.reduce((sum, seg) => sum + seg.audioBuffer.length, 0);

  // Create combined buffer
  const combinedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

  let offset = 0;
  for (const segment of segments) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sourceData = segment.audioBuffer.getChannelData(channel);
      const destData = combinedBuffer.getChannelData(channel);
      destData.set(sourceData, offset);
    }
    offset += segment.audioBuffer.length;
  }

  return audioBufferToBlob(combinedBuffer);
}
