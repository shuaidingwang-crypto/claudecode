# Podcast Editor - iOS App

An intelligent iOS podcast editor that uses AI to transcribe, segment, and help you create professional podcasts.

## Features

### 🎙️ Audio Recording & Import
- Record audio directly in the app with real-time audio level monitoring
- Import audio files from your device
- High-quality audio capture (44.1kHz, AAC format)

### 🔧 Audio Processing
- **Audio Cleaning**: Automatic noise reduction and audio normalization
- **Speech-to-Text Transcription**: On-device transcription using Apple's Speech framework
- **Intelligent Segmentation**: AI-powered content analysis to break audio into meaningful segments
- **Smart Summaries**: Automatic generation of summaries for each segment

### ✂️ Timeline Editor
- Visual timeline with drag-and-drop segment rearrangement
- Play individual segments or the entire podcast
- Reorder segments to create new narratives
- Delete unwanted segments
- Reset or reverse segment order
- Real-time playback preview

### 🎧 Playback Controls
- Play/pause with visual progress indicator
- Variable playback speed (0.5x to 2x)
- Skip forward/backward 10 seconds
- Seek to any position in the timeline

### 📤 Export
- Merge all segments into a single podcast file
- Multiple format support (M4A, MP3, WAV)
- Quality settings (High, Medium, Low)
- Share exported podcasts directly from the app

## Technical Architecture

### Models
- **AudioSegment**: Represents a segment with audio URL, timestamps, transcript, and summary
- **PodcastProject**: Complete project with metadata and segments
- **PodcastProjectManager**: Manages project state and persistence

### Services
- **AudioRecorder**: Handles audio recording and importing
- **AudioProcessor**: Cleans audio, extracts segments, and merges files
- **TranscriptionService**: Converts speech to text with timestamps
- **SegmentationService**: Intelligently segments content using NLP
- **SummaryService**: Generates summaries using natural language processing
- **AudioPlayer**: Manages audio playback with controls

### Views
- **RecordingView**: Record or import audio
- **ProcessingView**: Process audio (clean, transcribe, segment)
- **TimelineEditorView**: Main editing interface with drag-and-drop
- **SegmentCardView**: Individual segment display
- **PlaybackControlsView**: Audio playback controls
- **ExportView**: Export final podcast

## AI & Machine Learning Features

### Content-Based Segmentation
The app uses Apple's NaturalLanguage framework to intelligently segment your podcast:
- **Semantic Analysis**: Detects topic changes using sentence embeddings
- **Transition Detection**: Identifies phrases that indicate topic shifts
- **Smart Grouping**: Merges short segments and splits long ones
- **Context Awareness**: Uses cosine similarity to measure topic coherence

### Summary Generation
Automatic summaries are created using:
- **Keyword Extraction**: Identifies important nouns and verbs
- **Sentence Scoring**: Ranks sentences by position, keyword density, and length
- **Extractive Summarization**: Selects the most important sentences

## Requirements

- iOS 16.0 or later
- Xcode 15.0 or later
- Swift 5.9 or later
- Microphone access for recording
- Speech recognition permissions

## Installation

1. Clone this repository
2. Open the project in Xcode
3. Select your development team in project settings
4. Build and run on your device or simulator

```bash
git clone <repository-url>
cd PodcastEditor
open PodcastEditor.xcodeproj
```

## Usage

### Creating a Podcast

1. **Record Tab**: Record new audio or import existing files
2. **Process Tab**: Click "Process Audio" to:
   - Clean the audio
   - Transcribe to text
   - Segment into chunks
   - Generate summaries
3. **Edit Tab**: Rearrange segments by dragging and dropping
   - Play segments to preview
   - Delete unwanted parts
   - Reorder to tell your story
4. **Export Tab**: Export your final podcast
   - Configure export settings
   - Tap "Export Podcast"
   - Share the result

### Tips for Best Results

- **Recording**: Speak clearly and minimize background noise
- **Segmentation**: The AI works best with natural speech patterns and clear topic transitions
- **Editing**: Listen to segments before finalizing your arrangement
- **Export**: Higher quality settings produce better audio but larger files

## Project Structure

```
PodcastEditor/
├── PodcastEditorApp.swift          # App entry point
├── ContentView.swift                # Main navigation
├── Info.plist                       # App configuration
├── Models/
│   ├── AudioSegment.swift          # Segment model
│   └── PodcastProject.swift        # Project model & manager
├── Services/
│   ├── AudioRecorder.swift         # Recording service
│   ├── AudioProcessor.swift        # Audio processing
│   ├── TranscriptionService.swift  # Speech-to-text
│   ├── SegmentationService.swift   # AI segmentation
│   ├── SummaryService.swift        # Summary generation
│   └── AudioPlayer.swift           # Playback service
└── Views/
    ├── RecordingView.swift         # Recording UI
    ├── ProcessingView.swift        # Processing UI
    ├── TimelineEditorView.swift    # Timeline editor
    ├── SegmentCardView.swift       # Segment card
    ├── PlaybackControlsView.swift  # Playback controls
    └── ExportView.swift            # Export UI
```

## Technologies Used

- **SwiftUI**: Modern declarative UI framework
- **AVFoundation**: Audio recording, processing, and playback
- **Speech Framework**: On-device speech recognition
- **NaturalLanguage Framework**: Text analysis and semantic understanding
- **Combine**: Reactive programming for state management

## Privacy

This app:
- Processes all audio locally on your device
- Does not send audio to external servers
- Requires microphone and speech recognition permissions
- Stores projects locally using UserDefaults

## Future Enhancements

Potential features for future versions:
- Cloud sync and backup
- Collaborative editing
- Advanced audio effects (EQ, compression, reverb)
- Speaker diarization (identify different speakers)
- AI-powered noise removal
- Waveform visualization
- Chapter markers
- ID3 tag editing
- Direct publishing to podcast platforms

## License

This project is provided as-is for educational and development purposes.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created with Claude Code - An AI-powered iOS podcast editor
