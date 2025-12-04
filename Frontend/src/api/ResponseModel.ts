import type { WeaponDTO } from "../types/WeaponDTO";

export type StatusType =
    "Hastened" | "Empowered" | "Protected" | "Regeneration" |
    "Unprotected" | "Slowed" | "Weakened" | "Cursed" |
    "Stunned" | "Confused" | "Frozen" | "Entangled" |
    "Shielded" | "Exhausted" | "Frenzy" | "Rage" |
    "Inverted" | "Marked" | "Plagued" | "Burning" |
    "Silenced" | "Dizzy" | "Fragile" | "Broken" | "free-shot" | "jump" | "gradient";

export const ignoreEffects = ["free-shot", "jump", "gradient"];
export type Element = "Physical" | "Void" | "Light" | "Lightning" | "Fire" | "Ice" | "Dark" | "Earth";
export type ElementModifierType = "imune" | "weak" | "resistent";
export type DefenseOption = "block" | "dodge" | "jump" | "gradient-block" | "take" | "counter" | "cancel-counter";
export type AttackType = "basic" | "jump" | "jump-all" | "gradient" | "free-shot";
export type SkillType = "give-status";
export type PictoColor = "green" | "red" | "blue" | "yellow";
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
    effectName: StatusType;
    ammount: number; // Ex.: Burning 3
    remainingTurns?: number | null;
    isResolved: boolean;
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
    weakTo?: Element;
    resistentTo?: Element;
    imuneTo?: Element;
    freeShotWeakPoints?: number;
    attackList?: NPCAttack[];
    skillList?: NPCSkill[];
    isFlying?: boolean;
}

export interface NPCStatusItem {
    type: StatusType;
    ammount: number;
    remainingTurns?: number;
}

export interface NPCAttack {
    type: AttackType;
    statusList: NPCStatusItem[];
}

export interface NPCSkill {
    type: SkillType;
    statusList: NPCStatusItem[];
}

export interface PictoResponse {
    id: number,
    playerId: number,
    pictoId: string,
    level?: number;
    slot?: number | null;
    battleCount?: number;
}

export interface PictoInfo {
    name: string;
    status: PictoStatusResponse;
    description: string;
    color: PictoColor;
    luminaCost: number;
}

export interface PictoStatusResponse {
    speed?: number;
    criticalRate?: number;
    health?: number;
    defense?: number;
}

export interface LuminaResponse {
    id: number
    playerId: number
    pictoId: string
    isEquiped: boolean
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
    allowCounter?: boolean;
    isCounterResolved?: boolean;
    effects?: AttackStatusEffectResponse[];
}

export interface BattleLogResponse {
    id: number;
    eventType: string;
    eventJson?: string;
    battleId: number;
}

export interface AttackStatusEffectResponse {
    id: number
    effectType: StatusType
    ammount: number
    remainingTurns?: number | null
}

export interface ElementModifier {
    type: ElementModifierType
    multiplier: number
}

export interface WeaponInfo {
    weapon: WeaponResponse | null;
    details: WeaponDTO | null;
}