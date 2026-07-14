import Foundation

// Mirrors WidgetSnapshot in lib/widget-snapshot.ts. The app serializes this JSON
// into the app-group UserDefaults under `widget_snapshot`; widgets render offline.
struct WidgetSnapshot: Codable {
    struct Channel: Codable {
        let count24h: Int
        let id: String
        let name: String
        let topPriority: Int
        let unread: Int
    }

    struct Message: Codable {
        let createdAt: Double
        let id: String
        let priority: Int
        let title: String
        let topicName: String
        let unread: Bool

        var date: Date {
            Date(timeIntervalSince1970: createdAt / 1000)
        }
    }

    struct Volume: Codable {
        let buckets12: [Int]
        let total24h: Int
        let trendPct: Double?
    }

    let channelCount: Int
    let channels: [Channel]
    let hasData: Bool
    let live: Bool
    let primaryTopic: String?
    let recent: [Message]
    let schemaVersion: Int
    let scheme: String
    let todayMoreCount: Int
    let unreadCount: Int
    let updatedAt: Double
    let volume: Volume

    var latest: Message? {
        recent.first
    }

    var isStale: Bool {
        Date().timeIntervalSince(Date(timeIntervalSince1970: updatedAt / 1000)) > 24 * 60 * 60
    }

    func deepLink(_ path: String = "/") -> URL {
        let encoded = path
            .addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "/"
        return URL(string: "\(scheme)://\(encoded)") ?? URL(string: "\(scheme)://")!
    }
}

enum SharedStore {
    // group.<app bundle id>; the widget bundle id is always "<app bundle id>.widgets"
    static var appGroup: String {
        let bundleIdentifier = Bundle.main.bundleIdentifier ?? "com.emitsignal.widgets"
        return "group." + bundleIdentifier.replacingOccurrences(of: ".widgets", with: "")
    }

    static func load() -> WidgetSnapshot? {
        guard
            let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "widget_snapshot"),
            let data = raw.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
            snapshot.schemaVersion == 1
        else {
            return nil
        }
        return snapshot
    }
}

extension WidgetSnapshot {
    // Design sample data from Logo & Identity.html · 08 Home-screen widgets
    static var sample: WidgetSnapshot {
        let now = Date().timeIntervalSince1970 * 1000
        let minute = 60_000.0
        return WidgetSnapshot(
            channelCount: 4,
            channels: [
                Channel(count24h: 9, id: "1", name: "alerts", topPriority: 5, unread: 3),
                Channel(count24h: 5, id: "2", name: "deploys", topPriority: 3, unread: 1),
                Channel(count24h: 3, id: "3", name: "ci", topPriority: 2, unread: 0),
                Channel(count24h: 2, id: "4", name: "billing", topPriority: 4, unread: 2),
            ],
            hasData: true,
            live: true,
            primaryTopic: "alerts/prod",
            recent: [
                Message(createdAt: now - 2 * minute, id: "m1", priority: 5, title: "latency p99 over 800ms", topicName: "alerts", unread: true),
                Message(createdAt: now - 9 * minute, id: "m2", priority: 3, title: "v2.4.0 shipped to prod", topicName: "deploys", unread: true),
                Message(createdAt: now - 10 * minute, id: "m3", priority: 2, title: "build passed → prod", topicName: "ci", unread: false),
                Message(createdAt: now - 35 * minute, id: "m4", priority: 2, title: "invoice #2231 paid", topicName: "billing", unread: true),
                Message(createdAt: now - 53 * minute, id: "m5", priority: 1, title: "flaky test retried ok", topicName: "ci", unread: false),
            ],
            schemaVersion: 1,
            scheme: "emitsignal",
            todayMoreCount: 11,
            unreadCount: 12,
            updatedAt: now,
            volume: Volume(buckets12: [3, 5, 4, 7, 6, 9, 5, 8, 12, 7, 10, 6], total24h: 78, trendPct: 14)
        )
    }

    static var empty: WidgetSnapshot {
        WidgetSnapshot(
            channelCount: 0,
            channels: [],
            hasData: false,
            live: false,
            primaryTopic: nil,
            recent: [],
            schemaVersion: 1,
            scheme: "emitsignal",
            todayMoreCount: 0,
            unreadCount: 0,
            updatedAt: Date().timeIntervalSince1970 * 1000,
            volume: Volume(buckets12: [], total24h: 0, trendPct: nil)
        )
    }
}
