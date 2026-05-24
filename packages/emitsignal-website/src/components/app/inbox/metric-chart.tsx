const POINTS = [30, 32, 28, 35, 40, 38, 42, 50, 55, 65, 78, 88, 92, 94, 88, 75, 60, 45];
const WIDTH = 340;
const HEIGHT = 88;
const MAX = 100;

export function MetricChart() {
    const toX = (i: number) => (i / (POINTS.length - 1)) * WIDTH;
    const toY = (v: number) => HEIGHT - (v / MAX) * HEIGHT;
    const path = POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p)}`).join(' ');
    const area = `${path} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

    return (
        <div className="rounded-xl border border-line bg-elev p-3.5">
            <svg className="block" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%">
                <defs>
                    <linearGradient id="metric-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-danger)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="var(--color-danger)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line
                    opacity="0.6"
                    stroke="var(--color-warn)"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                    x1="0"
                    x2={WIDTH}
                    y1={toY(90)}
                    y2={toY(90)}
                />
                <text
                    fill="var(--color-warn)"
                    fontFamily="monospace"
                    fontSize="8"
                    textAnchor="end"
                    x={WIDTH - 4}
                    y={toY(90) - 4}
                >
                    threshold 90%
                </text>
                <path d={area} fill="url(#metric-gradient)" />
                <path d={path} fill="none" stroke="var(--color-danger)" strokeWidth="1.5" />
                <circle cx={toX(12)} cy={toY(92)} fill="var(--color-danger)" r="3" />
                <circle
                    cx={toX(12)}
                    cy={toY(92)}
                    fill="none"
                    opacity="0.5"
                    r="7"
                    stroke="var(--color-danger)"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
}
