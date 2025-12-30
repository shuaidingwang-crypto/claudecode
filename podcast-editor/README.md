# Audio Podcast Editor

A modern web application for processing, editing, and reassembling audio recordings into polished podcasts.

## Features

### 🎵 Audio Processing
- **Audio Cleaning**: Automatic noise reduction using high-pass filtering and dynamic compression
- **Volume Normalization**: Ensures consistent audio levels across all segments

### ✂️ Intelligent Segmentation
- **Automatic Chunking**: Detects natural breaks in audio based on silence detection
- **Content-Based Splitting**: Segments audio into manageable chunks based on pauses and content flow

### 📝 Transcription & Summarization
- **Audio Transcription**: Converts speech to text for each segment (using mock data for demo; integrate with OpenAI Whisper or similar for production)
- **AI Summaries**: Generates concise summaries for each audio segment
- **Full Transcript View**: Expandable segments showing complete transcriptions

### 🎬 Interactive Timeline Editor
- **Waveform Visualization**: See audio waveforms for each segment using WaveSurfer.js
- **Drag-and-Drop**: Easily reorder segments by dragging them
- **Preview Playback**: Play individual segments before finalizing
- **Real-time Editing**: See changes immediately as you rearrange content

### 💾 Export
- **Combine Segments**: Merge reordered segments into a single audio file
- **Download**: Export your edited podcast as a WAV file

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **WaveSurfer.js** - Audio waveform visualization
- **@dnd-kit** - Drag-and-drop functionality
- **Web Audio API** - Audio processing and manipulation

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Upload Audio**: Click "Choose Audio File" and select an audio recording (MP3, WAV, etc.)
2. **Processing**: The app will:
   - Clean and normalize the audio
   - Detect natural segment boundaries
   - Transcribe each segment
   - Generate summaries
3. **Edit Timeline**:
   - Drag segments to reorder them
   - Click play buttons to preview segments
   - Expand segments to view full transcripts
4. **Export**: Click "Export Podcast" to download your edited audio file

## Project Structure

```
src/
├── components/          # React components
│   ├── AudioUpload.tsx     # File upload and processing UI
│   ├── SegmentCard.tsx     # Individual segment display
│   ├── SortableSegment.tsx # Drag-and-drop wrapper
│   └── TimelineEditor.tsx  # Main timeline editor
├── utils/              # Utility functions
│   ├── audioProcessing.ts  # Audio manipulation utilities
│   └── transcription.ts    # Transcription and summarization
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Future Enhancements

### Production-Ready Features
- **Real Transcription Service**: Integrate with OpenAI Whisper API, Google Speech-to-Text, or AssemblyAI
- **AI Summaries**: Use GPT-4 or similar for better summarization
- **Multiple Export Formats**: Support MP3, AAC, OGG export formats
- **Cloud Storage**: Save projects and audio files to cloud storage
- **Collaborative Editing**: Share and collaborate on podcast edits
- **Advanced Audio Effects**: Add reverb, EQ, compression controls
- **Chapter Markers**: Add and export chapter markers for podcasts
- **Automatic Speaker Detection**: Identify and label different speakers
- **Noise Profile Analysis**: More sophisticated noise reduction based on analysis

## Technical Notes

### Audio Processing
The app uses the Web Audio API for all audio processing. The main operations include:
- High-pass filtering to remove low-frequency noise
- Dynamic compression for volume normalization
- WAV encoding for export

### Transcription
Currently uses mock transcription data for demonstration. For production use, integrate with:
- OpenAI Whisper API (recommended for accuracy)
- Google Cloud Speech-to-Text
- AssemblyAI
- Web Speech API (limited browser support)

### Browser Compatibility
- Modern browsers (Chrome, Edge, Firefox, Safari)
- Web Audio API required
- File API support required

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
