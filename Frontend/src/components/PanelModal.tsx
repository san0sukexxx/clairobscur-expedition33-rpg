import { useEffect, useRef } from "react";
import { t } from "../i18n";

type ModalSize = "sm" | "md" | "lg" | "xl";

export interface PanelModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    size?: ModalSize;
    /** Conteúdo do corpo do modal */
    children?: React.ReactNode;
    /** Rodapé opcional (botões, etc.) */
    footer?: React.ReactNode;
    /** Se true, permite fechar clicando no backdrop (default: true) */
    dismissible?: boolean;
    /** Se true, mostra o X no cabeçalho (default: true) */
    showClose?: boolean;
}

export default function PanelModal({
    open,
    onClose,
    title,
    size = "md",
    children,
    footer,
    dismissible = true,
    showClose = true,
}: PanelModalProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);

    // Fecha com ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Foco inicial no painel quando abrir (acessibilidade simples)
    useEffect(() => {
        if (open) dialogRef.current?.focus();
    }, [open]);

    const sizeClasses: Record<ModalSize, string> = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <div
            aria-hidden={!open}
            aria-modal="true"
            role="dialog"
            className={[
                "fixed inset-0 z-[1000] flex items-center justify-center",
                "transition-opacity duration-200",
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
        >
            {/* Backdrop */}
            <div
                className={[
                    "absolute inset-0 bg-black/60",
                    "transition-opacity duration-200",
                    open ? "opacity-100" : "opacity-0",
                ].join(" ")}
                onClick={() => dismissible && onClose()}
            />

            {/* Painel */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={[
                    "relative mx-4 w-full",
                    sizeClasses[size],
                    "rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100",
                    "shadow-2xl",
                    "transition-all duration-200",
                    open ? "scale-100 translate-y-0" : "scale-95 translate-y-2",
                    "outline-none",
                ].join(" ")}
            >
                {/* Cabeçalho */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                        <h3 className="text-lg font-semibold truncate">{title ?? ""}</h3>
                        {showClose && (
                            <button
                                aria-label={t("common.close")}
                                onClick={onClose}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 hover:bg-neutral-800"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* Corpo */}
                <div className="px-5 py-4">
                    {children}
                </div>

                {/* Rodapé opcional */}
                {footer && (
                    <div className="px-5 py-4 border-t border-neutral-800">
                        <div className="flex items-center justify-end gap-2">
                            {footer}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}