//
//  PodcastEditorApp.swift
//  PodcastEditor
//
//  An iOS app for editing podcasts with AI-powered transcription and segmentation
//

import SwiftUI

@main
struct PodcastEditorApp: App {
    @StateObject private var projectManager = PodcastProjectManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(projectManager)
        }
    }
}
