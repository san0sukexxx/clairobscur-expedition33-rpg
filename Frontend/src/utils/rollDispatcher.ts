export interface RollEvent {
    id: number;
    label: string;
    diceRolled: number;
    modifier: number;
    total: number;
    diceCommand: string;
}

export function dispatchRoll(roll: Omit<RollEvent, "id">) {
    const event: RollEvent = { ...roll, id: Date.now() + Math.random() };
    window.dispatchEvent(new CustomEvent("roll-result", { detail: event }));
}
