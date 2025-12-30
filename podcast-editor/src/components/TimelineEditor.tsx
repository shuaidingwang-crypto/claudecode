import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSegment } from './SortableSegment';
import { AudioSegment } from '../types';
import { combineSegments } from '../utils/audioProcessing';

interface TimelineEditorProps {
  initialSegments: AudioSegment[];
  onBack: () => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ initialSegments, onBack }) => {
  const [segments, setSegments] = useState(initialSegments);
  const [isExporting, setIsExporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSegments((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const combinedBlob = await combineSegments(segments);
      const url = URL.createObjectURL(combinedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `podcast-edited-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Failed to export audio');
    } finally {
      setIsExporting(false);
    }
  };

  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <button onClick={onBack} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Timeline Editor</h1>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={styles.exportButton}
          >
            {isExporting ? 'Exporting...' : '⬇ Export Podcast'}
          </button>
        </div>
        <div style={styles.stats}>
          <span>{segments.length} segments</span>
          <span>•</span>
          <span>Total duration: {totalDuration.toFixed(1)}s</span>
        </div>
      </div>

      <div style={styles.instructions}>
        <p>
          <strong>Instructions:</strong> Drag and drop segments to reorder them. Click the play button to preview each segment.
          Click the expand arrow to view full transcripts. When you're done, click "Export Podcast" to download your edited audio.
        </p>
      </div>

      <div style={styles.timeline}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={segments.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {segments.map((segment, index) => (
              <SortableSegment key={segment.id} segment={segment} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  exportButton: {
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    color: '#666',
  },
  instructions: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.6',
  },
  timeline: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
};
