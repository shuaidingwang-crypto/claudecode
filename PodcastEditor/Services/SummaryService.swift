//
//  SummaryService.swift
//  PodcastEditor
//
//  Service for generating summaries of audio segments
//

import Foundation
import NaturalLanguage

class SummaryService {

    /// Generates a summary for a transcript
    func generateSummary(for transcript: String, maxLength: Int = 100) -> String {
        guard !transcript.isEmpty else { return "" }

        // Extract key sentences using NaturalLanguage framework
        let sentences = extractSentences(from: transcript)

        if sentences.isEmpty {
            return String(transcript.prefix(maxLength)) + "..."
        }

        // Score sentences by importance
        let scoredSentences = scoreSentences(sentences, fullText: transcript)

        // Select top sentences
        let topSentences = scoredSentences
            .sorted { $0.score > $1.score }
            .prefix(min(2, sentences.count))
            .sorted { $0.index < $1.index }

        var summary = topSentences.map { $0.sentence }.joined(separator: " ")

        // Truncate if too long
        if summary.count > maxLength {
            summary = String(summary.prefix(maxLength)) + "..."
        }

        return summary
    }

    /// Extracts sentences from text
    private func extractSentences(from text: String) -> [String] {
        let tokenizer = NLTokenizer(unit: .sentence)
        tokenizer.string = text

        var sentences: [String] = []
        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { range, _ in
            let sentence = String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            if !sentence.isEmpty {
                sentences.append(sentence)
            }
            return true
        }

        return sentences
    }

    /// Scores sentences by importance
    private func scoreSentences(_ sentences: [String], fullText: String) -> [(sentence: String, score: Double, index: Int)] {
        let keywords = extractKeywords(from: fullText)
        var scored: [(sentence: String, score: Double, index: Int)] = []

        for (index, sentence) in sentences.enumerated() {
            var score = 0.0

            // Position score (earlier sentences get higher scores)
            let positionScore = 1.0 - (Double(index) / Double(sentences.count))
            score += positionScore * 0.3

            // Keyword density score
            let lowercased = sentence.lowercased()
            let keywordCount = keywords.filter { lowercased.contains($0) }.count
            let keywordScore = Double(keywordCount) / max(1.0, Double(keywords.count))
            score += keywordScore * 0.5

            // Length score (prefer medium-length sentences)
            let words = sentence.split(separator: " ").count
            let lengthScore = min(1.0, Double(words) / 20.0)
            score += lengthScore * 0.2

            scored.append((sentence, score, index))
        }

        return scored
    }

    /// Extracts important keywords from text
    private func extractKeywords(from text: String, limit: Int = 10) -> [String] {
        let tagger = NLTagger(tagSchemes: [.lexicalClass])
        tagger.string = text

        var keywords: [String: Int] = [:]

        tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .lexicalClass) { tag, range in
            if let tag = tag, (tag == .noun || tag == .verb) {
                let word = String(text[range]).lowercased()
                if word.count > 3 { // Skip short words
                    keywords[word, default: 0] += 1
                }
            }
            return true
        }

        return keywords
            .sorted { $0.value > $1.value }
            .prefix(limit)
            .map { $0.key }
    }

    /// Generates a title for a segment based on its content
    func generateTitle(for transcript: String) -> String {
        let sentences = extractSentences(from: transcript)
        guard let firstSentence = sentences.first else {
            return "Untitled Segment"
        }

        // Extract key phrase from first sentence
        let keywords = extractKeywords(from: firstSentence, limit: 3)
        if keywords.isEmpty {
            let words = firstSentence.split(separator: " ").prefix(5)
            return words.joined(separator: " ")
        }

        return keywords.joined(separator: " ").capitalized
    }
}
