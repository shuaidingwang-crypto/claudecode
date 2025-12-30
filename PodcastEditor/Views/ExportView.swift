//
//  ExportView.swift
//  PodcastEditor
//
//  View for exporting the final podcast
//

import SwiftUI

struct ExportView: View {
    @EnvironmentObject var projectManager: PodcastProjectManager
    @State private var audioProcessor = AudioProcessor()
    @State private var isExporting = false
    @State private var exportProgress: Double = 0
    @State private var showingShareSheet = false
    @State private var exportedURL: URL?
    @State private var showingAlert = false
    @State private var alertMessage = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let project = projectManager.currentProject {
                    if !project.segments.isEmpty {
                        // Project info
                        VStack(spacing: 16) {
                            Image(systemName: "podcast.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.blue)

                            VStack(spacing: 8) {
                                Text(project.name)
                                    .font(.title2)
                                    .fontWeight(.bold)

                                HStack(spacing: 16) {
                                    Label("\(project.segments.count) segments", systemImage: "waveform")
                                    Label(formatDuration(project.totalDuration), systemImage: "clock")
                                }
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            }
                        }
                        .padding()

                        // Export options
                        GroupBox("Export Settings") {
                            VStack(alignment: .leading, spacing: 12) {
                                Toggle("Include metadata", isOn: .constant(true))
                                Toggle("Normalize audio", isOn: .constant(true))

                                Picker("Format", selection: .constant("M4A")) {
                                    Text("M4A").tag("M4A")
                                    Text("MP3").tag("MP3")
                                    Text("WAV").tag("WAV")
                                }

                                Picker("Quality", selection: .constant("High")) {
                                    Text("High").tag("High")
                                    Text("Medium").tag("Medium")
                                    Text("Low").tag("Low")
                                }
                            }
                            .padding(.vertical, 8)
                        }
                        .padding(.horizontal)

                        if isExporting {
                            VStack(spacing: 10) {
                                ProgressView(value: exportProgress)
                                    .padding(.horizontal)
                                Text("Exporting podcast...")
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                        }

                        Spacer()

                        // Export button
                        Button(action: exportPodcast) {
                            Label("Export Podcast", systemImage: "square.and.arrow.up")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(isExporting ? Color.gray : Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        .padding(.horizontal)
                        .disabled(isExporting)

                        if let url = exportedURL {
                            Button(action: { showingShareSheet = true }) {
                                Label("Share Exported File", systemImage: "square.and.arrow.up")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                            .padding(.horizontal)
                            .sheet(isPresented: $showingShareSheet) {
                                ShareSheet(items: [url])
                            }
                        }
                    } else {
                        ContentUnavailableView(
                            "No Segments",
                            systemImage: "waveform.slash",
                            description: Text("Process audio to create segments before exporting")
                        )
                    }
                } else {
                    ContentUnavailableView(
                        "No Project",
                        systemImage: "folder.badge.plus",
                        description: Text("Create a project to export")
                    )
                }
            }
            .padding()
            .navigationTitle("Export")
            .alert("Export", isPresented: $showingAlert) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
        }
    }

    private func exportPodcast() {
        guard let project = projectManager.currentProject,
              !project.segments.isEmpty else {
            return
        }

        isExporting = true
        exportProgress = 0

        // Merge segments in their current order
        audioProcessor.mergeSegments(project.segments) { result in
            switch result {
            case .success(let url):
                exportedURL = url
                isExporting = false
                exportProgress = 1.0
                alertMessage = "Podcast exported successfully!"
                showingAlert = true

            case .failure(let error):
                isExporting = false
                exportProgress = 0
                alertMessage = "Export failed: \(error.localizedDescription)"
                showingAlert = true
            }
        }

        // Simulate progress
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            if exportProgress < 0.9 {
                exportProgress += 0.1
            } else {
                timer.invalidate()
            }
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
}

// Share sheet wrapper for UIKit
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    ExportView()
        .environmentObject(PodcastProjectManager())
}
