import Foundation

// The WidgetSnapshot model and SharedStore live in
// targets/_shared/widget-snapshot-shared.swift so the notification service
// extension can patch the same snapshot. This file keeps the widget-only
// presentation helpers and design-time data out of the other targets.
extension WidgetSnapshot {
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
