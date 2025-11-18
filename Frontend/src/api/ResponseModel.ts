export type StatusType =
    "Hastened" | "Empowered" | "Protected" | "Regeneration" |
    "Unprotected" | "Slowed" | "Weakened" | "Cursed" |
    "Stunned" | "Confused" | "Frozen" | "Entangled" |
    "Shielded" | "Exhausted" | "Frenzy" | "Rage" |
    "Inverted" | "Marked" | "Plagued" | "Burning" |
    "Silenced" | "Dizzy";


export type DefenseOption = "block" | "dodge" | "jump" | "gradient-block" | "take";
export type PictoColor = "green" | "red" | "blue";
export type BattleCharacterType = "player" | "npc";
export type BattleStatus = "starting" | "started" | "finished";

export interface InitiativeResponse {
    playFirst: boolean;
    battleID: number;
    value: number;
    hability: number;
}

export interface BattleTurnResponse {
    id: number
    battleId: number
    battleCharacterId: number
    playOrder: number
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
    canRollInitiative?: boolean;
}

export interface NPCInfo {
    id: string;
    name: string;
    power: number;
    hability: number;
    resistance: number;
    playFirst?: boolean;
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
}

export interface PictoStatusResponse {
    speed?: number;
    criticalRate?: number;
    health?: number;
    defense?: number;
}

export interface SkillResponse {
    id: string;
    name: string;
    cost: number;
    description: string;
    type: string;
    isGradient: boolean;
    image: string;
    isBlocked: boolean;
    isUnlocked: boolean;
    slot?: number;
    pre_requisite?: SkillPreRequisite[];
}

export interface SkillPreRequisite {
    id: string;
    name: string;
    image: string;
}

export interface WeaponResponse {
    id: string;
    level: number;
}

export interface FightInfoResponse {
    playerBattleID: number;
    initiatives?: InitiativeResponse[];
    characters?: BattleCharacterInfo[];
    turns?: BattleTurnResponse[];
    battleStatus: BattleStatus;
    canRollInitiative: boolean;
    pendingAttacks?: AttackResponse[];
}

export interface AttackResponse {
    id: number;
    battleId: number;
    totalPower: number;
    targetBattleId: number;
    sourceBattleId: number;
    totalDefended?: number;
    isResolved: boolean;
}

export interface BattleLogResponse {
    id: number;
    eventType: string;
    eventJson?: string;
    battleId: number;
}

export interface AttackStatusEffectResponse {
    id: number
    effectType: string
    ammount: number
}
