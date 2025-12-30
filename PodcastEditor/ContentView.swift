//
//  ContentView.swift
//  PodcastEditor
//
//  Main navigation view for the podcast editor
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var projectManager: PodcastProjectManager
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            RecordingView()
                .tabItem {
                    Label("Record", systemImage: "mic.fill")
                }
                .tag(0)

            ProcessingView()
                .tabItem {
                    Label("Process", systemImage: "waveform")
                }
                .tag(1)

            TimelineEditorView()
                .tabItem {
                    Label("Edit", systemImage: "timeline.selection")
                }
                .tag(2)

            ExportView()
                .tabItem {
                    Label("Export", systemImage: "square.and.arrow.up")
                }
                .tag(3)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(PodcastProjectManager())
}
