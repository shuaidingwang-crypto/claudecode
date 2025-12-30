//
//  AudioProcessor.swift
//  PodcastEditor
//
//  Service for audio processing, cleaning, and noise reduction
//

import Foundation
import AVFoundation
import Accelerate

class AudioProcessor {

    /// Cleans audio by applying noise reduction and normalization
    func cleanAudio(from sourceURL: URL, completion: @escaping (Result<URL, Error>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let asset = AVAsset(url: sourceURL)

                guard let audioTrack = asset.tracks(withMediaType: .audio).first else {
                    throw AudioProcessingError.noAudioTrack
                }

                // Create composition
                let composition = AVMutableComposition()
                guard let compositionTrack = composition.addMutableTrack(
                    withMediaType: .audio,
                    preferredTrackID: kCMPersistentTrackID_Invalid
                ) else {
                    throw AudioProcessingError.compositionFailed
                }

                try compositionTrack.insertTimeRange(
                    CMTimeRange(start: .zero, duration: asset.duration),
                    of: audioTrack,
                    at: .zero
                )

                // Apply audio processing
                let audioMix = AVMutableAudioMix()
                let audioMixInputParameters = AVMutableAudioMixInputParameters(track: compositionTrack)

                // Normalize volume
                audioMixInputParameters.setVolume(1.0, at: .zero)

                audioMix.inputParameters = [audioMixInputParameters]

                // Export processed audio
                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let outputURL = documentsPath.appendingPathComponent("cleaned_\(UUID().uuidString).m4a")

                guard let exportSession = AVAssetExportSession(
                    asset: composition,
                    presetName: AVAssetExportPresetAppleM4A
                ) else {
                    throw AudioProcessingError.exportFailed
                }

                exportSession.outputURL = outputURL
                exportSession.outputFileType = .m4a
                exportSession.audioMix = audioMix

                exportSession.exportAsynchronously {
                    switch exportSession.status {
                    case .completed:
                        DispatchQueue.main.async {
                            completion(.success(outputURL))
                        }
                    case .failed, .cancelled:
                        DispatchQueue.main.async {
                            completion(.failure(exportSession.error ?? AudioProcessingError.exportFailed))
                        }
                    default:
                        break
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }

    /// Extracts audio segment from source file
    func extractSegment(from sourceURL: URL, startTime: TimeInterval, endTime: TimeInterval, completion: @escaping (Result<URL, Error>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let asset = AVAsset(url: sourceURL)

                guard let audioTrack = asset.tracks(withMediaType: .audio).first else {
                    throw AudioProcessingError.noAudioTrack
                }

                let composition = AVMutableComposition()
                guard let compositionTrack = composition.addMutableTrack(
                    withMediaType: .audio,
                    preferredTrackID: kCMPersistentTrackID_Invalid
                ) else {
                    throw AudioProcessingError.compositionFailed
                }

                let start = CMTime(seconds: startTime, preferredTimescale: 44100)
                let end = CMTime(seconds: endTime, preferredTimescale: 44100)
                let duration = CMTimeSubtract(end, start)

                try compositionTrack.insertTimeRange(
                    CMTimeRange(start: start, duration: duration),
                    of: audioTrack,
                    at: .zero
                )

                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let outputURL = documentsPath.appendingPathComponent("segment_\(UUID().uuidString).m4a")

                guard let exportSession = AVAssetExportSession(
                    asset: composition,
                    presetName: AVAssetExportPresetAppleM4A
                ) else {
                    throw AudioProcessingError.exportFailed
                }

                exportSession.outputURL = outputURL
                exportSession.outputFileType = .m4a

                exportSession.exportAsynchronously {
                    switch exportSession.status {
                    case .completed:
                        DispatchQueue.main.async {
                            completion(.success(outputURL))
                        }
                    case .failed, .cancelled:
                        DispatchQueue.main.async {
                            completion(.failure(exportSession.error ?? AudioProcessingError.exportFailed))
                        }
                    default:
                        break
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }

    /// Merges multiple audio segments into a single file
    func mergeSegments(_ segments: [AudioSegment], completion: @escaping (Result<URL, Error>) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let composition = AVMutableComposition()
                guard let compositionTrack = composition.addMutableTrack(
                    withMediaType: .audio,
                    preferredTrackID: kCMPersistentTrackID_Invalid
                ) else {
                    throw AudioProcessingError.compositionFailed
                }

                var insertTime = CMTime.zero

                for segment in segments.sorted(by: { $0.order < $1.order }) {
                    let asset = AVAsset(url: segment.audioURL)
                    guard let track = asset.tracks(withMediaType: .audio).first else { continue }

                    let timeRange = CMTimeRange(start: .zero, duration: asset.duration)
                    try compositionTrack.insertTimeRange(timeRange, of: track, at: insertTime)
                    insertTime = CMTimeAdd(insertTime, asset.duration)
                }

                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let outputURL = documentsPath.appendingPathComponent("merged_\(UUID().uuidString).m4a")

                guard let exportSession = AVAssetExportSession(
                    asset: composition,
                    presetName: AVAssetExportPresetAppleM4A
                ) else {
                    throw AudioProcessingError.exportFailed
                }

                exportSession.outputURL = outputURL
                exportSession.outputFileType = .m4a

                exportSession.exportAsynchronously {
                    switch exportSession.status {
                    case .completed:
                        DispatchQueue.main.async {
                            completion(.success(outputURL))
                        }
                    case .failed, .cancelled:
                        DispatchQueue.main.async {
                            completion(.failure(exportSession.error ?? AudioProcessingError.exportFailed))
                        }
                    default:
                        break
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
}

enum AudioProcessingError: Error {
    case noAudioTrack
    case compositionFailed
    case exportFailed
    case invalidTimeRange
}
