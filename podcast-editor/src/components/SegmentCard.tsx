import React, { useRef, useState, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioSegment } from '../types';

interface SegmentCardProps {
  segment: AudioSegment;
  index: number;
  isDragging?: boolean;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({ segment, index, isDragging }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#ddd',
        progressColor: '#4CAF50',
        cursorColor: '#4CAF50',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 60,
        barGap: 2,
      });

      wavesurferRef.current.loadBlob(segment.audioBlob);

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('finish', () => setIsPlaying(false));
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [segment.audioBlob]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div style={{ ...styles.card, ...(isDragging ? styles.cardDragging : {}) }}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.dragHandle}>⋮⋮</span>
          <h3 style={styles.title}>Segment {index + 1}</h3>
          <span style={styles.duration}>{segment.duration.toFixed(1)}s</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      <div style={styles.summary}>
        <strong>Summary:</strong> {segment.summary}
      </div>

      {isExpanded && (
        <div style={styles.expandedContent}>
          <div style={styles.transcript}>
            <strong>Transcript:</strong>
            <p>{segment.transcript}</p>
          </div>
        </div>
      )}

      <div ref={waveformRef} style={styles.waveform} />

      <div style={styles.controls}>
        <button onClick={togglePlayPause} style={styles.playButton}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <div style={styles.timeInfo}>
          {segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    cursor: 'grab',
  },
  cardDragging: {
    opacity: 0.5,
    cursor: 'grabbing',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dragHandle: {
    fontSize: '20px',
    color: '#999',
    cursor: 'grab',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  },
  duration: {
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  expandButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: '#666',
  },
  summary: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  expandedContent: {
    marginBottom: '12px',
  },
  transcript: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '6px',
    lineHeight: '1.6',
  },
  waveform: {
    marginBottom: '12px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  timeInfo: {
    fontSize: '12px',
    color: '#999',
  },
};
