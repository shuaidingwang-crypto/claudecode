//
//  SegmentCardView.swift
//  PodcastEditor
//
//  Card view for displaying an audio segment
//

import SwiftUI

struct SegmentCardView: View {
    let segment: AudioSegment
    let isSelected: Bool
    let onTap: () -> Void
    let onPlay: () -> Void
    let onDelete: () -> Void

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                // Order badge
                Text("\(segment.order + 1)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 30, height: 30)
                    .background(Circle().fill(Color.blue))

                VStack(alignment: .leading, spacing: 4) {
                    Text(segment.summary.isEmpty ? "Segment \(segment.order + 1)" : segment.summary)
                        .font(.headline)
                        .lineLimit(isExpanded ? nil : 2)

                    if let speaker = segment.speakerLabel {
                        Text("Speaker: \(speaker)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Duration
                VStack(alignment: .trailing) {
                    Text(segment.formattedDuration)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .monospacedDigit()

                    Image(systemName: "waveform")
                        .foregroundColor(.blue)
                        .font(.caption)
                }
            }

            // Transcript preview
            if !segment.transcript.isEmpty {
                Text(segment.transcript)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(isExpanded ? nil : 3)
                    .padding(.top, 4)
            }

            // Action buttons
            HStack(spacing: 16) {
                Button(action: onPlay) {
                    Label("Play", systemImage: "play.fill")
                        .font(.caption)
                }

                Button(action: { withAnimation { isExpanded.toggle() } }) {
                    Label(isExpanded ? "Show Less" : "Show More", systemImage: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                }

                Spacer()

                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                        .font(.caption)
                }
            }
            .buttonStyle(.borderless)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color.gray.opacity(0.2), lineWidth: isSelected ? 2 : 1)
        )
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        .onTapGesture(perform: onTap)
    }
}

#Preview {
    SegmentCardView(
        segment: AudioSegment(
            audioURL: URL(fileURLWithPath: "/tmp/test.m4a"),
            startTime: 0,
            endTime: 30,
            transcript: "This is a sample transcript of what might be said in this segment. It contains several sentences to demonstrate the card layout.",
            summary: "Introduction to the topic",
            order: 0
        ),
        isSelected: false,
        onTap: {},
        onPlay: {},
        onDelete: {}
    )
    .padding()
}
