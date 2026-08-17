import SwiftUI
import WidgetKit

// Design S1 "Unread count" + lock-screen circular ring gauge and inline text.
struct UnreadWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "UnreadWidget", provider: SnapshotTimelineProvider()) { entry in
            UnreadView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Unread")
        .description("Unread message count at a glance.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
        .contentMarginsDisabled()
    }
}

struct UnreadView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: WidgetSnapshot

    var body: some View {
        switch family {
        case .accessoryCircular:
            circular
        case .accessoryInline:
            Label {
                Text("\(snapshot.unreadCount) new messages")
            } icon: {
                Image(systemName: "dot.radiowaves.left.and.right")
            }
            .containerBackground(for: .widget) {
                Color.clear
            }
            .widgetURL(snapshot.deepLink())
        default:
            small
        }
    }

    private var circular: some View {
        let progress = min(1, Double(snapshot.unreadCount) / 20)
        return ZStack {
            AccessoryWidgetBackground()
            Circle()
                .stroke(.white.opacity(0.18), lineWidth: 7)
                .padding(4)
            Circle()
                .trim(from: 0, to: max(0.02, progress))
                .stroke(.white, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .padding(4)
            VStack(spacing: 1) {
                Text("\(snapshot.unreadCount)")
                    .font(Theme.sans(22, weight: .bold))
                    .minimumScaleFactor(0.6)
                PulseMark(size: 11, color: .white)
            }
        }
        .containerBackground(for: .widget) {
            Color.clear
        }
        .widgetURL(snapshot.deepLink())
    }

    private var small: some View {
        Group {
            if snapshot.hasData {
                VStack(alignment: .leading, spacing: 0) {
                    WgHeader(meta: "now")
                    Spacer(minLength: 0)
                    Text("\(snapshot.unreadCount)")
                        .font(Theme.sans(58, weight: .bold))
                        .kerning(-2)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                        .foregroundStyle(Theme.fg)
                    Text("unread messages")
                        .font(Theme.sans(13))
                        .foregroundStyle(Theme.fgMuted)
                        .padding(.top, 4)
                    HStack(spacing: 6) {
                        ForEach(snapshot.recent.prefix(4), id: \.id) { message in
                            WDot(level: message.priority, size: 8)
                        }
                        Spacer(minLength: 0)
                        Text("\(snapshot.channelCount) ch")
                            .font(Theme.mono(10))
                            .foregroundStyle(Theme.fgDim)
                    }
                    .padding(.top, 12)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
        .widgetURL(snapshot.deepLink())
    }
}
