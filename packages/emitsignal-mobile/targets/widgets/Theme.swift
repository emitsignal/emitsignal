import SwiftUI

// Palette values mirror constants/theme.ts darkPalette (widgets render dark-fixed,
// matching the design which only defines the dark gradient card).
enum Theme {
    static let bg = Color(hex: 0x0F0A1A)
    static let bgElev = Color(hex: 0x1A1625)
    static let bgLine = Color(hex: 0x2A2340)
    static let fg = Color(hex: 0xF5F0FF)
    static let fgMuted = Color(hex: 0xB8A9D9)
    static let fgDim = Color(hex: 0x7A6D99)
    static let fgFaint = Color(hex: 0x4A4166)
    static let violet = Color(hex: 0xA78BFA)
    static let violetDim = Color(hex: 0x7C3AED)
    static let violetDeep = Color(hex: 0x5B21B6)
    static let green = Color(hex: 0x4ADE80)
    static let amber = Color(hex: 0xFBBF24)
    static let red = Color(hex: 0xF87171)
    static let pink = Color(hex: 0xF0ABFC)

    // CSS: linear-gradient(165deg, #1b1429 0%, #110b1d 100%)
    static let containerGradient = LinearGradient(
        colors: [Color(hex: 0x1B1429), Color(hex: 0x110B1D)],
        startPoint: UnitPoint(x: 0.37, y: 0),
        endPoint: UnitPoint(x: 0.63, y: 1)
    )

    static func priority(_ level: Int) -> Color {
        switch level {
        case 1:
            return Color(hex: 0x818CF8)
        case 2:
            return Color(hex: 0xA78BFA)
        case 3:
            return Color(hex: 0xC4B5FD)
        case 4:
            return Color(hex: 0xFBBF24)
        case 5:
            return Color(hex: 0xF87171)
        default:
            return violet
        }
    }

    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }

    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }

    // Exact port of components/base-theme.tsx hashHue + hslToHex so widget
    // topic avatars match the in-app avatars for the same topic name.
    static func topicAvatarColors(for name: String) -> (background: Color, foreground: Color) {
        var hash = 0
        for unit in name.utf16 {
            hash = (hash * 31 + Int(unit)) & 0xFFFFF
        }
        let hue = Double(hash % 360)
        return (hsl(hue, 30, 28), hsl(hue, 50, 80))
    }

    private static func hsl(_ hue: Double, _ saturation: Double, _ lightness: Double) -> Color {
        let s = saturation / 100
        let l = lightness / 100
        let c = (1 - abs(2 * l - 1)) * s
        let x = c * (1 - abs((hue / 60).truncatingRemainder(dividingBy: 2) - 1))
        let m = l - c / 2
        let (r, g, b): (Double, Double, Double)
        switch hue {
        case ..<60:
            (r, g, b) = (c, x, 0)
        case ..<120:
            (r, g, b) = (x, c, 0)
        case ..<180:
            (r, g, b) = (0, c, x)
        case ..<240:
            (r, g, b) = (0, x, c)
        case ..<300:
            (r, g, b) = (x, 0, c)
        default:
            (r, g, b) = (c, 0, x)
        }
        return Color(red: r + m, green: g + m, blue: b + m)
    }
}
