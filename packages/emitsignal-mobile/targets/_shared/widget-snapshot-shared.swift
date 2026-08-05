import Foundation

// Mirrors WidgetSnapshot in lib/widget-snapshot-builder.ts. The app serializes
// this JSON into the app-group UserDefaults under `widget_snapshot`; the widgets
// render it offline and the notification service extension patches it on push.
//
// Contract: any field added to the TypeScript snapshot MUST be mirrored here —
// the notification service extension decodes and re-encodes the snapshot, so
// unknown JSON keys are silently dropped.
//
// Compiled into the app target and every extension target (targets/_shared),
// so keep this file pure Foundation — no WidgetKit or SwiftUI imports.
struct WidgetSnapshot: Codable {
    struct Channel: Codable {
        var count24h: Int
        var id: String
        var name: String
        var topPriority: Int
        var unread: Int
    }

    struct Message: Codable {
        var createdAt: Double
        var id: String
        var priority: Int
        var title: String
        var topicName: String
        var unread: Bool

        var date: Date {
            Date(timeIntervalSince1970: createdAt / 1000)
        }
    }

    struct Volume: Codable {
        var buckets12: [Int]
        var total24h: Int
        var trendPct: Double?
    }

    var channelCount: Int
    var channels: [Channel]
    var hasData: Bool
    var live: Bool
    var primaryTopic: String?
    var recent: [Message]
    var schemaVersion: Int
    var scheme: String
    var todayMoreCount: Int
    var unreadCount: Int
    var updatedAt: Double
    var volume: Volume
}

enum SharedStore {
    static let snapshotKey = "widget_snapshot"

    // group.<app bundle id>; extensions (widgets, nse) append exactly one
    // dotted component to the app bundle id, so inside an .appex the last
    // component is dropped to recover the app id for every APP_MODE variant.
    static var appGroup: String {
        var bundleIdentifier = Bundle.main.bundleIdentifier ?? "com.emitsignal"

        if Bundle.main.bundlePath.hasSuffix(".appex"),
           let lastDot = bundleIdentifier.lastIndex(of: ".") {
            bundleIdentifier = String(bundleIdentifier[..<lastDot])
        }

        return "group." + bundleIdentifier
    }

    static func load() -> WidgetSnapshot? {
        guard
            let raw = UserDefaults(suiteName: appGroup)?.string(forKey: snapshotKey),
            let data = raw.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
            snapshot.schemaVersion == 1
        else {
            return nil
        }

        return snapshot
    }

    static func save(_ snapshot: WidgetSnapshot) {
        guard
            let data = try? JSONEncoder().encode(snapshot),
            let raw = String(data: data, encoding: .utf8)
        else {
            return
        }

        UserDefaults(suiteName: appGroup)?.set(raw, forKey: snapshotKey)
    }
}
