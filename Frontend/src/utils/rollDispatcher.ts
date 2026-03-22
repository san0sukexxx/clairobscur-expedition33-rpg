export interface RollEvent {
    id: number;
    label: string;
    diceRolled: number;
    modifier: number;
    total: number;
    diceCommand: string;
    diceValues?: number[];
    /** When true, this roll can be merged with the previous roll of the same label */
    accumulate?: boolean;
    /** Internal: individual dice commands before grouping (used for accumulation) */
    _diceCommands?: string[];
}

export function dispatchRoll(roll: Omit<RollEvent, "id">) {
    const event: RollEvent = { ...roll, id: Date.now() + Math.random() };
    window.dispatchEvent(new CustomEvent("roll-result", { detail: event }));
}
