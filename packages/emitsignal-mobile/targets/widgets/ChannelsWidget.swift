import SwiftUI
import WidgetKit

// Design M2 "Channels" — 2×2 grid of channel chips with unread badges.
struct ChannelsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ChannelsWidget", provider: SnapshotTimelineProvider()) { entry in
            ChannelsView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Channels")
        .description("Your channels with unread counts.")
        .supportedFamilies([.systemMedium])
        .contentMarginsDisabled()
    }
}

struct ChannelsView: View {
    let snapshot: WidgetSnapshot

    var body: some View {
        Group {
            if snapshot.hasData, !snapshot.channels.isEmpty {
                content
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            WgHeader(meta: "channels")
            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 10),
                    GridItem(.flexible(), spacing: 10),
                ],
                spacing: 10
            ) {
                ForEach(snapshot.channels.prefix(4), id: \.id) { channel in
                    Link(destination: snapshot.deepLink("/topics/\(channel.name)")) {
                        ChannelChip(channel: channel)
                    }
                }
            }
            .padding(.top, 14)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct ChannelChip: View {
    let channel: WidgetSnapshot.Channel

    var body: some View {
        HStack(spacing: 9) {
            TopicAvatar(name: channel.name, size: 26, rounded: 7)
            Text(channel.name)
                .font(Theme.mono(12))
                .kerning(-0.2)
                .foregroundStyle(Theme.fgMuted)
                .lineLimit(1)
            Spacer(minLength: 0)
            if channel.unread > 0 {
                Text("\(channel.unread)")
                    .font(Theme.sans(12, weight: .bold))
                    .foregroundStyle(Theme.fg)
                    .frame(minWidth: 20, minHeight: 20)
                    .background(Capsule().fill(Theme.violetDim))
            } else {
                WDot(level: channel.topPriority, size: 7)
            }
        }
        .padding(.vertical, 7)
        .padding(.horizontal, 9)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(Theme.bgLine, lineWidth: 1)
                )
        )
    }
}
