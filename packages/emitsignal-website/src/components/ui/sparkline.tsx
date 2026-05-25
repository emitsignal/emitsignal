interface SparklineProps {
    color?: string;
    data: number[];
    height?: number;
    width?: number;
}

export function Sparkline({
    color = 'var(--color-accent)',
    data,
    height = 28,
    width = 120,
}: SparklineProps) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1);
    const points = data
        .map((value, index) => `${index * step},${height - (value / max) * (height - 4) - 2}`)
        .join(' ');
    const lastY = height - (data[data.length - 1] / max) * (height - 4) - 2;
    return (
        <svg className="block" height={height} width={width}>
            <polyline
                fill="none"
                points={points}
                stroke={color}
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
            <circle cx={width} cy={lastY} fill={color} r="2.5" />
        </svg>
    );
}
