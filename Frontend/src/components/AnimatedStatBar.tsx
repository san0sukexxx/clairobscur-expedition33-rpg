// AnimatedStatBar.tsx
import React from "react";

type BreakMarker = {
    /** Position as percentage (0-100) */
    position: number;
    /** Whether this break has already been triggered */
    triggered: boolean;
};

type Props = {
    value: number;
    label?: string;
    trackClass?: string;
    fillClass?: string;
    ghostClass?: string;
    fillDurationMs?: number;
    ghostDurationMs?: number;
    ghostDelayMs?: number;
    breakMarkers?: BreakMarker[];
};

function clamp01To100(v: number) {
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
}

export default function AnimatedStatBar({
    value,
    label,
    trackClass = "bg-gray-700",     // fundo escuro, mas não preto
    fillClass = "bg-red-500",        // preenchimento
    ghostClass = "bg-red-400/60",    // ghost mais suave
    fillDurationMs = 450,
    ghostDurationMs = 1200,
    ghostDelayMs = 250,
    breakMarkers,
}: Props) {
    const v = clamp01To100(value);
    const [ghost, setGhost] = React.useState<number>(v);
    const [reduced, setReduced] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined" || !("matchMedia" in window)) return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = () => setReduced(mq.matches);
        handler();
        mq.addEventListener?.("change", handler);
        return () => mq.removeEventListener?.("change", handler);
    }, []);

    React.useEffect(() => {
        let t: number | undefined;
        setGhost((prev) => {
            if (v >= prev) return v;
            if (!reduced && ghostDelayMs > 0) {
                t = window.setTimeout(() => setGhost(v), ghostDelayMs);
                return prev;
            }
            return v;
        });
        return () => {
            if (t) window.clearTimeout(t);
        };
    }, [v, ghostDelayMs, reduced]);

    const fillStyle: React.CSSProperties = reduced
        ? { width: `${v}%` }
        : { width: `${v}%`, transition: `width ${fillDurationMs}ms cubic-bezier(.22,.85,.36,1)` };

    const ghostStyle: React.CSSProperties = reduced
        ? { width: `${ghost}%` }
        : { width: `${ghost}%`, transition: `width ${ghostDurationMs}ms ease-in-out` };

    const hasBreakMarkers = breakMarkers?.some(m => !m.triggered);

    return (
        <div className="relative w-full" style={hasBreakMarkers ? { paddingTop: "4px", paddingBottom: "4px" } : undefined}>
            <div
                className={`relative h-2 w-full overflow-hidden rounded-full ${trackClass}`}
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(v)}
            >
                <div
                    className={`absolute left-0 top-0 h-full rounded-full ${ghostClass}`}
                    style={ghostStyle}
                    aria-hidden
                />
                <div
                    className={`relative h-full rounded-full ${fillClass}`}
                    style={fillStyle}
                />
            </div>
            {breakMarkers?.map((marker, i) =>
                !marker.triggered && (
                    <div
                        key={i}
                        className="absolute pointer-events-none"
                        style={{ left: `${marker.position}%`, top: 0, bottom: 0, transform: "translateX(-50%)", width: "2px", zIndex: 10 }}
                    >
                        <div className="w-0.5 h-full mx-auto bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.9)]" />
                    </div>
                )
            )}
        </div>
    );
}
