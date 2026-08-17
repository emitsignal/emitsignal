import SwiftUI
import WidgetKit

@main
struct EmitSignalWidgets: WidgetBundle {
    var body: some Widget {
        UnreadWidget()
        LatestMessageWidget()
        ActivityWidget()
        StatsWidget()
        ChannelsWidget()
    }
}
