import React, { useCallback, useState } from 'react';
import { loadAudioFile, cleanAudio, detectSegments, createSegments } from '../utils/audioProcessing';
import { processSegmentTranscripts } from '../utils/transcription';
import type { AudioSegment } from '../types';

interface AudioUploadProps {
  onSegmentsReady: (segments: AudioSegment[]) => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onSegmentsReady }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setProgress('Loading audio file...');

    try {
      // Load audio
      const audioBuffer = await loadAudioFile(file);
      setProgress('Cleaning audio...');

      // Clean audio
      const { buffer: cleanedBuffer } = await cleanAudio(audioBuffer);
      setProgress('Detecting segments...');

      // Detect segments
      const boundaries = detectSegments(cleanedBuffer, 0.01, 0.8);
      setProgress(`Found ${boundaries.length - 1} potential segments. Creating segments...`);

      // Create segments
      const segments = await createSegments(cleanedBuffer, boundaries);
      setProgress(`Processing ${segments.length} segments (transcribing and summarizing)...`);

      // Process transcripts and summaries
      const processedSegments = await processSegmentTranscripts(segments);
      setProgress('Complete!');

      onSegmentsReady(processedSegments);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setIsProcessing(false);
    }
  }, [onSegmentsReady]);

  return (
    <div style={styles.container}>
      <div style={styles.uploadBox}>
        <h2 style={styles.title}>Audio Podcast Editor</h2>
        <p style={styles.subtitle}>Upload an audio file to get started</p>

        <label style={styles.fileLabel}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
            style={styles.fileInput}
          />
          <span style={styles.uploadButton}>
            {isProcessing ? 'Processing...' : 'Choose Audio File'}
          </span>
        </label>

        {progress && (
          <div style={styles.progress}>
            <p>{progress}</p>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <p>Error: {error}</p>
          </div>
        )}

        <div style={styles.info}>
          <h3>Features:</h3>
          <ul>
            <li>Audio cleaning and noise reduction</li>
            <li>Automatic segmentation based on pauses</li>
            <li>Transcription of each segment</li>
            <li>AI-generated summaries</li>
            <li>Drag-and-drop timeline editor</li>
            <li>Export combined segments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  uploadBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center',
  },
  fileLabel: {
    display: 'block',
    marginBottom: '20px',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    display: 'block',
    padding: '15px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  },
  progress: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#1976d2',
  },
  error: {
    padding: '15px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#c62828',
  },
  info: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#555',
  },
};
