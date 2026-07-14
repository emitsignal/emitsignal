import SwiftUI
import WidgetKit

// Design S2 "Live status" — pulsing dot, primary topic, listening summary.
struct LiveStatusWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LiveStatusWidget", provider: SnapshotTimelineProvider()) { entry in
            LiveStatusView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Live Status")
        .description("Whether you are listening for signals.")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

struct LiveStatusView: View {
    let snapshot: WidgetSnapshot

    var body: some View {
        Group {
            if snapshot.hasData {
                content
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
        .widgetURL(snapshot.deepLink())
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            WgHeader()
            Spacer(minLength: 0)
            HStack(spacing: 8) {
                Circle()
                    .fill(snapshot.live ? Theme.green : Theme.fgFaint)
                    .frame(width: 10, height: 10)
                    .shadow(color: snapshot.live ? Theme.green.opacity(0.6) : .clear, radius: 5)
                Text(snapshot.live ? "live" : "idle")
                    .font(Theme.mono(16, weight: .semibold))
                    .foregroundStyle(snapshot.live ? Theme.green : Theme.fgDim)
            }
            if let primaryTopic = snapshot.primaryTopic {
                Text(primaryTopic)
                    .font(Theme.mono(15))
                    .kerning(-0.3)
                    .foregroundStyle(Theme.fg)
                    .lineLimit(1)
                    .padding(.top, 8)
            }
            Text("listening · \(snapshot.channelCount) channels")
                .font(Theme.sans(12))
                .foregroundStyle(Theme.fgDim)
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
