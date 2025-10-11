import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function Modal({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!open || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[1000]"  // fora da pilha do flip
            role="dialog"
            aria-modal="true"
        >
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#121212] border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="text-lg tracking-wide">Selecione uma Habilidade</div>
                        <button onClick={onClose} className="text-2xl leading-none px-2" aria-label="Fechar">
                            ×
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
