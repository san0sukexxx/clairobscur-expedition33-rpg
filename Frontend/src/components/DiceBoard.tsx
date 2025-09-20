import { useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import DiceBox from "@3d-dice/dice-box";

export interface DiceBoardRef {
    roll: (command: string, onRollComplete: (result: any) => void) => void;
    hideBoard: () => void;
}

interface DiceBoardProps {
    ref: React.Ref<DiceBoardRef>;
}

export default function DiceBoard({ ref }: DiceBoardProps) {
    const boxRef = useRef<any>(null);
    const BOX_ID = "dice-board";
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (boxRef.current) return;

        const diceBox = new DiceBox(`#${BOX_ID}`, {
            assetPath: "/assets/dice-box/",
            scale: 7,
            startingHeight: 8,
            theme: "dice-of-rolling"
        });

        diceBox.init();

        boxRef.current = diceBox;
    }, []);

    useImperativeHandle(ref, () => ({
        roll: (command: string, onRollComplete: (result: any) => void) => {
            boxRef.current.onRollComplete = onRollComplete;

            if (containerRef.current) {
                containerRef.current.style.opacity = "1";
            }

            if (boxRef.current) {
                boxRef.current.roll(command);
            }
        },
        hideBoard: () => {
            if (containerRef.current) {
                containerRef.current.style.opacity = "0";
            }
        }
    }));

    return (
        <div className="flex flex-col h-screen gap-3 fullscreen-div" ref={containerRef}>
            <div id={BOX_ID} className="flex-1 w-full rounded-lg" />
        </div>
    );
}