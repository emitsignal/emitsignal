import { cn } from '#/lib/cn';

interface SkeletonProps {
    className?: string;
    height?: number;
    radius?: number;
    width?: number | string;
}

interface SkeletonTableRowsProps {
    columns?: number[];
    rows?: number;
}

export function Skeleton({ className, height = 12, radius = 6, width = '100%' }: SkeletonProps) {
    return (
        <div
            className={cn('shrink-0 animate-pulse bg-elev-2 motion-reduce:animate-none', className)}
            data-testid="skeleton"
            style={{ borderRadius: radius, height, width }}
        />
    );
}

export function SkeletonMessageDetail() {
    return (
        <div className="min-w-0 flex-1 p-7">
            <Skeleton height={11} radius={4} width={128} />
            <Skeleton className="mt-4" height={22} width="78%" />
            <Skeleton className="mt-4" height={13} width="96%" />
            <Skeleton className="mt-2" height={13} width="88%" />
            <Skeleton className="mt-2" height={13} width="62%" />

            <div className="mt-5 flex gap-1.5">
                <Skeleton height={20} radius={10} width={62} />
                <Skeleton height={20} radius={10} width={48} />
                <Skeleton height={20} radius={10} width={54} />
            </div>

            <div className="mt-6 flex gap-2">
                <Skeleton height={36} radius={6} width={124} />
                <Skeleton height={36} radius={6} width={96} />
            </div>
        </div>
    );
}

export function SkeletonMessageList({ count = 6 }: { count?: number }) {
    return (
        <div>
            {Array.from({ length: count }, (_, index) => (
                <SkeletonMessageRow key={index} />
            ))}
        </div>
    );
}

export function SkeletonMessageRow() {
    return (
        <div className="flex gap-2.5 border-b border-line border-l-transparent px-4.5 py-3 border-l-[3px]">
            <Skeleton height={9} radius={9} width={9} />

            <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-baseline gap-2">
                    <Skeleton height={9} radius={3} width={72} />
                    <Skeleton className="ml-auto" height={9} radius={3} width={38} />
                </div>

                <Skeleton className="mb-1.5" height={13} radius={4} width="70%" />
                <Skeleton height={12} radius={4} width="52%" />
            </div>
        </div>
    );
}

export function SkeletonTableRows({ columns = [30, 45, 15], rows = 4 }: SkeletonTableRowsProps) {
    return (
        <div>
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div
                    className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0"
                    key={rowIndex}
                >
                    {columns.map((width, columnIndex) => (
                        <Skeleton height={11} key={columnIndex} radius={4} width={`${width}%`} />
                    ))}
                </div>
            ))}
        </div>
    );
}
