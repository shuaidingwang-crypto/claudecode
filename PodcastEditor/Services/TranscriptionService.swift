//
//  TranscriptionService.swift
//  PodcastEditor
//
//  Service for transcribing audio to text using Speech framework
//

import Foundation
import Speech
import AVFoundation

class TranscriptionService: ObservableObject {
    @Published var isTranscribing = false
    @Published var progress: Double = 0

    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                completion(status == .authorized)
            }
        }
    }

    /// Transcribes audio file to text
    func transcribe(audioURL: URL, completion: @escaping (Result<String, Error>) -> Void) {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            completion(.failure(TranscriptionError.recognizerNotAvailable))
            return
        }

        DispatchQueue.main.async {
            self.isTranscribing = true
            self.progress = 0
        }

        let request = SFSpeechURLRecognitionRequest(url: audioURL)
        request.shouldReportPartialResults = false
        request.requiresOnDeviceRecognition = false

        speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let error = error {
                DispatchQueue.main.async {
                    self.isTranscribing = false
                    completion(.failure(error))
                }
                return
            }

            if let result = result {
                DispatchQueue.main.async {
                    self.progress = result.isFinal ? 1.0 : 0.5
                }

                if result.isFinal {
                    let transcription = result.bestTranscription.formattedString
                    DispatchQueue.main.async {
                        self.isTranscribing = false
                        self.progress = 1.0
                        completion(.success(transcription))
                    }
                }
            }
        }
    }

    /// Transcribes audio with timestamps for each segment
    func transcribeWithTimestamps(audioURL: URL, completion: @escaping (Result<[TimestampedTranscript], Error>) -> Void) {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            completion(.failure(TranscriptionError.recognizerNotAvailable))
            return
        }

        DispatchQueue.main.async {
            self.isTranscribing = true
            self.progress = 0
        }

        let request = SFSpeechURLRecognitionRequest(url: audioURL)
        request.shouldReportPartialResults = false
        request.requiresOnDeviceRecognition = false
        request.addsPunctuation = true

        speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let error = error {
                DispatchQueue.main.async {
                    self.isTranscribing = false
                    completion(.failure(error))
                }
                return
            }

            if let result = result, result.isFinal {
                let segments = result.bestTranscription.segments
                let timestampedSegments = segments.map { segment in
                    TimestampedTranscript(
                        text: segment.substring,
                        startTime: segment.timestamp,
                        duration: segment.duration,
                        confidence: segment.confidence
                    )
                }

                DispatchQueue.main.async {
                    self.isTranscribing = false
                    self.progress = 1.0
                    completion(.success(timestampedSegments))
                }
            }
        }
    }
}

struct TimestampedTranscript {
    let text: String
    let startTime: TimeInterval
    let duration: TimeInterval
    let confidence: Float
}

enum TranscriptionError: Error {
    case recognizerNotAvailable
    case authorizationDenied
    case transcriptionFailed
}
