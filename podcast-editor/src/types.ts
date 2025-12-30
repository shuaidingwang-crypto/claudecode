export interface AudioSegment {
  id: string;
  audioBuffer: AudioBuffer;
  audioBlob: Blob;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: string;
  summary: string;
  order: number;
}

export interface ProcessedAudio {
  originalFile: File;
  audioBuffer: AudioBuffer;
  cleanedBlob: Blob;
  segments: AudioSegment[];
}
