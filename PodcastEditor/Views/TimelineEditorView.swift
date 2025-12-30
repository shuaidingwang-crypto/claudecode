//
//  TimelineEditorView.swift
//  PodcastEditor
//
//  Timeline editor with drag-and-drop functionality for rearranging segments
//

import SwiftUI
import UniformTypeIdentifiers

struct TimelineEditorView: View {
    @EnvironmentObject var projectManager: PodcastProjectManager
    @StateObject private var player = AudioPlayer()
    @State private var segments: [AudioSegment] = []
    @State private var selectedSegment: AudioSegment?
    @State private var draggedSegment: AudioSegment?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if !segments.isEmpty {
                    // Playback controls
                    PlaybackControlsView(player: player, segments: segments)
                        .padding()
                        .background(Color(.systemGray6))

                    Divider()

                    // Timeline
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(segments) { segment in
                                SegmentCardView(
                                    segment: segment,
                                    isSelected: selectedSegment?.id == segment.id,
                                    onTap: { selectSegment(segment) },
                                    onPlay: { playSegment(segment) },
                                    onDelete: { deleteSegment(segment) }
                                )
                                .onDrag {
                                    self.draggedSegment = segment
                                    return NSItemProvider(object: segment.id.uuidString as NSString)
                                }
                                .onDrop(of: [UTType.text], delegate: SegmentDropDelegate(
                                    segment: segment,
                                    segments: $segments,
                                    draggedSegment: $draggedSegment,
                                    onReorder: saveReorder
                                ))
                            }
                        }
                        .padding()
                    }
                } else {
                    ContentUnavailableView(
                        "No Segments",
                        systemImage: "waveform.slash",
                        description: Text("Process audio in the Process tab to create segments")
                    )
                }
            }
            .navigationTitle("Timeline Editor")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !segments.isEmpty {
                        Menu {
                            Button(action: resetOrder) {
                                Label("Reset Order", systemImage: "arrow.counterclockwise")
                            }
                            Button(action: reverseOrder) {
                                Label("Reverse Order", systemImage: "arrow.up.arrow.down")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
        }
        .onAppear {
            loadSegments()
        }
        .onChange(of: projectManager.currentProject?.segments) { _, _ in
            loadSegments()
        }
    }

    private func loadSegments() {
        if let project = projectManager.currentProject {
            segments = project.segments.sorted { $0.order < $1.order }
        }
    }

    private func selectSegment(_ segment: AudioSegment) {
        selectedSegment = segment
    }

    private func playSegment(_ segment: AudioSegment) {
        player.loadAudio(from: segment.audioURL)
        player.play()
        selectedSegment = segment
    }

    private func deleteSegment(_ segment: AudioSegment) {
        guard var project = projectManager.currentProject else { return }
        project.segments.removeAll { $0.id == segment.id }

        // Reorder remaining segments
        for (index, var seg) in project.segments.enumerated() {
            seg.order = index
            project.segments[index] = seg
        }

        projectManager.updateCurrentProject(project)
    }

    private func saveReorder() {
        guard var project = projectManager.currentProject else { return }

        // Update order indices
        for (index, segment) in segments.enumerated() {
            if let projectIndex = project.segments.firstIndex(where: { $0.id == segment.id }) {
                project.segments[projectIndex].order = index
            }
        }

        projectManager.updateCurrentProject(project)
    }

    private func resetOrder() {
        guard var project = projectManager.currentProject else { return }

        // Reset to original order based on start time
        project.segments.sort { $0.startTime < $1.startTime }
        for (index, var segment) in project.segments.enumerated() {
            segment.order = index
            project.segments[index] = segment
        }

        projectManager.updateCurrentProject(project)
    }

    private func reverseOrder() {
        guard var project = projectManager.currentProject else { return }

        project.segments.reverse()
        for (index, var segment) in project.segments.enumerated() {
            segment.order = index
            project.segments[index] = segment
        }

        projectManager.updateCurrentProject(project)
    }
}

// Drop delegate for drag and drop reordering
struct SegmentDropDelegate: DropDelegate {
    let segment: AudioSegment
    @Binding var segments: [AudioSegment]
    @Binding var draggedSegment: AudioSegment?
    let onReorder: () -> Void

    func performDrop(info: DropInfo) -> Bool {
        draggedSegment = nil
        return true
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        return DropProposal(operation: .move)
    }

    func dropEntered(info: DropInfo) {
        guard let draggedSegment = draggedSegment,
              draggedSegment.id != segment.id,
              let fromIndex = segments.firstIndex(where: { $0.id == draggedSegment.id }),
              let toIndex = segments.firstIndex(where: { $0.id == segment.id }) else {
            return
        }

        withAnimation {
            segments.move(fromOffsets: IndexSet(integer: fromIndex), toOffset: toIndex > fromIndex ? toIndex + 1 : toIndex)
        }

        onReorder()
    }
}

#Preview {
    TimelineEditorView()
        .environmentObject(PodcastProjectManager())
}
