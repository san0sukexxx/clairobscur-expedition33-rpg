import { useState, useEffect, useCallback } from "react";

interface StatEditModalProps {
    open: boolean;
    title: string;
    currentValue: number;
    maxValue?: number;
    minValue?: number;
    onConfirm: (value: number) => void;
    onCancel: () => void;
}

export default function StatEditModal({
    open,
    title,
    currentValue,
    maxValue,
    minValue = 0,
    onConfirm,
    onCancel
}: StatEditModalProps) {
    const [raw, setRaw] = useState("");

    useEffect(() => {
        setRaw("");
    }, [currentValue, open]);

    const numericValue = raw === "" || raw === "-" ? currentValue : Number(raw);

    const inputRef = useCallback((node: HTMLInputElement | null) => {
        if (node) setTimeout(() => node.focus(), 50);
    }, [open]);

    if (!open) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-xs space-y-4">
                <h3 className="font-bold text-lg">{title}</h3>
                <input
                    type="number"
                    className="input input-bordered w-full"
                    value={raw}
                    placeholder={String(currentValue)}
                    min={minValue}
                    max={maxValue}
                    onChange={e => setRaw(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") onConfirm(numericValue);
                        if (e.key === "Escape") onCancel();
                    }}
                    ref={inputRef}
                />
                {maxValue !== undefined && (
                    <div className="text-xs opacity-60 text-right">
                        {minValue} – {maxValue}
                    </div>
                )}
                <div className="modal-action">
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onConfirm(numericValue)}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel} />
        </dialog>
    );
}
