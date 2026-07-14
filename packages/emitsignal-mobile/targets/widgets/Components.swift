import SwiftUI
import WidgetKit

// Pulse mark: center dot + two concentric rings (DESIGN.md · Logo — Pulse variant).
// WidgetKit cannot animate, so the rings render at their static opacities.
struct PulseMark: View {
    var size: CGFloat = 15
    var color: Color = Theme.violet

    var body: some View {
        ZStack {
            Circle()
                .strokeBorder(color.opacity(0.18), lineWidth: max(1, size * 0.02))
                .frame(width: size * 0.85, height: size * 0.85)
            Circle()
                .strokeBorder(color.opacity(0.38), lineWidth: max(1, size * 0.025))
                .frame(width: size * 0.55, height: size * 0.55)
            Circle()
                .fill(color)
                .frame(width: size * 0.3, height: size * 0.3)
        }
        .frame(width: size, height: size)
    }
}

// Priority dot with a soft glow, colored p1-p5.
struct WDot: View {
    var level: Int = 3
    var size: CGFloat = 6
    var glow = true

    var body: some View {
        let color = Theme.priority(level)
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .shadow(color: glow ? color.opacity(0.6) : .clear, radius: size / 2)
    }
}

// Rounded-square topic avatar: deterministic hash → hue, two-letter monogram.
struct TopicAvatar: View {
    let name: String
    var size: CGFloat = 36
    var rounded: CGFloat = 8

    var body: some View {
        let colors = Color.topicAvatarColors(for: name)
        let monogram = String(
            name.unicodeScalars
                .filter { CharacterSet.alphanumerics.contains($0) }
                .prefix(2)
        )
        .uppercased()

        RoundedRectangle(cornerRadius: rounded, style: .continuous)
            .fill(colors.background)
            .frame(width: size, height: size)
            .overlay(
                Text(monogram)
                    .font(Theme.mono(size * 0.36, weight: .semibold))
                    .kerning(-0.3)
                    .foregroundStyle(colors.foreground)
            )
    }
}

// Tiny mark + "emitsignal" wordmark header used across widgets.
struct WgHeader<Right: View>: View {
    @ViewBuilder var right: Right

    var body: some View {
        HStack(spacing: 7) {
            PulseMark(size: 15)
            Text("emitsignal")
                .font(Theme.mono(12))
                .kerning(-0.3)
                .foregroundStyle(Theme.fgMuted)
            Spacer(minLength: 0)
            right
        }
    }
}

extension WgHeader where Right == EmptyView {
    init() {
        self.init(right: { EmptyView() })
    }
}

extension WgHeader where Right == Text {
    init(meta: String) {
        self.init(right: {
            Text(meta)
                .font(Theme.mono(10))
                .foregroundStyle(Theme.fgDim)
        })
    }
}

// Violet pill badge ("12 new" / channel unread counts).
struct UnreadBadge: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Theme.sans(12, weight: .bold))
            .foregroundStyle(Theme.fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 2)
            .background(Capsule().fill(Theme.violetDim))
    }
}

struct Hairline: View {
    var body: some View {
        Rectangle()
            .fill(Theme.bgLine)
            .frame(height: 0.5)
    }
}

// Signed-out / no-data placeholder shared by all system-family widgets.
struct SignedOutView: View {
    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 7) {
                PulseMark(size: 16)
                Text("emitsignal")
                    .font(Theme.mono(13))
                    .kerning(-0.3)
                    .foregroundStyle(Theme.fgMuted)
            }
            Text("open the app to connect")
                .font(Theme.sans(11))
                .foregroundStyle(Theme.fgDim)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

enum WidgetTime {
    static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    static func short(_ date: Date) -> String {
        formatter.string(from: date)
    }
}

// Shared chrome: brand gradient container, 1px hairline border, 16pt padding,
// dimmed when the snapshot is stale (app has not synced in >24h).
struct EmitSignalContainer: ViewModifier {
    let snapshot: WidgetSnapshot

    func body(content: Content) -> some View {
        content
            .padding(16)
            .opacity(snapshot.isStale ? 0.75 : 1)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(
                ContainerRelativeShape()
                    .strokeBorder(Theme.bgLine, lineWidth: 1)
            )
            .containerBackground(for: .widget) {
                Theme.containerGradient
            }
    }
}

extension View {
    func emitSignalContainer(_ snapshot: WidgetSnapshot) -> some View {
        modifier(EmitSignalContainer(snapshot: snapshot))
    }
}
