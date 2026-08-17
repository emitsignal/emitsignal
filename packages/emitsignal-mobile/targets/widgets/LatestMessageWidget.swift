import SwiftUI
import WidgetKit

// Design S3 "Latest message" (small), M1 full card (medium), lock-screen rectangular.
struct LatestMessageWidget: Widget {
    var body: some WidgetConfiguration {
        // The kind string is the identity WidgetKit persists for already-placed
        // widgets; renaming it would blank them out on upgrade.
        StaticConfiguration(kind: "LatestSignalWidget", provider: SnapshotTimelineProvider()) { entry in
            LatestMessageView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Latest Message")
        .description("The most recent message from your channels.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
        .contentMarginsDisabled()
    }
}

struct LatestMessageView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: WidgetSnapshot

    private var destination: URL {
        if let latest = snapshot.latest {
            return snapshot.deepLink("/messages/\(latest.id)")
        }
        return snapshot.deepLink()
    }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            rectangular
        case .systemMedium:
            medium
        default:
            small
        }
    }

    private var rectangular: some View {
        Group {
            if let latest = snapshot.latest {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        PulseMark(size: 13, color: .white)
                        Text(latest.topicName)
                            .font(Theme.mono(12))
                            .opacity(0.85)
                        Spacer(minLength: 0)
                        Text(WidgetTime.short(latest.date))
                            .font(Theme.mono(11))
                            .opacity(0.6)
                    }
                    Text(latest.title)
                        .font(Theme.sans(15, weight: .semibold))
                        .kerning(-0.2)
                        .lineLimit(1)
                    Text("+ \(snapshot.todayMoreCount) more messages")
                        .font(Theme.mono(11))
                        .opacity(0.7)
                }
            } else {
                HStack(spacing: 6) {
                    PulseMark(size: 13, color: .white)
                    Text("no messages yet")
                        .font(Theme.mono(12))
                        .opacity(0.7)
                }
            }
        }
        .containerBackground(for: .widget) {
            Color.clear
        }
        .widgetURL(destination)
    }

    private var small: some View {
        Group {
            if let latest = snapshot.latest {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        TopicAvatar(name: latest.topicName, size: 30, rounded: 8)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(latest.topicName)
                                .font(Theme.mono(11))
                                .foregroundStyle(Theme.fgDim)
                                .lineLimit(1)
                            Text(WidgetTime.short(latest.date))
                                .font(Theme.mono(10))
                                .foregroundStyle(Theme.fgFaint)
                        }
                        Spacer(minLength: 0)
                        WDot(level: latest.priority, size: 9)
                    }
                    Text(latest.title)
                        .font(Theme.sans(15))
                        .kerning(-0.2)
                        .lineSpacing(3)
                        .foregroundStyle(Theme.fg)
                        .lineLimit(3)
                    Spacer(minLength: 0)
                    Text("+ \(snapshot.todayMoreCount) more today")
                        .font(Theme.mono(10))
                        .foregroundStyle(Theme.fgDim)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
        .widgetURL(destination)
    }

    private var medium: some View {
        Group {
            if let latest = snapshot.latest {
                VStack(alignment: .leading, spacing: 0) {
                    WgHeader(meta: WidgetTime.short(latest.date))
                    HStack(spacing: 12) {
                        TopicAvatar(name: latest.topicName, size: 42, rounded: 10)
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 8) {
                                WDot(level: latest.priority, size: 8)
                                Text(latest.topicName)
                                    .font(Theme.mono(12))
                                    .foregroundStyle(Theme.fgDim)
                                    .lineLimit(1)
                                Spacer(minLength: 0)
                                Text("p\(latest.priority)")
                                    .font(Theme.mono(11))
                                    .foregroundStyle(Theme.priority(latest.priority))
                            }
                            Text(latest.title)
                                .font(Theme.sans(18))
                                .kerning(-0.3)
                                .foregroundStyle(Theme.fg)
                                .lineLimit(1)
                        }
                    }
                    .padding(.top, 14)
                    Spacer(minLength: 0)
                    HStack {
                        Text("\(snapshot.todayMoreCount) more · \(snapshot.channelCount) channels")
                            .font(Theme.mono(11))
                            .foregroundStyle(Theme.fgDim)
                        Spacer(minLength: 0)
                        Text("open →")
                            .font(Theme.mono(11))
                            .foregroundStyle(Theme.violet)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
        .widgetURL(destination)
    }
}
