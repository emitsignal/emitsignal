import os.log
import UserNotifications
import WidgetKit

// Runs for every visible push (mutable-content: 1), including while the app is
// backgrounded or terminated: patches the shared widget snapshot with the
// incoming message and reloads the widget timelines, then delivers the
// notification content unchanged.
//
// The patch is an approximation — todayMoreCount and the activity buckets are
// only bumped, not recomputed — and the app overwrites the snapshot with a full
// rebuild on its next foreground sync. Concurrent writes (app vs. extension)
// go through process-safe app-group UserDefaults; a lost increment self-heals
// on that same full sync.
//
// Note: simctl pushes do not launch service extensions in the simulator; test
// on a physical device (stream logs in Console.app filtered by this subsystem).
private let log = Logger(subsystem: "com.emitsignal.nse", category: "snapshot")

class NotificationService: UNNotificationServiceExtension {
    // Mirror MAX_RECENT / MAX_CHANNELS in lib/widget-snapshot-builder.ts.
    private static let maxRecentMessages = 6
    private static let maxChannels = 8

    private var contentHandler: ((UNNotificationContent) -> Void)?
    private var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        log.info("didReceive: begin")
        patchSnapshot(content: request.content)
        log.info("didReceive: done")

        contentHandler(bestAttemptContent ?? request.content)
    }

    override func serviceExtensionTimeWillExpire() {
        log.error("serviceExtensionTimeWillExpire")

        if let bestAttemptContent {
            contentHandler?(bestAttemptContent)
        }
    }

    private func patchSnapshot(content: UNNotificationContent) {
        let userInfo = content.userInfo

        guard let data = extractData(from: userInfo) else {
            let keys = userInfo.keys.compactMap { $0 as? String }.joined(separator: ",")
            log.error("no data payload; userInfo keys: \(keys, privacy: .public)")
            return
        }

        guard
            let messageId = data["messageId"] as? String,
            let topicId = data["topicId"] as? String,
            let topicName = data["topicName"] as? String
        else {
            let keys = data.keys.joined(separator: ",")
            log.error("data missing ids; data keys: \(keys, privacy: .public)")
            return
        }

        log.info("payload ok: messageId=\(messageId, privacy: .public) appGroup=\(SharedStore.appGroup, privacy: .public)")

        // Never fabricate a snapshot: absent means the app has not synced yet,
        // the user signed out, or the schema versions disagree.
        guard var snapshot = SharedStore.load() else {
            log.error("snapshot missing or undecodable in app group \(SharedStore.appGroup, privacy: .public)")
            return
        }

        // APNs can redeliver; skip messages the snapshot already contains.
        if snapshot.recent.contains(where: { $0.id == messageId }) {
            log.info("duplicate message \(messageId, privacy: .public); skipping")
            return
        }

        let priority = intValue(data["priority"]) ?? 3
        let createdAt = doubleValue(data["createdAt"]) ?? Date().timeIntervalSince1970 * 1000

        // buildExpoMessages puts the message title in `subtitle` (falling back
        // to the body text), matching `title: message.title || message.body`
        // in the snapshot builder.
        var title = content.subtitle
        if title.isEmpty {
            title = content.body
        }

        let message = WidgetSnapshot.Message(
            createdAt: createdAt,
            id: messageId,
            priority: priority,
            title: title,
            topicName: topicName,
            unread: true
        )

        snapshot.recent.insert(message, at: 0)
        if snapshot.recent.count > Self.maxRecentMessages {
            snapshot.recent.removeLast(snapshot.recent.count - Self.maxRecentMessages)
        }

        snapshot.unreadCount += 1

        if let index = snapshot.channels.firstIndex(where: { $0.id == topicId }) {
            snapshot.channels[index].unread += 1
            snapshot.channels[index].count24h += 1
            snapshot.channels[index].topPriority = max(snapshot.channels[index].topPriority, priority)
        } else {
            snapshot.channels.append(
                WidgetSnapshot.Channel(
                    count24h: 1,
                    id: topicId,
                    name: topicName,
                    topPriority: priority,
                    unread: 1
                )
            )
            snapshot.channelCount += 1
        }

        // Mirrors the builder's ordering: unread desc, then count24h desc.
        snapshot.channels.sort { first, second in
            if first.unread != second.unread {
                return first.unread > second.unread
            }
            return first.count24h > second.count24h
        }
        if snapshot.channels.count > Self.maxChannels {
            snapshot.channels.removeLast(snapshot.channels.count - Self.maxChannels)
        }

        snapshot.volume.total24h += 1
        if !snapshot.volume.buckets12.isEmpty {
            snapshot.volume.buckets12[snapshot.volume.buckets12.count - 1] += 1
        }

        snapshot.primaryTopic = topicName
        snapshot.hasData = true
        snapshot.updatedAt = Date().timeIntervalSince1970 * 1000

        SharedStore.save(snapshot)
        WidgetCenter.shared.reloadAllTimelines()
        log.info("snapshot patched and timelines reloaded")
    }

    // The Expo push service nests the message `data` under the top-level
    // `body` key of the APNs payload — as a dictionary, or as a JSON string in
    // some delivery paths. Fall back to root-level keys for direct APNs sends.
    private func extractData(from userInfo: [AnyHashable: Any]) -> [String: Any]? {
        if let body = userInfo["body"] as? [String: Any] {
            return body
        }

        if let raw = userInfo["body"] as? String,
           let data = raw.data(using: .utf8),
           let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return parsed
        }

        if userInfo["messageId"] is String {
            var root: [String: Any] = [:]
            for (key, value) in userInfo {
                if let stringKey = key as? String {
                    root[stringKey] = value
                }
            }
            return root
        }

        return nil
    }

    private func intValue(_ value: Any?) -> Int? {
        if let number = value as? NSNumber {
            return number.intValue
        }
        if let string = value as? String {
            return Int(string)
        }
        return nil
    }

    private func doubleValue(_ value: Any?) -> Double? {
        if let number = value as? NSNumber {
            return number.doubleValue
        }
        if let string = value as? String {
            return Double(string)
        }
        return nil
    }
}
