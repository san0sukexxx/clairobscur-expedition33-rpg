import { useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import DiceBox from "@3d-dice/dice-box";

export type DiceTheme = "dice-of-rolling" | "blue-green-metal";

export interface DiceBoardRef {
    roll: (command: string | string[], onRollComplete: (result: any) => void, theme?: DiceTheme) => void;
    add: (command: string) => void;
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

        const diceBox = new DiceBox({
            container: `#${BOX_ID}`,
            assetPath: "/assets/dice-box/",
            scale: 7,
            startingHeight: 8,
            theme: "dice-of-rolling"
        });

        diceBox.init();

        boxRef.current = diceBox;
    }, []);

    useImperativeHandle(ref, () => ({
        roll: async (command: string | string[], onRollComplete: (result: any) => void, theme?: DiceTheme) => {
            boxRef.current.onRollComplete = onRollComplete;

            if (containerRef.current) {
                containerRef.current.style.opacity = "1";
            }

            if (boxRef.current) {
                // Change theme if specified
                if (theme) {
                    await boxRef.current.updateConfig({ theme });
                } else {
                    await boxRef.current.updateConfig({ theme: "dice-of-rolling" });
                }
                boxRef.current.roll(command);
            }
        },
        add: (command: string) => {
            if (boxRef.current) {
                boxRef.current.add(command);
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