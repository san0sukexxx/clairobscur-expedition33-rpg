import { useEffect, useRef } from "react";
import DiceBox from "@3d-dice/dice-box";

export default function DiceSimple() {
    const boxRef = useRef<any>(null);
    const BOX_ID = "dice-box";

    useEffect(() => {
        if (boxRef.current) return;

        const diceBox = new DiceBox(`#${BOX_ID}`, {
            assetPath: "/assets/dice-box/",
            scale: 30,           // aumenta o tamanho relativo do dado (padrão ~4)
            startingHeight: 8,  // altura inicial (se aumentar muito, ele cai de mais alto)
            width: window.innerWidth,
            height: window.innerHeight,
        });

        diceBox.init();

        boxRef.current = diceBox;

        diceBox.onRollComplete = (result: any) => {
            console.log("Resultado:", result);
        };
    }, []);

    const rollD6 = () => {
        if (!boxRef.current) return;
        boxRef.current.roll("1d6");
    };

    return (
        <div className="flex flex-col gap-3">
            <div id={BOX_ID} className="w-full h-[400px] border rounded-lg" />
            <button onClick={rollD6} className="btn btn-primary w-32">
                Rolar D6
            </button>
        </div>
    );
}
