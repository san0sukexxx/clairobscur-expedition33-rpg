import { useEffect } from "react";
import { createPortal } from "react-dom";
import { handleNpcImgError } from "../utils/NpcUtils";

interface NpcImageModalProps {
    npcId: string;
    npcName: string;
    open: boolean;
    onClose: () => void;
}

export default function NpcImageModal({ npcId, npcName, open, onClose }: NpcImageModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 cursor-pointer"
            onClick={onClose}
        >
            <img
                src={`/enemies/${npcId}.png`}
                alt={npcName}
                className="max-w-[90vw] max-h-[90vh] object-contain drop-shadow-2xl"
                onError={(e) => handleNpcImgError(e, npcId)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    );
}
