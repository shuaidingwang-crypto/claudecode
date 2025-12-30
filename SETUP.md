# Setup Instructions for Podcast Editor iOS App

## Prerequisites

- macOS Ventura (13.0) or later
- Xcode 15.0 or later
- Apple Developer Account (for device testing)
- iOS 16.0+ device or simulator

## Setting Up the Xcode Project

Since this repository contains the Swift source files but not the Xcode project file (`.xcodeproj`), you'll need to create a new Xcode project and add these files to it.

### Step 1: Create New Xcode Project

1. Open Xcode
2. Select **File > New > Project**
3. Choose **iOS > App**
4. Click **Next**
5. Configure your project:
   - **Product Name**: `PodcastEditor`
   - **Team**: Select your development team
   - **Organization Identifier**: `com.yourcompany.podcasteditor` (or your preferred identifier)
   - **Interface**: SwiftUI
   - **Language**: Swift
   - **Storage**: None (we handle our own persistence)
   - **Include Tests**: Optional
6. Click **Next** and choose a location (use the cloned repository directory)

### Step 2: Add Source Files to Xcode

1. In Xcode's Project Navigator, delete the auto-generated files:
   - `ContentView.swift` (we have our own)
   - `PodcastEditorApp.swift` (if it conflicts with ours)

2. Add all the source files from the repository:
   - Right-click on the `PodcastEditor` folder in Project Navigator
   - Select **Add Files to "PodcastEditor"**
   - Navigate to the repository's `PodcastEditor` folder
   - Select all `.swift` files and the `Info.plist`
   - Make sure "Copy items if needed" is **unchecked** (files are already in the right place)
   - Click **Add**

### Step 3: Organize Files in Xcode

Organize the files into groups (folders) for better navigation:

1. Create groups by right-clicking `PodcastEditor` and selecting **New Group**:
   - Models
   - Services
   - Views

2. Drag files into appropriate groups:
   - **Models**: `AudioSegment.swift`, `PodcastProject.swift`
   - **Services**: All service files
   - **Views**: All view files

### Step 4: Configure Info.plist

1. Select the project in Project Navigator
2. Select the `PodcastEditor` target
3. Go to the **Info** tab
4. Add these privacy descriptions (or use the provided Info.plist):
   - **Privacy - Microphone Usage Description**: "This app needs access to the microphone to record audio for your podcast."
   - **Privacy - Speech Recognition Usage Description**: "This app needs access to speech recognition to transcribe your podcast audio."

### Step 5: Configure Capabilities

1. Select the project in Project Navigator
2. Select the `PodcastEditor` target
3. Go to **Signing & Capabilities**
4. Ensure **Automatically manage signing** is checked
5. Select your **Team**
6. Add **Background Modes** capability:
   - Click **+ Capability**
   - Search for and add **Background Modes**
   - Check **Audio, AirPlay, and Picture in Picture**

### Step 6: Set Deployment Target

1. Select the project in Project Navigator
2. Select the `PodcastEditor` target
3. In **General** tab, set:
   - **Minimum Deployments**: iOS 16.0 or later

### Step 7: Build and Run

1. Select a simulator or connected device from the scheme selector
2. Press **Cmd + R** or click the **Run** button
3. Grant microphone and speech recognition permissions when prompted

## Project Structure in Xcode

After setup, your project should look like this:

```
PodcastEditor
├── PodcastEditor/
│   ├── PodcastEditorApp.swift
│   ├── ContentView.swift
│   ├── Info.plist
│   ├── Models/
│   │   ├── AudioSegment.swift
│   │   └── PodcastProject.swift
│   ├── Services/
│   │   ├── AudioRecorder.swift
│   │   ├── AudioProcessor.swift
│   │   ├── TranscriptionService.swift
│   │   ├── SegmentationService.swift
│   │   ├── SummaryService.swift
│   │   └── AudioPlayer.swift
│   └── Views/
│       ├── RecordingView.swift
│       ├── ProcessingView.swift
│       ├── TimelineEditorView.swift
│       ├── SegmentCardView.swift
│       ├── PlaybackControlsView.swift
│       └── ExportView.swift
└── Assets.xcassets/
```

## Testing on Device

### For Physical Devices:

1. Connect your iPhone or iPad via USB
2. Trust the computer on your device if prompted
3. Select your device from the scheme selector
4. Click **Run**
5. On your device, go to **Settings > General > VPN & Device Management**
6. Trust your developer certificate
7. Launch the app

### For Simulator:

1. Select a simulator (iPhone 14 Pro or newer recommended)
2. Click **Run**
3. Note: Microphone recording may not work in simulator; import audio files instead

## Troubleshooting

### Build Errors

**"Missing required module"**
- Ensure all files are added to the target
- Check Build Phases > Compile Sources

**"Duplicate symbols"**
- Make sure you don't have duplicate Swift files
- Remove any auto-generated files that conflict

### Runtime Issues

**"Microphone permission denied"**
- Check Info.plist has `NSMicrophoneUsageDescription`
- Reset permissions: Settings > General > Reset > Reset Location & Privacy

**"Speech recognition unavailable"**
- Ensure device has internet connection (for initial setup)
- Check Info.plist has `NSSpeechRecognitionUsageDescription`
- Some features require iOS 16+

**"Audio files not playing"**
- Ensure device is not in silent mode
- Check volume settings
- Verify audio files are valid

### Performance

**Slow transcription**
- Transcription speed depends on audio length and device
- iPhone 12 or newer recommended for best performance
- Consider shorter audio clips for testing

**App crashes during processing**
- Large audio files may cause memory issues
- Try with shorter recordings first (< 5 minutes)
- Process audio in smaller chunks

## Development Tips

1. **Use Simulator for UI Development**: Faster iteration for layout work
2. **Test on Real Device**: Required for accurate microphone and speech recognition testing
3. **Test with Various Audio**: Try different lengths, qualities, and content types
4. **Monitor Console**: Watch for errors and warnings during development

## Next Steps

Once setup is complete:
1. Read the main [README.md](README.md) for feature details
2. Try recording a short audio clip
3. Process it to see the AI segmentation
4. Experiment with the timeline editor
5. Export your first podcast!

## Need Help?

If you encounter issues:
1. Check Xcode's Issue Navigator (Cmd + 5)
2. Review console output for errors
3. Ensure all dependencies are properly configured
4. Verify iOS deployment target matches your device

Happy podcasting! 🎙️
