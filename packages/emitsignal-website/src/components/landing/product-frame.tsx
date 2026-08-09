const SHOT_HEIGHT = 1135;
const SHOT_WIDTH = 2000;

export function ProductFrame() {
    return (
        <div className="relative px-6 md:px-12">
            <div
                className="mx-auto max-w-[1200px]"
                style={{
                    maskImage: 'linear-gradient(180deg, black 0%, black 78%, transparent 100%)',
                    WebkitMaskImage:
                        'linear-gradient(180deg, black 0%, black 78%, transparent 100%)',
                }}
            >
                <div className="overflow-hidden rounded-2xl border border-line bg-deep shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(167,139,250,0.08)]">
                    <img
                        alt="The EmitSignal web inbox: a channel sidebar, a message list grouped by priority from P5 critical down to P3, and a selected alert titled 'Production API latency spike' showing environment details, a p99 response-time chart, tags, and an Open trace button."
                        className="block w-full"
                        decoding="async"
                        fetchPriority="high"
                        height={SHOT_HEIGHT}
                        src="/static/app-inbox.webp"
                        width={SHOT_WIDTH}
                    />
                </div>
            </div>
        </div>
    );
}
