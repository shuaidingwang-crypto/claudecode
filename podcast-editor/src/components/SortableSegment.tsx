import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SegmentCard } from './SegmentCard';
import { AudioSegment } from '../types';

interface SortableSegmentProps {
  segment: AudioSegment;
  index: number;
}

export const SortableSegment: React.FC<SortableSegmentProps> = ({ segment, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SegmentCard segment={segment} index={index} isDragging={isDragging} />
    </div>
  );
};
