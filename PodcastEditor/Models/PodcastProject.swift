//
//  PodcastProject.swift
//  PodcastEditor
//
//  Model representing a complete podcast project
//

import Foundation

struct PodcastProject: Identifiable, Codable {
    let id: UUID
    var name: String
    var createdDate: Date
    var modifiedDate: Date
    var originalAudioURL: URL?
    var segments: [AudioSegment]
    var metadata: ProjectMetadata

    init(id: UUID = UUID(),
         name: String,
         createdDate: Date = Date(),
         modifiedDate: Date = Date(),
         originalAudioURL: URL? = nil,
         segments: [AudioSegment] = [],
         metadata: ProjectMetadata = ProjectMetadata()) {
        self.id = id
        self.name = name
        self.createdDate = createdDate
        self.modifiedDate = modifiedDate
        self.originalAudioURL = originalAudioURL
        self.segments = segments
        self.metadata = metadata
    }

    var totalDuration: TimeInterval {
        segments.reduce(0) { $0 + $1.duration }
    }
}

struct ProjectMetadata: Codable {
    var author: String = ""
    var description: String = ""
    var tags: [String] = []
}

class PodcastProjectManager: ObservableObject {
    @Published var currentProject: PodcastProject?
    @Published var projects: [PodcastProject] = []

    private let projectsKey = "savedProjects"

    init() {
        loadProjects()
    }

    func createNewProject(name: String) {
        let project = PodcastProject(name: name)
        currentProject = project
        projects.append(project)
        saveProjects()
    }

    func saveProjects() {
        if let encoded = try? JSONEncoder().encode(projects) {
            UserDefaults.standard.set(encoded, forKey: projectsKey)
        }
    }

    func loadProjects() {
        if let data = UserDefaults.standard.data(forKey: projectsKey),
           let decoded = try? JSONDecoder().decode([PodcastProject].self, from: data) {
            projects = decoded
        }
    }

    func updateCurrentProject(_ project: PodcastProject) {
        var updated = project
        updated.modifiedDate = Date()
        currentProject = updated

        if let index = projects.firstIndex(where: { $0.id == project.id }) {
            projects[index] = updated
        }
        saveProjects()
    }
}
