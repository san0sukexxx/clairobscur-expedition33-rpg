export const COMBAT_MENU_ACTIONS = {
    Attack: "Attack",
    FreeShot: "FreeShot",
    Skills: "Skills",
    Inventory: "Inventory",
    Initiative: "Initiative",
    JoinBattle: "JoinBattle",
    EndTurn: "EndTurn",
    Flee: "Flee",
    Cancel: "Cancel",
    Team: "Team",
    Enemies: "Enemies"
} as const;

export type CombatMenuAction = (typeof COMBAT_MENU_ACTIONS)[keyof typeof COMBAT_MENU_ACTIONS];
