//
//  PlaybackControlsView.swift
//  PodcastEditor
//
//  Playback controls with timeline visualization
//

import SwiftUI

struct PlaybackControlsView: View {
    @ObservedObject var player: AudioPlayer
    let segments: [AudioSegment]

    var body: some View {
        VStack(spacing: 16) {
            // Timeline scrubber
            VStack(spacing: 8) {
                // Time labels
                HStack {
                    Text(timeString(from: player.currentTime))
                        .font(.caption)
                        .monospacedDigit()

                    Spacer()

                    Text(timeString(from: player.duration))
                        .font(.caption)
                        .monospacedDigit()
                }
                .foregroundColor(.secondary)

                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // Background
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 4)

                        // Progress
                        Rectangle()
                            .fill(Color.blue)
                            .frame(width: geometry.size.width * progress, height: 4)
                    }
                    .cornerRadius(2)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                let position = value.location.x / geometry.size.width
                                let newTime = player.duration * Double(max(0, min(1, position)))
                                player.seek(to: newTime)
                            }
                    )
                }
                .frame(height: 20)
            }

            // Playback controls
            HStack(spacing: 32) {
                // Playback rate
                Menu {
                    Button("0.5x") { player.setPlaybackRate(0.5) }
                    Button("0.75x") { player.setPlaybackRate(0.75) }
                    Button("1x") { player.setPlaybackRate(1.0) }
                    Button("1.25x") { player.setPlaybackRate(1.25) }
                    Button("1.5x") { player.setPlaybackRate(1.5) }
                    Button("2x") { player.setPlaybackRate(2.0) }
                } label: {
                    Text(String(format: "%.2fx", player.playbackRate))
                        .font(.caption)
                        .frame(width: 50)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }

                // Skip backward
                Button(action: { player.seek(to: max(0, player.currentTime - 10)) }) {
                    Image(systemName: "gobackward.10")
                        .font(.title2)
                }

                // Play/Pause
                Button(action: togglePlayPause) {
                    Image(systemName: player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.blue)
                }

                // Skip forward
                Button(action: { player.seek(to: min(player.duration, player.currentTime + 10)) }) {
                    Image(systemName: "goforward.10")
                        .font(.title2)
                }

                // Stop
                Button(action: { player.stop() }) {
                    Image(systemName: "stop.circle")
                        .font(.title2)
                }
            }
            .foregroundColor(.primary)
        }
    }

    private var progress: CGFloat {
        guard player.duration > 0 else { return 0 }
        return CGFloat(player.currentTime / player.duration)
    }

    private func togglePlayPause() {
        if player.isPlaying {
            player.pause()
        } else {
            player.play()
        }
    }

    private func timeString(from timeInterval: TimeInterval) -> String {
        let minutes = Int(timeInterval) / 60
        let seconds = Int(timeInterval) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

#Preview {
    PlaybackControlsView(
        player: AudioPlayer(),
        segments: []
    )
    .padding()
}
