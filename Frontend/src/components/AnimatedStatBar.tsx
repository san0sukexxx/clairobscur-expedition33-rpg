// AnimatedStatBar.tsx
import React from "react";

type Props = {
    /** Valor atual da barra (0–100). */
    value: number;
    /** Rótulo para acessibilidade. */
    label?: string;

    /** Classe do trilho (fundo). */
    trackClass?: string;
    /** Classe da barra principal (preenchimento imediato). */
    fillClass?: string;
    /** Classe da barra ghost (preenchimento atrasado). */
    ghostClass?: string;

    /** Duração (ms) da animação da barra principal. */
    fillDurationMs?: number;
    /** Duração (ms) da animação da barra ghost. */
    ghostDurationMs?: number;
    /** Atraso (ms) antes da ghost começar a seguir quando o valor cai. */
    ghostDelayMs?: number;
};

function clamp01To100(v: number) {
    if (Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
}

/**
 * Barra com animação:
 * - A barra principal (fill) acompanha rapidamente `value`.
 * - A barra "ghost" fica atrás e acompanha mais devagar quando o valor diminui,
 *   criando o efeito de "dano tomado".
 */
export default function AnimatedStatBar({
    value,
    label,
    trackClass = "bg-base-300/70",
    fillClass = "bg-error",
    ghostClass = "bg-error/30",
    fillDurationMs = 450,
    ghostDurationMs = 1200,
    ghostDelayMs = 250,
}: Props) {
    const v = clamp01To100(value);

    // Barra ghost que “segue” mais devagar
    const [ghost, setGhost] = React.useState<number>(v);

    // Suporte a prefers-reduced-motion
    const [reduced, setReduced] = React.useState(false);
    React.useEffect(() => {
        if (typeof window === "undefined" || !("matchMedia" in window)) return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handler = () => setReduced(mq.matches);
        handler();
        mq.addEventListener?.("change", handler);
        return () => mq.removeEventListener?.("change", handler);
    }, []);

    // Controla a barra ghost:
    // - Se value < ghost: espera um pequeno delay e anima devagar até `value`.
    // - Se value >= ghost: sobe junto (sem delay) para não "prender" cura/buff.
    React.useEffect(() => {
        let t: number | undefined;

        setGhost((prev) => {
            // Ao aumentar, sincroniza imediatamente para evitar rastro invertido.
            if (v >= prev) return v;

            // Ao diminuir, aguarda um delay e anima para o novo valor.
            if (!reduced && ghostDelayMs > 0) {
                t = window.setTimeout(() => setGhost(v), ghostDelayMs);
                return prev; // mantém até o timeout disparar
            }
            return v;
        });

        return () => {
            if (t) window.clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [v, ghostDelayMs, reduced]);

    const fillStyle: React.CSSProperties = reduced
        ? { width: `${v}%` }
        : {
            width: `${v}%`,
            transition: `width ${fillDurationMs}ms cubic-bezier(.22,.85,.36,1)`,
        };

    const ghostStyle: React.CSSProperties = reduced
        ? { width: `${ghost}%` }
        : {
            width: `${ghost}%`,
            transition: `width ${ghostDurationMs}ms ease-in-out`,
        };

    return (
        <div
            className={`relative h-3 w-full overflow-hidden rounded-full ${trackClass}`}
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(v)}
        >
            {/* Ghost (atrás) */}
            <div
                className={`absolute left-0 top-0 h-full rounded-full ${ghostClass}`}
                style={ghostStyle}
                aria-hidden
            />
            {/* Fill (à frente) */}
            <div
                className={`relative h-full rounded-full ${fillClass}`}
                style={fillStyle}
            />
        </div>
    );
}
