import { useEffect, useRef } from "react";
import DiceBox from "@3d-dice/dice-box";

export default function DiceSimple() {
	const boxRef = useRef<any>(null);
	const BOX_ID = "dice-box";

	useEffect(() => {
		if (boxRef.current) return;

		const diceBox = new DiceBox(`#${BOX_ID}`, {
			assetPath: "/assets/dice-box/",
			scale: 8,
			startingHeight: 8,
			theme: "dice-of-rolling"
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
		<div className="flex flex-col h-screen gap-3">
			<div id={BOX_ID} className="flex-1 w-full border rounded-lg" />
			<button onClick={rollD6} className="btn btn-primary w-32 self-center mb-3">
				Rolar D6
			</button>
		</div>
	);
}
