import WidgetKit

struct SnapshotEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

// One provider shared by every widget kind: a single entry with a `.never`
// policy — the app pushes ExtensionStorage.reloadWidget() whenever the
// snapshot changes, so there is no timeline to precompute.
struct SnapshotTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> SnapshotEntry {
        SnapshotEntry(date: Date(), snapshot: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
        if context.isPreview {
            completion(SnapshotEntry(date: Date(), snapshot: .sample))
            return
        }
        completion(SnapshotEntry(date: Date(), snapshot: SharedStore.load() ?? .empty))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
        let entry = SnapshotEntry(date: Date(), snapshot: SharedStore.load() ?? .empty)
        completion(Timeline(entries: [entry], policy: .never))
    }
}
