import type { WeaponDTO } from "../types/WeaponDTO";

export type StatusType =
    "Hastened" | "Empowered" | "Protected" | "Regeneration" |
    "Unprotected" | "Slowed" | "Weakened" | "Cursed" |
    "Stunned" | "Confused" | "Frozen" | "Entangled" |
    "Shielded" | "Exhausted" | "Frenzy" | "Rage" |
    "Inverted" | "Marked" | "Plagued" | "Burning" |
    "Silenced" | "Dizzy" | "Fragile" | "Broken" | "free-shot" | "jump" | "gradient" | "Fleeing" |
    "FireVulnerability" | "Guardian" | "Foretell" | "Twilight" | "Powerless" |
    "Rush" | "Burn" | "Shield" | "Powerful" | "Mark" | "Shell" | "Slow" | "Freeze" | "GreaterRush" | "GreaterSlow" | "invisible-barrier" |
    "EnfeeblingMark" | "DamageReduction" | "SuccessiveParry" | "Aureole" | "Vulnerable" | "DoubleDamage" | "Defenceless" | "Regen" | "Curse" | "IntenseFlames";

export const ignoreEffects = ["free-shot", "jump", "gradient"];
export type Element = "Physical" | "Void" | "Light" | "Lightning" | "Fire" | "Ice" | "Dark" | "Earth";
export type ElementModifierType = "imune" | "weak" | "resistent" | "absorb";
export type DefenseOption = "block" | "dodge" | "jump" | "gradient-block" | "take" | "counter" | "cancel-counter";
export type AttackType = "basic" | "jump" | "jump-all" | "gradient" | "free-shot" | "skill";
export type SkillType = "give-status";
export type PictoColor = "green" | "red" | "blue" | "yellow";
export type BattleCharacterType = "player" | "npc";
export type BattleStatus = "starting" | "started" | "finished";
export type Stance = "Defensive" | "Offensive" | "Virtuous";

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

export type StainType = "Lightning" | "Earth" | "Fire" | "Ice" | "Light";

export interface BattleCharacterInfo {
    battleID: number;
    id: string; // known NPC ID or Player ID. Ex.: ice-golem
    name: string;
    healthPoints: number;
    maxHealthPoints: number;
    magicPoints?: number;
    maxMagicPoints?: number;
    chargePoints?: number;
    maxChargePoints?: number;
    sunCharges?: number;
    moonCharges?: number;
    gradientPoints?: number;
    actionPoints?: number;
    maxActionPoints?: number;
    power?: number; // Character's power/might stat
    stance?: Stance | null;
    stainSlot1?: StainType | null;
    stainSlot2?: StainType | null;
    stainSlot3?: StainType | null;
    stainSlot4?: StainType | null;
    perfectionRank?: string | null;
    rankProgress?: number | null;
    bestialWheelPosition?: number | null;
    status?: StatusResponse[];
    type: BattleCharacterType;
    isEnemy: boolean;
    canRollInitiative?: boolean;
    parriesThisTurn?: number;
    hitsTakenThisTurn?: number;
}

export type RewardType = "weapon" | "picto";

export interface BattleReward {
    type: RewardType;
    itemId: string;  // Weapon name or Picto name
    level: number;   // Level of the reward
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
    absorbElement?: Element;  // Heals instead of taking damage from this element
    freeShotWeakPoints?: number;
    attackList?: NPCAttack[];
    skillList?: NPCSkill[];
    isFlying?: boolean;
    initiativeBonus?: number;  // Flat bonus added to initiative roll
    maxLifeBonus?: number;  // Flat bonus added to max HP calculation (resistance * 5 + bonus)
    reward?: BattleReward;  // Optional reward for defeating this NPC
}

export interface NPCStatusItem {
    type: StatusType;
    ammount: number;
    remainingTurns?: number;
}

export interface NPCAttack {
    type: AttackType;
    statusList?: NPCStatusItem[];  // Optional list of status effects to apply
    quantity?: number;  // Number of times this attack will be used in sequence
    name?: string;  // Custom name to display on the button (overrides default label)
    additionalDamage?: number;  // Flat damage bonus added to each attack roll
    additionalDices?: number;  // Additional dice rolled for this attack (e.g., 2 = roll 3d6 instead of 1d6)
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

export type PictoTrigger =
    | "on-heal-ally"
    | "on-revived"
    | "on-free-aim"
    | "on-battle-start"
    | "on-healing-tint"
    | "on-turn-start"
    | "on-turn-end"
    | "on-attack"
    | "on-parry"
    | "on-dodge"
    | "on-crit"
    | "on-skill-use"
    | "on-damage-taken";

export interface PictoInfo {
    id: string;  // kebab-case ID (e.g., "energy-master")
    imageId: string;  // English name for image filename (e.g., "Energy Master")
    name: string;  // Localized name (e.g., "Mestre de Energia" or "Energy Master")
    status: PictoStatusResponse;
    description: string;
    color: PictoColor;
    luminaCost: number;
    effectTriggers?: PictoTrigger[];  // When this picto's effect activates
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

export interface PlayerItemResponse {
    id: number
    playerId: number
    itemId: string
    quantity: number
    maxQuantity: number
}

export interface PlayerSkillResponse {
    id: string;
    skillId: string;
    slot?: number | null;
}

export interface SkillResponse {
    id: string;
    character: string;
    name: string;
    cost: number;
    unlockCost?: number;
    description: string;
    type?: string;
    isGradient?: boolean;
    masterUnlock?: boolean;  // Requires master permission to unlock
    image: string;
    preRequisite?: string[];
    isBlocked?: boolean;
}

export interface WeaponResponse {
    id: string;
    level: number;
}

export interface FightInfoResponse {
    battleId: number;
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
    defenseType?: string;
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

// ==================== Picto Effect System ====================

export interface PictoEffectTracker {
    id: number;
    battleId: number;
    battleCharacterId: number;
    pictoName: string;
    effectType: string;
    timesTriggered: number;
    lastTurnTriggered?: number;
}

export interface DamageModifier {
    id: number;
    battleCharacterId: number;
    modifierType: string;
    multiplier: number;
    flatBonus: number;
    conditionType?: string;
    isActive: boolean;
}

export interface StatusImmunity {
    id: number;
    battleCharacterId: number;
    statusType: StatusType;
    immunityType: 'immune' | 'resist';
    resistChance?: number;
}

export interface ElementResistance {
    id: number;
    battleCharacterId: number;
    element: Element;
    resistanceType: 'immune' | 'resist' | 'weak';
    damageMultiplier: number;
}