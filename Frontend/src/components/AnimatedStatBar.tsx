// AnimatedStatBar.tsx
import React from "react";

type Props = {
    value: number;
    label?: string;
    trackClass?: string;
    fillClass?: string;
    ghostClass?: string;
    fillDurationMs?: number;
    ghostDurationMs?: number;
    ghostDelayMs?: number;
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

    return (
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
    );
}
