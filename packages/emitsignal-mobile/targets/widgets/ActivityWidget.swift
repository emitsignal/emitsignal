import SwiftUI
import WidgetKit

// Design M3 "Activity" (recent 3, medium) + L1 "Feed" (recent 5, large).
struct ActivityWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ActivityWidget", provider: SnapshotTimelineProvider()) { entry in
            ActivityView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Activity")
        .description("Recent signals across your channels.")
        .supportedFamilies([.systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

struct ActivityView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: WidgetSnapshot

    var body: some View {
        Group {
            if snapshot.hasData {
                if family == .systemLarge {
                    large
                } else {
                    medium
                }
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
    }

    private var medium: some View {
        VStack(alignment: .leading, spacing: 0) {
            WgHeader(meta: "\(snapshot.channelCount) ch")
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(snapshot.recent.prefix(3).enumerated()), id: \.element.id) { index, message in
                    if index > 0 {
                        Hairline()
                    }
                    Link(destination: snapshot.deepLink("/messages/\(message.id)")) {
                        HStack(spacing: 9) {
                            WDot(level: message.priority, size: 8)
                            Text(message.topicName)
                                .font(Theme.mono(11))
                                .foregroundStyle(Theme.fgDim)
                                .lineLimit(1)
                                .frame(width: 56, alignment: .leading)
                            Text(message.title)
                                .font(Theme.sans(13))
                                .foregroundStyle(Theme.fg)
                                .lineLimit(1)
                            Spacer(minLength: 0)
                            Text(WidgetTime.short(message.date))
                                .font(Theme.mono(10))
                                .foregroundStyle(Theme.fgFaint)
                        }
                        .padding(.vertical, 7)
                    }
                }
            }
            .padding(.top, 10)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var large: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                PulseMark(size: 18)
                Text("signals")
                    .font(Theme.mono(14))
                    .kerning(-0.3)
                    .foregroundStyle(Theme.fg)
                Spacer(minLength: 0)
                if snapshot.unreadCount > 0 {
                    UnreadBadge(text: "\(snapshot.unreadCount) new")
                }
            }
            VStack(alignment: .leading, spacing: 0) {
                ForEach(snapshot.recent.prefix(5), id: \.id) { message in
                    Hairline()
                    Link(destination: snapshot.deepLink("/messages/\(message.id)")) {
                        HStack(spacing: 10) {
                            TopicAvatar(name: message.topicName, size: 30, rounded: 8)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(message.title)
                                    .font(Theme.sans(13.5))
                                    .kerning(-0.2)
                                    .foregroundStyle(Theme.fg)
                                    .lineLimit(1)
                                Text("\(message.topicName) · \(WidgetTime.short(message.date))")
                                    .font(Theme.mono(10.5))
                                    .foregroundStyle(Theme.fgDim)
                                    .lineLimit(1)
                            }
                            Spacer(minLength: 0)
                            WDot(level: message.priority, size: 8)
                        }
                        .padding(.vertical, 11)
                    }
                }
            }
            .padding(.top, 8)
            Spacer(minLength: 0)
            if let primaryTopic = snapshot.primaryTopic {
                Link(destination: snapshot.deepLink("/topics/\(primaryTopic)")) {
                    Text("→ \(primaryTopic)")
                        .font(Theme.mono(11))
                        .foregroundStyle(Theme.fgDim)
                        .padding(.top, 4)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
