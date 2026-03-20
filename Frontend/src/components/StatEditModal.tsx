import { useState, useEffect } from "react";

interface StatEditModalProps {
    open: boolean;
    title: string;
    currentValue: number;
    maxValue?: number;
    minValue?: number;
    wrapAround?: boolean;
    onConfirm: (value: number) => void;
    onCancel: () => void;
}

export default function StatEditModal({
    open,
    title,
    currentValue,
    maxValue,
    minValue = 0,
    wrapAround = false,
    onConfirm,
    onCancel
}: StatEditModalProps) {
    const [raw, setRaw] = useState("");

    useEffect(() => {
        setRaw("");
    }, [currentValue, open]);

    function calcFinal(sign: "+" | "-") {
        const delta = raw === "" ? 0 : Math.abs(Number(raw)) || 0;
        const applied = sign === "+" ? delta : -delta;
        let result = currentValue + applied;
        if (wrapAround && maxValue !== undefined) {
            const range = maxValue - minValue + 1;
            result = minValue + (((result - minValue) % range) + range) % range;
        } else {
            if (maxValue !== undefined) result = Math.min(result, maxValue);
            result = Math.max(result, minValue);
        }
        return result;
    }

    function handleSign(sign: "+" | "-") {
        const delta = raw === "" ? 0 : Math.abs(Number(raw)) || 0;
        if (delta > 0) {
            onConfirm(calcFinal(sign));
        }
    }


    if (!open) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-xs space-y-4">
                <h3 className="font-bold text-lg">{title}</h3>
                <div className="text-center text-sm opacity-70">
                    Atual: <span className="font-bold text-base">{currentValue}</span>
                    {maxValue !== undefined && <span> / {maxValue}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="btn btn-sm btn-circle btn-success"
                        onClick={() => handleSign("+")}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        className="input input-bordered w-full text-center"
                        value={raw}
                        placeholder="0"
                        min={0}
                        onChange={e => setRaw(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Escape") onCancel();
                        }}
                    />
                    <button
                        className="btn btn-sm btn-circle btn-error"
                        onClick={() => handleSign("-")}
                    >
                        −
                    </button>
                </div>
                <div className="modal-action">
                    <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                        Cancelar
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel} />
        </dialog>
    );
}
