//
//  ProcessingView.swift
//  PodcastEditor
//
//  View for processing audio (cleaning, transcription, segmentation)
//

import SwiftUI

struct ProcessingView: View {
    @EnvironmentObject var projectManager: PodcastProjectManager
    @StateObject private var transcriptionService = TranscriptionService()
    @State private var audioProcessor = AudioProcessor()
    @State private var segmentationService = SegmentationService()
    @State private var summaryService = SummaryService()

    @State private var isProcessing = false
    @State private var processingStep = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let project = projectManager.currentProject {
                    if let audioURL = project.originalAudioURL {
                        // Status
                        VStack(spacing: 10) {
                            Image(systemName: "waveform.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.blue)

                            Text("Audio Ready")
                                .font(.headline)

                            if !project.segments.isEmpty {
                                Text("\(project.segments.count) segments created")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()

                        if isProcessing {
                            VStack(spacing: 10) {
                                ProgressView()
                                Text(processingStep)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                        } else {
                            // Process button
                            Button(action: processAudio) {
                                Label("Process Audio", systemImage: "wand.and.stars")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                            .padding(.horizontal)
                            .disabled(isProcessing)

                            if !project.segments.isEmpty {
                                Text("Audio has been processed. Go to Edit tab to arrange segments.")
                                    .multilineTextAlignment(.center)
                                    .foregroundColor(.secondary)
                                    .padding()
                            }
                        }

                        Spacer()
                    } else {
                        ContentUnavailableView(
                            "No Audio",
                            systemImage: "waveform.slash",
                            description: Text("Record or import audio in the Record tab")
                        )
                    }
                } else {
                    ContentUnavailableView(
                        "No Project",
                        systemImage: "folder.badge.plus",
                        description: Text("Create a project by recording audio")
                    )
                }
            }
            .padding()
            .navigationTitle("Process")
            .alert("Processing", isPresented: $showingAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
        }
    }

    private func processAudio() {
        guard var project = projectManager.currentProject,
              let audioURL = project.originalAudioURL else {
            return
        }

        isProcessing = true

        // Step 1: Clean audio
        processingStep = "Cleaning audio..."
        audioProcessor.cleanAudio(from: audioURL) { result in
            switch result {
            case .success(let cleanedURL):
                // Step 2: Transcribe
                processingStep = "Transcribing audio..."
                transcribeAudio(cleanedURL) { transcripts in
                    // Step 3: Segment
                    processingStep = "Segmenting audio..."
                    let segments = segmentationService.segmentTranscript(transcripts, audioURL: cleanedURL)

                    // Step 4: Generate summaries
                    processingStep = "Generating summaries..."
                    generateSummaries(for: segments, audioURL: cleanedURL) { finalSegments in
                        project.segments = finalSegments
                        projectManager.updateCurrentProject(project)

                        isProcessing = false
                        processingStep = ""
                        alertMessage = "Processing complete! \(finalSegments.count) segments created."
                        showingAlert = true
                    }
                }

            case .failure(let error):
                isProcessing = false
                processingStep = ""
                alertMessage = "Failed to clean audio: \(error.localizedDescription)"
                showingAlert = true
            }
        }
    }

    private func transcribeAudio(_ url: URL, completion: @escaping ([TimestampedTranscript]) -> Void) {
        transcriptionService.transcribeWithTimestamps(audioURL: url) { result in
            switch result {
            case .success(let transcripts):
                completion(transcripts)
            case .failure(let error):
                isProcessing = false
                processingStep = ""
                alertMessage = "Transcription failed: \(error.localizedDescription)"
                showingAlert = true
            }
        }
    }

    private func generateSummaries(for segments: [AudioSegment], audioURL: URL, completion: @escaping ([AudioSegment]) -> Void) {
        var processedSegments: [AudioSegment] = []

        let group = DispatchGroup()

        for segment in segments {
            group.enter()

            var updatedSegment = segment
            updatedSegment.summary = summaryService.generateSummary(for: segment.transcript)

            // Extract actual audio segment
            audioProcessor.extractSegment(
                from: audioURL,
                startTime: segment.startTime,
                endTime: segment.endTime
            ) { result in
                if case .success(let segmentURL) = result {
                    updatedSegment.audioURL = segmentURL
                }
                processedSegments.append(updatedSegment)
                group.leave()
            }
        }

        group.notify(queue: .main) {
            completion(processedSegments.sorted { $0.order < $1.order })
        }
    }
}

#Preview {
    ProcessingView()
        .environmentObject(PodcastProjectManager())
}
