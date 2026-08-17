import SwiftUI
import WidgetKit

// Design S4 "Volume" 24h sparkline (small) + L2 "Dashboard" (large).
struct StatsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "StatsWidget", provider: SnapshotTimelineProvider()) { entry in
            StatsView(snapshot: entry.snapshot)
        }
        .configurationDisplayName("Stats")
        .description("Message volume over the last 24 hours.")
        .supportedFamilies([.systemSmall, .systemLarge])
        .contentMarginsDisabled()
    }
}

struct StatsView: View {
    @Environment(\.widgetFamily) private var family
    let snapshot: WidgetSnapshot

    private var trendText: String? {
        guard let trend = snapshot.volume.trendPct else {
            return nil
        }
        let rounded = Int(trend.rounded())
        return rounded >= 0 ? "↑ \(rounded)%" : "↓ \(abs(rounded))%"
    }

    private var trendColor: Color {
        (snapshot.volume.trendPct ?? 0) >= 0 ? Theme.green : Theme.red
    }

    var body: some View {
        Group {
            if snapshot.hasData {
                if family == .systemLarge {
                    large
                } else {
                    small
                }
            } else {
                SignedOutView()
            }
        }
        .emitSignalContainer(snapshot)
        .widgetURL(snapshot.deepLink())
    }

    private var sparkline: some View {
        let buckets = snapshot.volume.buckets12
        let maxBucket = max(buckets.max() ?? 1, 1)
        let highlightIndex = buckets.firstIndex(of: buckets.max() ?? 0)
        return GeometryReader { geometry in
            HStack(alignment: .bottom, spacing: 4) {
                ForEach(Array(buckets.enumerated()), id: \.offset) { index, bucket in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(index == highlightIndex ? Theme.violet : Theme.violetDeep)
                        .opacity(index == highlightIndex ? 1 : 0.55)
                        .frame(height: max(2, geometry.size.height * CGFloat(bucket) / CGFloat(maxBucket)))
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                }
            }
        }
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 0) {
            WgHeader()
            Text("messages · 24h")
                .font(Theme.sans(13))
                .foregroundStyle(Theme.fgMuted)
                .padding(.top, 10)
            sparkline
                .frame(height: 44)
                .padding(.top, 10)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(snapshot.volume.total24h)")
                    .font(Theme.sans(22, weight: .bold))
                    .foregroundStyle(Theme.fg)
                if let trendText {
                    Text(trendText)
                        .font(Theme.mono(10))
                        .foregroundStyle(trendColor)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var large: some View {
        let channels = Array(snapshot.channels.prefix(4))
        let maxCount = max(channels.map(\.count24h).max() ?? 1, 1)
        let barColors: [Color] = [Theme.red, Theme.pink, Theme.green, Theme.violet]
        return VStack(alignment: .leading, spacing: 0) {
            WgHeader(meta: "today")
            Text("\(snapshot.volume.total24h)")
                .font(Theme.sans(64, weight: .bold))
                .kerning(-2.5)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .foregroundStyle(Theme.fg)
                .padding(.top, 16)
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("messages today")
                    .font(Theme.sans(13))
                    .foregroundStyle(Theme.fgMuted)
                if let trendText {
                    Text(trendText)
                        .font(Theme.mono(11))
                        .foregroundStyle(trendColor)
                }
            }
            .padding(.top, 6)
            Spacer(minLength: 0)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(channels.enumerated()), id: \.element.id) { index, channel in
                    HStack(spacing: 10) {
                        Text(channel.name)
                            .font(Theme.mono(12))
                            .foregroundStyle(Theme.fgMuted)
                            .lineLimit(1)
                            .frame(width: 56, alignment: .leading)
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(.white.opacity(0.05))
                                Capsule()
                                    .fill(barColors[index % barColors.count])
                                    .frame(width: geometry.size.width * CGFloat(channel.count24h) / CGFloat(maxCount))
                            }
                        }
                        .frame(height: 8)
                        Text("\(channel.count24h)")
                            .font(Theme.mono(12))
                            .foregroundStyle(Theme.fg)
                            .frame(width: 18, alignment: .trailing)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
