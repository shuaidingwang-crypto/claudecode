//
//  AudioSegment.swift
//  PodcastEditor
//
//  Model representing a segment of audio with transcription and metadata
//

import Foundation
import AVFoundation

struct AudioSegment: Identifiable, Codable {
    let id: UUID
    var audioURL: URL
    var startTime: TimeInterval
    var endTime: TimeInterval
    var transcript: String
    var summary: String
    var speakerLabel: String?
    var order: Int

    var duration: TimeInterval {
        endTime - startTime
    }

    init(id: UUID = UUID(),
         audioURL: URL,
         startTime: TimeInterval,
         endTime: TimeInterval,
         transcript: String = "",
         summary: String = "",
         speakerLabel: String? = nil,
         order: Int = 0) {
        self.id = id
        self.audioURL = audioURL
        self.startTime = startTime
        self.endTime = endTime
        self.transcript = transcript
        self.summary = summary
        self.speakerLabel = speakerLabel
        self.order = order
    }
}

extension AudioSegment {
    /// Formats the duration as MM:SS
    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}
