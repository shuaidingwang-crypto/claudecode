//
//  RecordingView.swift
//  PodcastEditor
//
//  View for recording or importing audio
//

import SwiftUI
import AVFoundation

struct RecordingView: View {
    @StateObject private var recorder = AudioRecorder()
    @EnvironmentObject var projectManager: PodcastProjectManager
    @State private var showingImporter = false
    @State private var showingAlert = false
    @State private var alertMessage = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Recording timer
                Text(timeString(from: recorder.recordingTime))
                    .font(.system(size: 60, weight: .light, design: .monospaced))
                    .foregroundColor(recorder.isRecording ? .red : .primary)

                // Audio level meter
                if recorder.isRecording {
                    AudioLevelMeter(level: recorder.audioLevel)
                        .frame(height: 20)
                        .padding(.horizontal)
                }

                Spacer()

                // Record button
                Button(action: toggleRecording) {
                    ZStack {
                        Circle()
                            .fill(recorder.isRecording ? Color.red : Color.blue)
                            .frame(width: 80, height: 80)

                        if recorder.isRecording {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white)
                                .frame(width: 30, height: 30)
                        } else {
                            Circle()
                                .fill(Color.white)
                                .frame(width: 30, height: 30)
                        }
                    }
                }
                .shadow(radius: 5)

                Text(recorder.isRecording ? "Tap to stop" : "Tap to record")
                    .foregroundColor(.secondary)

                Spacer()

                // Import button
                Button(action: { showingImporter = true }) {
                    Label("Import Audio File", systemImage: "folder")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
            .padding()
            .navigationTitle("Record Audio")
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [.audio],
                allowsMultipleSelection: false
            ) { result in
                handleImport(result)
            }
            .alert("Recording", isPresented: $showingAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
        }
    }

    private func toggleRecording() {
        if recorder.isRecording {
            if let url = recorder.stopRecording() {
                saveRecording(url: url)
            }
        } else {
            recorder.startRecording()
        }
    }

    private func saveRecording(url: URL) {
        if projectManager.currentProject == nil {
            projectManager.createNewProject(name: "New Podcast \(Date().formatted(date: .abbreviated, time: .shortened))")
        }

        if var project = projectManager.currentProject {
            project.originalAudioURL = url
            projectManager.updateCurrentProject(project)
            alertMessage = "Recording saved! Go to Process tab to transcribe."
            showingAlert = true
        }
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            if let url = urls.first,
               let importedURL = recorder.importAudio(from: url) {
                saveRecording(url: importedURL)
            }
        case .failure(let error):
            alertMessage = "Failed to import: \(error.localizedDescription)"
            showingAlert = true
        }
    }

    private func timeString(from timeInterval: TimeInterval) -> String {
        let minutes = Int(timeInterval) / 60
        let seconds = Int(timeInterval) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

struct AudioLevelMeter: View {
    let level: Float

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))

                Rectangle()
                    .fill(levelColor)
                    .frame(width: geometry.size.width * CGFloat(normalizedLevel))
            }
            .cornerRadius(10)
        }
    }

    private var normalizedLevel: Float {
        // Convert dB to linear scale (roughly -50 to 0 dB)
        let minDb: Float = -50
        let maxDb: Float = 0
        let normalized = (level - minDb) / (maxDb - minDb)
        return max(0, min(1, normalized))
    }

    private var levelColor: Color {
        if normalizedLevel > 0.8 {
            return .red
        } else if normalizedLevel > 0.5 {
            return .yellow
        } else {
            return .green
        }
    }
}

#Preview {
    RecordingView()
        .environmentObject(PodcastProjectManager())
}
