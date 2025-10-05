export type StatusType =
    "Hastened" | "Empowered" | "Protected" | "Regeneration" |
    "Unprotected" | "Slowed" | "Weakened" | "Cursed" |
    "Stunned" | "Confused" | "Frozen" | "Entangled" |
    "Shielded" | "Exhausted" | "Frenzy" | "Rage" |
    "Inverted" | "Marked" | "Plagued" | "Burning" |
    "Silenced" | "Dizzy";

export type PictoColor = "green" | "red" | "blue";
export type BattleCharacterType = "player" | "npc";

export interface InitiativeResponse {
    playFirst: boolean;
    battleID: number;
    value: number;
    hability: number;
}

export interface StatusResponse {
    type: StatusType;
    ammount: number; // Ex.: Burning 3
}

export interface BattleCharacterInfo {
    battleID: number;
    id: string; // known NPC ID or Player ID. Ex.: ice-golem
    name: string;
    healthPoints: number;
    maxHealthPoints: number;
    magicPoints?: number;
    maxMagicPoints?: number;
    status?: StatusResponse[];
    type: BattleCharacterType;
    isEnemy: boolean;
}

export interface PictoResponse {
    name: string;
    status: PictoStatusResponse;
    description: string;
    color: PictoColor;
    level?: number;
    slot?: number;
    luminaCost: number;
    battleCount?: number;
    isLuminaEquiped?: boolean;
}

export interface PictoStatusResponse {
    speed?: number;
    criticalRate?: number;
    health?: number;
    defense?: number;
}
