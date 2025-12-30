//
//  SegmentationService.swift
//  PodcastEditor
//
//  Service for intelligently segmenting audio based on content understanding
//

import Foundation
import NaturalLanguage

class SegmentationService {

    /// Segments transcribed text into meaningful chunks based on topics and semantic breaks
    func segmentTranscript(_ timestampedSegments: [TimestampedTranscript], audioURL: URL) -> [AudioSegment] {
        // Combine timestamps into sentences
        let sentences = groupIntoSentences(timestampedSegments)

        // Detect topic changes and create segments
        let topicSegments = detectTopicChanges(sentences)

        // Create audio segments
        var audioSegments: [AudioSegment] = []
        for (index, segment) in topicSegments.enumerated() {
            let startTime = segment.first?.startTime ?? 0
            let endTime = (segment.last?.startTime ?? 0) + (segment.last?.duration ?? 0)
            let transcript = segment.map { $0.text }.joined(separator: " ")

            let audioSegment = AudioSegment(
                audioURL: audioURL,
                startTime: startTime,
                endTime: endTime,
                transcript: transcript,
                summary: "",
                order: index
            )
            audioSegments.append(audioSegment)
        }

        return audioSegments
    }

    /// Groups timestamped segments into sentences
    private func groupIntoSentences(_ segments: [TimestampedTranscript]) -> [TimestampedTranscript] {
        var sentences: [TimestampedTranscript] = []
        var currentSentence = ""
        var currentStart: TimeInterval = 0
        var currentDuration: TimeInterval = 0

        for segment in segments {
            if currentSentence.isEmpty {
                currentStart = segment.startTime
            }

            currentSentence += segment.text + " "
            currentDuration = (segment.startTime + segment.duration) - currentStart

            // Check if sentence ends
            if segment.text.hasSuffix(".") || segment.text.hasSuffix("!") || segment.text.hasSuffix("?") {
                sentences.append(TimestampedTranscript(
                    text: currentSentence.trimmingCharacters(in: .whitespaces),
                    startTime: currentStart,
                    duration: currentDuration,
                    confidence: segment.confidence
                ))
                currentSentence = ""
            }
        }

        // Add remaining text
        if !currentSentence.isEmpty {
            sentences.append(TimestampedTranscript(
                text: currentSentence.trimmingCharacters(in: .whitespaces),
                startTime: currentStart,
                duration: currentDuration,
                confidence: 1.0
            ))
        }

        return sentences
    }

    /// Detects topic changes using semantic similarity
    private func detectTopicChanges(_ sentences: [TimestampedTranscript]) -> [[TimestampedTranscript]] {
        guard !sentences.isEmpty else { return [] }

        var segments: [[TimestampedTranscript]] = []
        var currentSegment: [TimestampedTranscript] = []

        let embedding = NLEmbedding.sentenceEmbedding(for: .english)

        for (index, sentence) in sentences.enumerated() {
            currentSegment.append(sentence)

            // Check if we should create a new segment
            if shouldCreateNewSegment(
                currentSentence: sentence,
                previousSentence: index > 0 ? sentences[index - 1] : nil,
                currentSegmentSize: currentSegment.count,
                embedding: embedding
            ) {
                segments.append(currentSegment)
                currentSegment = []
            }
        }

        // Add remaining segment
        if !currentSegment.isEmpty {
            segments.append(currentSegment)
        }

        // Merge very short segments
        return mergeShortSegments(segments)
    }

    /// Determines if a new segment should be created
    private func shouldCreateNewSegment(
        currentSentence: TimestampedTranscript,
        previousSentence: TimestampedTranscript?,
        currentSegmentSize: Int,
        embedding: NLEmbedding?
    ) -> Bool {
        // Minimum segment size (sentences)
        let minSegmentSize = 3
        if currentSegmentSize < minSegmentSize {
            return false
        }

        // Maximum segment size
        let maxSegmentSize = 15
        if currentSegmentSize >= maxSegmentSize {
            return true
        }

        // Check for topic transition indicators
        let transitionPhrases = [
            "now let's", "moving on", "next topic", "in conclusion",
            "to summarize", "another thing", "on the other hand",
            "meanwhile", "speaking of", "by the way"
        ]

        let currentText = currentSentence.text.lowercased()
        for phrase in transitionPhrases {
            if currentText.contains(phrase) {
                return true
            }
        }

        // Use semantic similarity if available
        if let embedding = embedding,
           let previous = previousSentence {
            let currentVector = embedding.vector(for: currentSentence.text)
            let previousVector = embedding.vector(for: previous.text)

            if let current = currentVector,
               let prev = previousVector {
                let similarity = cosineSimilarity(current, prev)
                // If similarity is below threshold, create new segment
                if similarity < 0.5 {
                    return true
                }
            }
        }

        return false
    }

    /// Merges segments that are too short
    private func mergeShortSegments(_ segments: [[TimestampedTranscript]]) -> [[TimestampedTranscript]] {
        var merged: [[TimestampedTranscript]] = []
        var current: [TimestampedTranscript] = []

        for segment in segments {
            current.append(contentsOf: segment)

            // Keep accumulating until we have enough sentences
            if current.count >= 3 {
                merged.append(current)
                current = []
            }
        }

        // Add remaining
        if !current.isEmpty {
            if !merged.isEmpty {
                merged[merged.count - 1].append(contentsOf: current)
            } else {
                merged.append(current)
            }
        }

        return merged
    }

    /// Calculates cosine similarity between two vectors
    private func cosineSimilarity(_ a: [Double], _ b: [Double]) -> Double {
        guard a.count == b.count else { return 0 }

        var dotProduct = 0.0
        var magnitudeA = 0.0
        var magnitudeB = 0.0

        for i in 0..<a.count {
            dotProduct += a[i] * b[i]
            magnitudeA += a[i] * a[i]
            magnitudeB += b[i] * b[i]
        }

        let magnitude = sqrt(magnitudeA) * sqrt(magnitudeB)
        return magnitude > 0 ? dotProduct / magnitude : 0
    }
}
