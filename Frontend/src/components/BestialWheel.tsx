import React, { useMemo } from "react";

// Bestial Wheel pattern: 1 Gold, 2 Blue, 2 Purple, 2 Red, 2 Green (repeating infinitely)
const WHEEL_PATTERN = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
const VISIBLE_SLOTS = 9;

interface BestialWheelProps {
    position: number; // Current position in the infinite wheel
}

const COLOR_CLASSES: Record<string, string> = {
    gold: "bg-warning border-warning/50",
    blue: "bg-info border-info/50",
    purple: "bg-purple-600",
    red: "bg-error border-error/50",
    green: "bg-success border-success/50"
};

export const BestialWheel: React.FC<BestialWheelProps> = ({ position }) => {
    // Generate the visible slots based on current position
    const visibleSlots = useMemo(() => {
        const slots: string[] = [];
        for (let i = 0; i < VISIBLE_SLOTS; i++) {
            const index = (position + i) % WHEEL_PATTERN.length;
            slots.push(WHEEL_PATTERN[index]);
        }
        return slots;
    }, [position]);

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="text-xs uppercase opacity-70 font-semibold">Roda Bestial</div>
            <div className="flex gap-1 w-full">
                {visibleSlots.map((color, index) => (
                    <div
                        key={`${position}-${index}`}
                        className={`
                            h-3 flex-1 rounded-sm
                            ${color === "purple" ? "" : "border-2"}
                            ${COLOR_CLASSES[color]}
                            ${index === 0 ? "bestial-active" : ""}
                        `}
                        title={`${color.charAt(0).toUpperCase() + color.slice(1)} ${index === 0 ? "(Atual)" : ""}`}
                    />
                ))}
            </div>
        </div>
    );
};
