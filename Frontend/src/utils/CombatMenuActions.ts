export const COMBAT_MENU_ACTIONS = {
  Team: "Team",
  Enemies: "Enemies",
  Inventory: "Inventory",
  Skills: "Skills",
  FreeShot: "FreeShot",
  Attack: "Attack",
  Initiative: "Initiative",
  JoinBattle: "JoinBattle",
  Cancel: "Cancel",
  EndTurn: "EndTurn"
} as const;

export type CombatMenuAction = typeof COMBAT_MENU_ACTIONS[keyof typeof COMBAT_MENU_ACTIONS];