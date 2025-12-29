import type { BattleCharacterInfo, StatusType, PictoResponse, LuminaResponse, StatusResponse } from "../api/ResponseModel";
import { APIBattle } from "../api/APIBattle";
import { APIPictoTracker } from "../api/APIPictoTracker";
import { getPictoName } from "../i18n";

// ==================== PICTO/LUMINA EFFECT TYPES ====================

/**
 * NOTE: Luminas have the same effects as Pictos, but WITHOUT status bonuses.
 *
 * When implementing a new Picto effect:
 * 1. Register the effect handler with the Picto name
 * 2. The same handler will work for Luminas automatically
 * 3. Luminas use the same pictoId/name as their corresponding Picto
 *
 * Difference:
 * - Pictos: Effect + Status bonuses (health, speed, defense, criticalRate)
 * - Luminas: Effect ONLY (no status bonuses)
 */

/**
 * Trigger events when picto effects can activate
 */
export type PictoTrigger =
    | "on-heal-ally"           // When healing an ally (Accelerating Heal)
    | "on-revived"             // When character is revived (Aegis Revival)
    | "on-free-aim"            // After a Free Aim shot (Accelerating Shots)
    | "on-battle-start"        // At battle start (Accelerating Last Stand)
    | "on-healing-tint"        // When using a Healing Tint (Accelerating Tint)
    | "on-turn-start"          // At turn start
    | "on-attack"              // After attacking
    | "on-parry"               // After successful parry
    | "on-dodge"               // After successful dodge
    | "on-crit"                // After critical hit
    | "on-skill-use"           // After using a skill
    | "on-damage-taken"        // After taking damage
    | "on-weak-point"          // After hitting weak point
    | "on-counterattack"       // After counterattacking
    | "on-death"               // When dying
    | "on-kill"                // When killing an enemy
    | "on-break"               // When breaking an enemy
    | "on-apply-status"        // When applying a status effect
    | "on-gradient-use"        // When using gradient attack
    | "on-item-use"            // When using an item
    | "on-pass-turn";          // When passing turn

/**
 * Context passed to picto effect handlers
 */
export interface PictoEffectContext {
    trigger: PictoTrigger;
    source: BattleCharacterInfo;        // Character with the picto equipped
    target?: BattleCharacterInfo;       // Target of action (if applicable)
    allCharacters: BattleCharacterInfo[];
    pictoName: string;
    battleId: number;                   // Battle ID for API calls
    additionalData?: {
        healAmount?: number;
        damageAmount?: number;
        wasSuccessful?: boolean;
        isCritical?: boolean;
        isWeakPoint?: boolean;
        statusApplied?: StatusType;
        apGained?: number;
        gradientChargesConsumed?: number;
    };
}

/**
 * Result of a picto effect activation
 */
export interface PictoEffectResult {
    success: boolean;
    message?: string;
    appliedEffects?: {
        targetId: number;
        effect: StatusType;
        duration?: number;
        amount?: number;
    }[];
}

// ==================== PICTO EFFECT REGISTRY ====================

/**
 * Registry mapping picto names to their effect handlers
 */
type PictoEffectHandler = (ctx: PictoEffectContext) => Promise<PictoEffectResult>;

const pictoEffectHandlers: Record<string, PictoEffectHandler> = {};

/**
 * Register a picto effect handler
 */
export function registerPictoEffect(pictoName: string, handler: PictoEffectHandler): void {
    pictoEffectHandlers[pictoName.toLowerCase()] = handler;
}

/**
 * Get equipped picto/lumina names for effect execution
 * @param pictos - Equipped pictos from player
 * @param luminas - Equipped luminas from player
 * @returns Array of pictoId names (from both pictos and luminas)
 */
export function getEquippedEffectNames(
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
): string[] {
    const names: string[] = [];

    // Add equipped pictos
    if (pictos) {
        names.push(...pictos.filter(p => p.slot !== null && p.slot !== undefined).map(p => p.pictoId));
    }

    // Add equipped luminas
    if (luminas) {
        names.push(...luminas.filter(l => l.isEquiped).map(l => l.pictoId));
    }

    return names;
}

/**
 * Execute picto/lumina effects for a given trigger
 *
 * NOTE: This function handles BOTH Pictos and Luminas.
 * - Pictos provide: Status bonuses + Effects
 * - Luminas provide: Effects ONLY (same as pictos, but no status bonuses)
 *
 * Both use the same pictoId/name for effect lookup.
 *
 * @param trigger - The event that triggered the effects
 * @param source - Character with equipped pictos/luminas
 * @param allCharacters - All characters in battle
 * @param battleId - Battle ID for API calls
 * @param pictos - Equipped pictos (optional, for integration)
 * @param luminas - Equipped luminas (optional, for integration)
 * @param target - Target of the action (if applicable)
 * @param additionalData - Extra context data
 */
export async function executePictoEffects(
    trigger: PictoTrigger,
    source: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[],
    target?: BattleCharacterInfo,
    additionalData?: PictoEffectContext["additionalData"]
): Promise<PictoEffectResult[]> {
    // Get all equipped picto/lumina names
    const equippedEffects = getEquippedEffectNames(pictos, luminas);

    console.log("[executePictoEffects] Trigger:", trigger);
    console.log("[executePictoEffects] Equipped effects:", equippedEffects);
    console.log("[executePictoEffects] Available handlers:", Object.keys(pictoEffectHandlers));

    const results: PictoEffectResult[] = [];

    for (const pictoName of equippedEffects) {
        const handlerKey = pictoName.toLowerCase();
        const handler = pictoEffectHandlers[handlerKey];
        console.log(`[executePictoEffects] Looking for handler: "${handlerKey}", found: ${!!handler}`);

        if (handler) {
            try {
                const result = await handler({
                    trigger,
                    source,
                    target,
                    allCharacters,
                    pictoName,
                    battleId,
                    additionalData
                });

                console.log(`[executePictoEffects] Result for ${pictoName}:`, result);

                // Only add to results if effect actually activated
                if (result.success) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`Error executing picto/lumina effect ${pictoName}:`, error);
                results.push({
                    success: false,
                    message: `Failed to execute ${pictoName}`
                });
            }
        }
    }

    return results;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Apply a status effect to a character
 */
async function applyStatus(
    targetId: number,
    effectType: StatusType,
    amount: number = 0,
    remainingTurns?: number
): Promise<void> {
    await APIBattle.addStatus({
        battleCharacterId: targetId,
        effectType,
        ammount: amount,
        remainingTurns: remainingTurns ?? null
    });
}

/**
 * Check if character is fighting alone (all other allies are dead)
 */
function isFightingAlone(source: BattleCharacterInfo, allCharacters: BattleCharacterInfo[]): boolean {
    const allies = allCharacters.filter(
        c => c.isEnemy === source.isEnemy && c.battleID !== source.battleID
    );
    return allies.every(ally => ally.healthPoints === 0);
}

/**
 * Check if all allies are alive
 */
function allAlliesAlive(source: BattleCharacterInfo, allCharacters: BattleCharacterInfo[]): boolean {
    const allies = allCharacters.filter(
        c => c.isEnemy === source.isEnemy && c.battleID !== source.battleID
    );
    return allies.every(ally => ally.healthPoints > 0);
}

/**
 * Roll percentage chance (0-100)
 */
function rollChance(percentage: number): boolean {
    return Math.random() * 100 < percentage;
}

/**
 * Give MP to a character
 * Note: In our system, pictos that give "AP" actually give MP (Magic Points)
 */
async function giveMP(targetId: number, amount: number): Promise<void> {
    await APIBattle.giveMP(targetId, amount);
}

/**
 * Heal a character
 */
async function healCharacter(targetId: number, amount: number): Promise<void> {
    await APIBattle.heal(targetId, amount);
}

/**
 * Track effect activation usage (for once-per-battle effects)
 * This is a simple in-memory tracker. For persistence, implement in backend.
 */
const effectActivationTracker: Record<string, Set<string>> = {};

function canActivateEffect(battleId: number, characterId: number, effectName: string, limitType: "once-per-battle"): boolean {
    const key = `${battleId}-${characterId}-${effectName}`;
    const trackerKey = `${battleId}-${limitType}`;

    if (!effectActivationTracker[trackerKey]) {
        effectActivationTracker[trackerKey] = new Set();
    }

    return !effectActivationTracker[trackerKey].has(key);
}

function trackEffectActivation(battleId: number, characterId: number, effectName: string, limitType: "once-per-battle"): void {
    const key = `${battleId}-${characterId}-${effectName}`;
    const trackerKey = `${battleId}-${limitType}`;

    if (!effectActivationTracker[trackerKey]) {
        effectActivationTracker[trackerKey] = new Set();
    }

    effectActivationTracker[trackerKey].add(key);
}

/**
 * Clear effect tracking for a battle (call when battle ends)
 */
export function clearBattleEffectTracking(battleId: number): void {
    Object.keys(effectActivationTracker).forEach(key => {
        if (key.startsWith(`${battleId}-`)) {
            delete effectActivationTracker[key];
        }
    });
}

/**
 * Check if a character has a specific picto/lumina equipped
 * Useful for checking passive modifiers in damage calculations
 */
export function hasEquippedEffect(effectName: string, pictos?: PictoResponse[], luminas?: LuminaResponse[]): boolean {
    const equippedNames = getEquippedEffectNames(pictos, luminas);
    return equippedNames.some(name => name.toLowerCase() === effectName.toLowerCase());
}

/**
 * Get damage modifier for a character based on equipped pictos
 * Returns multiplier (1.0 = no change, 1.5 = +50% damage, 0.5 = -50% damage)
 *
 * NOTE: This is a reference implementation. Damage calculations should check
 * for these pictos and apply the appropriate modifiers.
 */
export function getDamageModifier(
    _source: BattleCharacterInfo,
    _target?: BattleCharacterInfo,
    context?: {
        isFirstAttack?: boolean;
        isCritical?: boolean;
        isWeakPoint?: boolean;
        targetIsBurning?: boolean;
        targetIsFrozen?: boolean;
        targetIsMarked?: boolean;
        sourceIsFightingAlone?: boolean;
        sourceAlliesAlive?: boolean;
    },
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
): number {
    let multiplier = 1.0;

    // Solo Fighter: +50% damage when fighting alone
    if (context?.sourceIsFightingAlone && hasEquippedEffect("Solo Fighter", pictos, luminas)) {
        multiplier *= 1.5;
    }

    // Burn Affinity: +25% damage on burning targets
    if (context?.targetIsBurning && hasEquippedEffect("Burn Affinity", pictos, luminas)) {
        multiplier *= 1.25;
    }

    // Frozen Affinity: +25% damage on frozen targets
    if (context?.targetIsFrozen && hasEquippedEffect("Frozen Affinity", pictos, luminas)) {
        multiplier *= 1.25;
    }

    // Teamwork: +25% damage when all allies alive
    if (context?.sourceAlliesAlive && hasEquippedEffect("Teamwork", pictos, luminas)) {
        multiplier *= 1.25;
    }

    // Glass Canon: +50% damage, -50% max HP (damage part)
    if (hasEquippedEffect("Glass Canon", pictos, luminas)) {
        multiplier *= 1.5;
    }

    return multiplier;
}

// ==================== PICTO EFFECT IMPLEMENTATIONS ====================

// ==================== ENERGY & MP GENERATION ====================

/**
 * Energy Master
 * "Every AP gain is increased by 1."
 * NOTE: This is a passive modifier - marker effect for other systems to check
 */
registerPictoEffect("energy-master", async (ctx) => {
    // This is a passive modifier - systems granting AP should check for this effect
    // and add +1 AP to all AP gains for characters with this picto equipped
    if (ctx.trigger === "on-battle-start") {
        return {
            success: true,
            message: `${ctx.source.name} has ${getPictoName("energy-master")} active! All AP gains +1.`
        };
    }
    return { success: false };
});

/**
 * Energising Turn
 * "+1 AP on turn start."
 */
registerPictoEffect("energising-turn", async (ctx) => {
    if (ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-turn")}!`
    };
});

/**
 * Energising Attack I
 * "+1 AP on Base Attack."
 */
registerPictoEffect("energising-attack-i", async (ctx) => {
    if (ctx.trigger !== "on-attack") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-attack-i")}!`
    };
});

/**
 * Energising Parry
 * "+1 AP on successful Parry."
 */
registerPictoEffect("energising-parry", async (ctx) => {
    if (ctx.trigger !== "on-parry") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-parry")}!`
    };
});

/**
 * Dodger
 * "Gain 1 AP on Perfect Dodge. Once per turn."
 */
registerPictoEffect("dodger", async (ctx) => {
    if (ctx.trigger !== "on-dodge") {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Dodger",
        effectType: "once-per-turn"
    });

    console.log("[Dodger] canActivate response:", canActivate);

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("dodger")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Dodger",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("dodger")}!`
    };
});

/**
 * Energising Start I/II/III/IV
 * "+1 AP on battle start."
 */
const registerEnergisingStart = (name: string) => {
    registerPictoEffect(name, async (ctx) => {
        if (ctx.trigger !== "on-battle-start") {
            return { success: false };
        }

        await giveMP(ctx.source.battleID, 1);

        return {
            success: true,
            message: `${ctx.source.name} gained 1 MP from ${getPictoName(name)}!`
        };
    });
};

registerEnergisingStart("energising-start-i");
registerEnergisingStart("energising-start-ii");
registerEnergisingStart("energising-start-iii");
registerEnergisingStart("energising-start-iv");

/**
 * Perilous Parry
 * "+1 AP on Parry, but damage received is doubled."
 */
registerPictoEffect("perilous-parry", async (ctx) => {
    if (ctx.trigger !== "on-parry") {
        return { success: false };
    }

    // NOTE: "damage received is doubled" is a passive modifier requiring backend
    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("perilous-parry")}!`
    };
});

/**
 * Bloody Bullet
 * "+1 AP on Weak Point hit."
 */
registerPictoEffect("bloody-bullet", async (ctx) => {
    if (ctx.trigger !== "on-weak-point") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("bloody-bullet")}!`
    };
});

/**
 * Energising Revive
 * "+3 AP to all allies when revived."
 */
registerPictoEffect("energising-revive", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    for (const ally of allies) {
        await giveMP(ally.battleID, 3);
    }

    return {
        success: true,
        message: `All allies gained 3 MP from ${ctx.source.name}'s ${getPictoName("energising-revive")}!`
    };
});

/**
 * Lucky Aim
 * "30% chance to recover 1 AP on hitting a Weak Point."
 */
registerPictoEffect("lucky-aim", async (ctx) => {
    if (ctx.trigger !== "on-weak-point") {
        return { success: false };
    }

    if (!rollChance(30)) {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("lucky-aim")}!`
    };
});

/**
 * Dead Energy I/II
 * "+3 AP on killing an enemy."
 */
const registerDeadEnergy = (name: string) => {
    registerPictoEffect(name, async (ctx) => {
        if (ctx.trigger !== "on-kill") {
            return { success: false };
        }

        await giveMP(ctx.source.battleID, 3);

        return {
            success: true,
            message: `${ctx.source.name} gained 3 MP from ${getPictoName(name)}!`
        };
    });
};

registerDeadEnergy("dead-energy-i");
registerDeadEnergy("dead-energy-ii");

/**
 * Energising Attack II
 * "+1 AP on Base Attack."
 */
registerPictoEffect("energising-attack-ii", async (ctx) => {
    if (ctx.trigger !== "on-attack") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-attack-ii")}!`
    };
});

/**
 * Energising Pain
 * "No longer gain AP on Parry. +1 AP on getting hit."
 */
registerPictoEffect("energising-pain", async (ctx) => {
    if (ctx.trigger !== "on-damage-taken") {
        return { success: false };
    }

    // NOTE: "No longer gain AP on Parry" is a passive modifier requiring backend
    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-pain")}!`
    };
});

/**
 * Energising Jump
 * "+1 AP on Jump Counterattack."
 * Note: Currently activates on any counterattack since Jump is the primary counterattack mechanic.
 * If other counterattack types are added in the future, add type check in additionalData.
 */
registerPictoEffect("energising-jump", async (ctx) => {
    if (ctx.trigger !== "on-counterattack") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-jump")}!`
    };
});

/**
 * Rewarding Mark
 * "+2 AP on dealing damage to a Marked target. Once per turn."
 */
registerPictoEffect("rewarding-mark", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    // Check if target is Marked
    const isMarked = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Marked");
    if (!isMarked) {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Rewarding Mark",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("rewarding-mark")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Rewarding Mark",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 2);

    return {
        success: true,
        message: `${ctx.source.name} gained 2 MP from ${getPictoName("rewarding-mark")}!`
    };
});

/**
 * Energising Shots
 * "20% chance to gain 1 AP on Free Aim shot."
 */
registerPictoEffect("energising-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim") {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-shots")}!`
    };
});

/**
 * Effective Support
 * "+2 AP on using an item."
 */
registerPictoEffect("effective-support", async (ctx) => {
    if (ctx.trigger !== "on-item-use") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 2);

    return {
        success: true,
        message: `${ctx.source.name} gained 2 MP from ${getPictoName("effective-support")}!`
    };
});

/**
 * Weakness Gain
 * "+1 AP on hitting an enemy's Weakness. Once per turn."
 */
registerPictoEffect("weakness-gain", async (ctx) => {
    if (ctx.trigger !== "on-weak-point") {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Weakness Gain",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("weakness-gain")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Weakness Gain",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("weakness-gain")}!`
    };
});

/**
 * Patient Fighter
 * "+2 AP on skipping a turn."
 */
registerPictoEffect("patient-fighter", async (ctx) => {
    if (ctx.trigger !== "on-pass-turn") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 2);

    return {
        success: true,
        message: `${ctx.source.name} gained 2 MP from ${getPictoName("patient-fighter")}!`
    };
});

/**
 * Energetic Healer
 * "+2 AP on Healing an ally. Once per turn."
 */
registerPictoEffect("energetic-healer", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally") {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Energetic Healer",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("energetic-healer")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Energetic Healer",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 2);

    return {
        success: true,
        message: `${ctx.source.name} gained 2 MP from ${getPictoName("energetic-healer")}!`
    };
});

/**
 * Beneficial Contamination
 * "+2 AP on applying a Status Effect. Once per turn."
 */
registerPictoEffect("beneficial-contamination", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Beneficial Contamination",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("beneficial-contamination")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Beneficial Contamination",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 2);

    return {
        success: true,
        message: `${ctx.source.name} gained 2 MP from ${getPictoName("beneficial-contamination")}!`
    };
});

/**
 * Perfect Reward
 * "Perfect Rythms give 1 AP."
 */
registerPictoEffect("perfect-reward", async (_ctx) => {
    // NOTE: Requires backend implementation for rhythm game integration
    return {
        success: false,
        message: "Perfect Reward requires backend implementation for rhythm game integration"
    };
});

/**
 * Energising Break
 * "+3 AP on Breaking a target."
 */
registerPictoEffect("energising-break", async (ctx) => {
    if (ctx.trigger !== "on-break") {
        return { success: false };
    }

    await giveMP(ctx.source.battleID, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained 3 MP from ${getPictoName("energising-break")}!`
    };
});

/**
 * Energising Gradient
 * "+1 AP per Gradient Charge consumed."
 */
registerPictoEffect("energising-gradient", async (ctx) => {
    if (ctx.trigger !== "on-gradient-use") {
        return { success: false };
    }

    // Get number of gradient charges consumed from additionalData
    const chargesConsumed = ctx.additionalData?.gradientChargesConsumed ?? 1;
    await giveMP(ctx.source.battleID, chargesConsumed);

    return {
        success: true,
        message: `${ctx.source.name} gained ${chargesConsumed} MP from ${getPictoName("energising-gradient")}!`
    };
});

/**
 * Energising Burn
 * "+1 AP on applying Burn. Once per turn."
 */
registerPictoEffect("energising-burn", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Burning") {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Energising Burn",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("energising-burn")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Energising Burn",
        effectType: "once-per-turn"
    });

    await giveMP(ctx.source.battleID, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained 1 MP from ${getPictoName("energising-burn")}!`
    };
});

/**
 * Energising Powerful
 * "Give 2 AP on applying Powerful."
 */
registerPictoEffect("energising-powerful", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Empowered") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await giveMP(ctx.target.battleID, 2);

    return {
        success: true,
        message: `${ctx.target.name} gained 2 MP from ${getPictoName("energising-powerful")}!`
    };
});

/**
 * Energising Shell
 * "Give 2 AP on applying Shell."
 */
registerPictoEffect("energising-shell", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Protected") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await giveMP(ctx.target.battleID, 2);

    return {
        success: true,
        message: `${ctx.target.name} gained 2 MP from ${getPictoName("energising-shell")}!`
    };
});

/**
 * Energising Rush
 * "Give 2 AP on applying Rush."
 */
registerPictoEffect("energising-rush", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Hastened") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await giveMP(ctx.target.battleID, 2);

    return {
        success: true,
        message: `${ctx.target.name} gained 2 MP from ${getPictoName("energising-rush")}!`
    };
});

/**
 * Energising Cleanse
 * "Dispel the first negative Status Effect received and gain 2 AP."
 */
registerPictoEffect("energising-cleanse", async (_ctx) => {
    // NOTE: Requires backend implementation to intercept status effect application
    return {
        success: false,
        message: "Energising Cleanse requires backend implementation"
    };
});

// ==================== SURVIVAL & DEFENSIVE ====================

/**
 * Survivor
 * "Survive fatal damage with 1 Health. Once per battle."
 * NOTE: This effect needs to be checked when damage would reduce HP to 0 or below
 */
registerPictoEffect("survivor", async (ctx) => {
    if (ctx.trigger === "on-damage-taken") {
        const damageAmount = ctx.additionalData?.damageAmount ?? 0;
        const wouldDie = ctx.source.healthPoints - damageAmount <= 0;

        if (wouldDie) {
            const canActivate = canActivateEffect(
                ctx.battleId,
                ctx.source.battleID,
                "Survivor",
                "once-per-battle"
            );

            if (canActivate) {
                // Set HP to 1
                const healAmount = 1 - (ctx.source.healthPoints - damageAmount);
                await healCharacter(ctx.source.battleID, healAmount);

                // Track usage
                trackEffectActivation(
                    ctx.battleId,
                    ctx.source.battleID,
                    "Survivor",
                    "once-per-battle"
                );

                return {
                    success: true,
                    message: `${ctx.source.name} survived with 1 HP thanks to ${getPictoName("survivor")}!`
                };
            }
        }
    }
    return { success: false };
});

/**
 * Second Chance
 * "Revive with 100% Health. Once per battle."
 * NOTE: This should trigger automatically when character would die
 */
registerPictoEffect("second-chance", async (ctx) => {
    if (ctx.trigger === "on-death") {
        const canActivate = canActivateEffect(
            ctx.battleId,
            ctx.source.battleID,
            "Second Chance",
            "once-per-battle"
        );

        if (canActivate) {
            // Revive with full health
            await healCharacter(ctx.source.battleID, ctx.source.maxHealthPoints);

            // Track usage
            trackEffectActivation(
                ctx.battleId,
                ctx.source.battleID,
                "Second Chance",
                "once-per-battle"
            );

            return {
                success: true,
                message: `${ctx.source.name} revived with full HP thanks to ${getPictoName("second-chance")}!`
            };
        }
    }
    return { success: false };
});

/**
 * Aegis Revival
 * "+1 Shield on being revived."
 */
registerPictoEffect("aegis-revival", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Shielded", 1, undefined);

    return {
        success: true,
        message: `${ctx.source.name} gained Shield from ${getPictoName("aegis-revival")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Shielded",
            amount: 1
        }]
    };
});

/**
 * Recovery
 * "Recovers 10% Health on turn start."
 */
registerPictoEffect("recovery", async (ctx) => {
    if (ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.10);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("recovery")}!`
    };
});

/**
 * Solidifying
 * "+2 Shields when the character's Health falls below 50%. Once per battle."
 */
registerPictoEffect("solidifying", async (_ctx) => {
    // NOTE: Requires backend implementation to track health threshold
    return {
        success: false,
        message: "Solidifying requires backend implementation for health threshold tracking"
    };
});

/**
 * Rejuvenating Revive
 * "Apply Regen for 3 turns when revived."
 */
registerPictoEffect("rejuvenating-revive", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Regeneration", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Regen from ${getPictoName("rejuvenating-revive")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Regeneration",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Revive With Shell
 * "Apply Shell for 3 turns on revive."
 */
registerPictoEffect("revive-with-shell", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("revive-with-shell")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Powerful Revive
 * "Apply Powerful for 3 turns when revived."
 */
registerPictoEffect("powerful-revive", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("powerful-revive")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Revive With Rush
 * "Apply Rush for 3 turns on revive."
 */
registerPictoEffect("revive-with-rush", async (ctx) => {
    if (ctx.trigger !== "on-revived") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Rush from ${getPictoName("revive-with-rush")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Confident
 * "Take 50% less damage, but can't be Healed."
 */
registerPictoEffect("confident", async (_ctx) => {
    // NOTE: Passive modifier requiring backend implementation
    return {
        success: false,
        message: "Confident requires backend implementation for passive damage reduction"
    };
});

/**
 * SOS Shell
 * "Apply Shell when falling below 50% Health."
 */
registerPictoEffect("sos-shell", async (ctx) => {
    if (ctx.trigger === "on-damage-taken") {
        const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
        const healthAfterDamage = ctx.source.healthPoints - (ctx.additionalData?.damageAmount ?? 0);
        const healthPercentAfter = (healthAfterDamage / ctx.source.maxHealthPoints) * 100;

        // Trigger if crossing below 50% HP threshold
        if (healthPercent >= 50 && healthPercentAfter < 50) {
            const canActivate = canActivateEffect(
                ctx.battleId,
                ctx.source.battleID,
                "SOS Shell",
                "once-per-battle"
            );

            if (canActivate) {
                await applyStatus(ctx.source.battleID, "Protected", 0, 3);

                trackEffectActivation(
                    ctx.battleId,
                    ctx.source.battleID,
                    "SOS Shell",
                    "once-per-battle"
                );

                return {
                    success: true,
                    message: `${ctx.source.name} gained Shell from ${getPictoName("sos-shell")}!`,
                    appliedEffects: [{
                        targetId: ctx.source.battleID,
                        effect: "Protected",
                        duration: 3,
                        amount: 0
                    }]
                };
            }
        }
    }
    return { success: false };
});

/**
 * SOS Power
 * "Apply Powerful when falling below 50% Health."
 */
registerPictoEffect("sos-power", async (ctx) => {
    if (ctx.trigger === "on-damage-taken") {
        const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
        const healthAfterDamage = ctx.source.healthPoints - (ctx.additionalData?.damageAmount ?? 0);
        const healthPercentAfter = (healthAfterDamage / ctx.source.maxHealthPoints) * 100;

        // Trigger if crossing below 50% HP threshold
        if (healthPercent >= 50 && healthPercentAfter < 50) {
            const canActivate = canActivateEffect(
                ctx.battleId,
                ctx.source.battleID,
                "SOS Power",
                "once-per-battle"
            );

            if (canActivate) {
                await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

                trackEffectActivation(
                    ctx.battleId,
                    ctx.source.battleID,
                    "SOS Power",
                    "once-per-battle"
                );

                return {
                    success: true,
                    message: `${ctx.source.name} gained Powerful from ${getPictoName("sos-power")}!`,
                    appliedEffects: [{
                        targetId: ctx.source.battleID,
                        effect: "Empowered",
                        duration: 3,
                        amount: 0
                    }]
                };
            }
        }
    }
    return { success: false };
});

/**
 * SOS Rush
 * "Apply Rush when falling below 50% Health."
 */
registerPictoEffect("sos-rush", async (ctx) => {
    if (ctx.trigger === "on-damage-taken") {
        const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
        const healthAfterDamage = ctx.source.healthPoints - (ctx.additionalData?.damageAmount ?? 0);
        const healthPercentAfter = (healthAfterDamage / ctx.source.maxHealthPoints) * 100;

        // Trigger if crossing below 50% HP threshold
        if (healthPercent >= 50 && healthPercentAfter < 50) {
            const canActivate = canActivateEffect(
                ctx.battleId,
                ctx.source.battleID,
                "SOS Rush",
                "once-per-battle"
            );

            if (canActivate) {
                await applyStatus(ctx.source.battleID, "Hastened", 0, 3);

                trackEffectActivation(
                    ctx.battleId,
                    ctx.source.battleID,
                    "SOS Rush",
                    "once-per-battle"
                );

                return {
                    success: true,
                    message: `${ctx.source.name} gained Rush from ${getPictoName("sos-rush")}!`,
                    appliedEffects: [{
                        targetId: ctx.source.battleID,
                        effect: "Hastened",
                        duration: 3,
                        amount: 0
                    }]
                };
            }
        }
    }
    return { success: false };
});

/**
 * Solidifying Meditation
 * "+1 Shield when passing turn."
 */
registerPictoEffect("solidifying-meditation", async (ctx) => {
    if (ctx.trigger !== "on-pass-turn") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Shielded", 1, undefined);

    return {
        success: true,
        message: `${ctx.source.name} gained Shield from ${getPictoName("solidifying-meditation")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Shielded",
            amount: 1
        }]
    };
});

/**
 * Base Shield
 * "+1 Shield if not affected by any Shield on turn start."
 */
registerPictoEffect("base-shield", async (ctx) => {
    if (ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    const hasShield = ctx.source.status?.some((s: StatusResponse) => s.effectName === "Shielded");
    if (hasShield) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Shielded", 1, undefined);

    return {
        success: true,
        message: `${ctx.source.name} gained Shield from ${getPictoName("base-shield")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Shielded",
            amount: 1
        }]
    };
});

/**
 * In Medias Res
 * "+3 Shields on Battle Start, but max Health is halved."
 */
registerPictoEffect("in-medias-res", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    // NOTE: "max Health is halved" is a passive modifier requiring backend
    await applyStatus(ctx.source.battleID, "Shielded", 3, undefined);

    return {
        success: true,
        message: `${ctx.source.name} gained 3 Shields from ${getPictoName("in-medias-res")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Shielded",
            amount: 3
        }]
    };
});

/**
 * Defensive Mode
 * "On receiving damage, consume 1 AP to take 30% less damage, if possible."
 */
registerPictoEffect("defensive-mode", async (_ctx) => {
    // NOTE: Requires backend implementation to intercept damage
    return {
        success: false,
        message: "Defensive Mode requires backend implementation"
    };
});

/**
 * Revive Paradox
 * "Play immediately when revived."
 */
registerPictoEffect("revive-paradox", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation
    return {
        success: false,
        message: "Revive Paradox requires backend implementation"
    };
});

/**
 * Effective Heal
 * "Double all Heals received."
 */
registerPictoEffect("effective-heal", async (_ctx) => {
    // NOTE: Passive modifier requiring backend implementation
    return {
        success: false,
        message: "Effective Heal requires backend implementation"
    };
});

/**
 * Shortcut
 * "Immediately play when falling below 30% Health. Once per battle."
 */
registerPictoEffect("shortcut", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation
    return {
        success: false,
        message: "Shortcut requires backend implementation"
    };
});

/**
 * Clea's Life
 * "On turn start, if no damage taken since last turn, recover 100% Health."
 */
registerPictoEffect("cleas-life", async (ctx) => {
    if (ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    // NOTE: Requires backend implementation to track damage taken since last turn
    return {
        success: false,
        message: "Clea's Life requires backend implementation for damage tracking"
    };
});

// ==================== BATTLE START BUFFS ====================

/**
 * Auto Powerful
 * "Apply Powerful for 3 turns on battle start."
 */
registerPictoEffect("auto-powerful", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("auto-powerful")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Auto Shell
 * "Apply Shell for 3 turns on battle start."
 */
registerPictoEffect("auto-shell", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("auto-shell")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Auto Rush
 * "Apply Rush for 3 turns on battle start."
 */
registerPictoEffect("auto-rush", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Rush from ${getPictoName("auto-rush")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Auto Regen
 * "Apply Regen for 3 turns on battle start."
 */
registerPictoEffect("auto-regen", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Regeneration", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Regen from ${getPictoName("auto-regen")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Regeneration",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Auto Curse
 * "Self apply Curse on battle start."
 */
registerPictoEffect("auto-curse", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Cursed", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} cursed themselves with ${getPictoName("auto-curse")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Cursed",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Auto Burn
 * "Self apply Burn on battle start."
 */
registerPictoEffect("auto-burn", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Burning", 1, 3);

    return {
        success: true,
        message: `${ctx.source.name} burned themselves with ${getPictoName("auto-burn")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Burning",
            duration: 3,
            amount: 1
        }]
    };
});

/**
 * Auto Death
 * "Kill self on battle start."
 */
registerPictoEffect("auto-death", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    // NOTE: Requires backend implementation to kill character
    return {
        success: false,
        message: "Auto Death requires backend implementation"
    };
});

/**
 * Inverted Affinity
 * "Apply Inverted on self for 3 turns on battle start. 50% increased damage while Inverted."
 */
registerPictoEffect("inverted-affinity", async (ctx) => {
    if (ctx.trigger !== "on-battle-start") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Inverted", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} inverted themselves with ${getPictoName("inverted-affinity")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Inverted",
            duration: 3,
            amount: 0
        }]
    };
});

// ==================== HEALING EFFECTS ====================

/**
 * Attack Lifesteal
 * "Recover 15% Health on Base Attack."
 */
registerPictoEffect("attack-lifesteal", async (ctx) => {
    if (ctx.trigger !== "on-attack") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.15);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("attack-lifesteal")}!`
    };
});

/**
 * Healing Parry
 * "Recover 3% Health on Parry."
 */
registerPictoEffect("healing-parry", async (ctx) => {
    if (ctx.trigger !== "on-parry") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.03);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("healing-parry")}!`
    };
});

/**
 * Sweet Kill
 * "Recover 50% Health on killing an enemy."
 */
registerPictoEffect("sweet-kill", async (ctx) => {
    if (ctx.trigger !== "on-kill") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.50);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("sweet-kill")}!`
    };
});

/**
 * Healing Counter
 * "Recover 25% Health on Counterattack."
 */
registerPictoEffect("healing-counter", async (ctx) => {
    if (ctx.trigger !== "on-counterattack") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.25);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("healing-counter")}!`
    };
});

/**
 * Healing Fire
 * "Recover 25% Health when attacking a Burning target. Once per turn."
 */
registerPictoEffect("healing-fire", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    const isBurning = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Burning");
    if (!isBurning) {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Healing Fire",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("healing-fire")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Healing Fire",
        effectType: "once-per-turn"
    });

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.25);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("healing-fire")}!`
    };
});

/**
 * Healing Death
 * "On death, the rest of the Expedition recover all Health."
 */
registerPictoEffect("healing-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    for (const ally of allies) {
        await healCharacter(ally.battleID, ally.maxHealthPoints);
    }

    return {
        success: true,
        message: `All allies fully healed from ${ctx.source.name}'s ${getPictoName("healing-death")}!`
    };
});

/**
 * Healing Mark
 * "Recover 25% Health on hitting a Marked enemy. Once per turn."
 */
registerPictoEffect("healing-mark", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    const isMarked = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Marked");
    if (!isMarked) {
        return { success: false };
    }

    // Verificar se já foi usado neste turno
    const canActivate = await APIPictoTracker.canActivate({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Healing Mark",
        effectType: "once-per-turn"
    });

    if (!canActivate) {
        return {
            success: false,
            message: `${ctx.source.name}'s ${getPictoName("healing-mark")} already used this turn!`
        };
    }

    // Registrar uso do efeito
    await APIPictoTracker.trackEffect({
        battleId: ctx.battleId,
        battleCharacterId: ctx.source.battleID,
        pictoName: "Healing Mark",
        effectType: "once-per-turn"
    });

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.25);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("healing-mark")}!`
    };
});

/**
 * Shared Care
 * "When Healing an ally, also Heal self for 50% of that value."
 */
registerPictoEffect("shared-care", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally") {
        return { success: false };
    }

    const healAmount = Math.floor((ctx.additionalData?.healAmount ?? 0) * 0.50);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} healed themselves for ${healAmount} HP from ${getPictoName("shared-care")}!`
    };
});

/**
 * Healing Share
 * "Receive 15% of all Heals affecting other characters."
 */
registerPictoEffect("healing-share", async (_ctx) => {
    // NOTE: Requires backend implementation to intercept all heals
    return {
        success: false,
        message: "Healing Share requires backend implementation"
    };
});

/**
 * Gradient Recovery
 * "Recover 10% Health on using a Gradient Charge."
 */
registerPictoEffect("gradient-recovery", async (ctx) => {
    if (ctx.trigger !== "on-gradient-use") {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.10);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("gradient-recovery")}!`
    };
});

/**
 * Healing Boon
 * "Heal 15% HP on applying a buff."
 */
registerPictoEffect("healing-boon", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    // Check if the status applied is a buff
    const buffStatuses: StatusType[] = ["Hastened", "Empowered", "Protected", "Regeneration", "Shielded"];
    if (!ctx.additionalData?.statusApplied || !buffStatuses.includes(ctx.additionalData.statusApplied)) {
        return { success: false };
    }

    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.15);
    await healCharacter(ctx.source.battleID, healAmount);

    return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP from ${getPictoName("healing-boon")}!`
    };
});

// ==================== HEALING ALLY BUFFS ====================

/**
 * Accelerating Heal
 * "Healing an ally also applies Rush for 1 turn."
 */
registerPictoEffect("accelerating-heal", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Hastened", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} gained Rush from ${getPictoName("accelerating-heal")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Hastened",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Powerful Heal
 * "Healing an ally also applies Powerful for 1 turn."
 */
registerPictoEffect("powerful-heal", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Empowered", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} gained Powerful from ${getPictoName("powerful-heal")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Empowered",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Energising Heal
 * "On Healing an ally, also give 2 AP."
 */
registerPictoEffect("energising-heal", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally" || !ctx.target) {
        return { success: false };
    }

    await giveMP(ctx.target.battleID, 2);

    return {
        success: true,
        message: `${ctx.target.name} gained 2 MP from ${getPictoName("energising-heal")}!`
    };
});

/**
 * Protecting Heal
 * "Healing an ally also applies Shell for 1 turn."
 */
registerPictoEffect("protecting-heal", async (ctx) => {
    if (ctx.trigger !== "on-heal-ally" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Protected", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} gained Shell from ${getPictoName("protecting-heal")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Protected",
            duration: 1,
            amount: 0
        }]
    };
});

// ==================== LAST STAND / SOLO EFFECTS ====================

/**
 * Accelerating Last Stand
 * "Gain Rush if fighting alone."
 */
registerPictoEffect("accelerating-last-stand", async (ctx) => {
    if (ctx.trigger !== "on-battle-start" && ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    if (!isFightingAlone(ctx.source, ctx.allCharacters)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Rush from ${getPictoName("accelerating-last-stand")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Empowering Last Stand
 * "Gain Powerful if fighting alone."
 */
registerPictoEffect("empowering-last-stand", async (ctx) => {
    if (ctx.trigger !== "on-battle-start" && ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    if (!isFightingAlone(ctx.source, ctx.allCharacters)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("empowering-last-stand")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Protecting Last Stand
 * "Gain Shell if fighting alone."
 */
registerPictoEffect("protecting-last-stand", async (ctx) => {
    if (ctx.trigger !== "on-battle-start" && ctx.trigger !== "on-turn-start") {
        return { success: false };
    }

    if (!isFightingAlone(ctx.source, ctx.allCharacters)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("protecting-last-stand")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Solo Fighter
 * "Deal 50% more damage if fighting alone."
 */
registerPictoEffect("solo-fighter", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Solo Fighter requires backend implementation"
    };
});

/**
 * Last Stand Critical
 * "100% Critical Chance while fighting alone."
 */
registerPictoEffect("last-stand-critical", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Last Stand Critical requires backend implementation"
    };
});

// ==================== FREE AIM EFFECTS ====================

/**
 * Accelerating Shots
 * "20% chance to gain Rush on Free Aim shot."
 */
registerPictoEffect("accelerating-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim") {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Rush from ${getPictoName("accelerating-shots")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Powerful Shots
 * "20% chance to gain Powerful on Free Aim shot."
 */
registerPictoEffect("powerful-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim") {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("powerful-shots")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Protecting Shots
 * "20% chance to gain Shell on Free Aim shot."
 */
registerPictoEffect("protecting-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim") {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("protecting-shots")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Burning Shots
 * "20% chance to Burn on Free Aim shot."
 */
registerPictoEffect("burning-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim" || !ctx.target) {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Burning", 1, 3);

    return {
        success: true,
        message: `${ctx.target.name} was burned by ${getPictoName("burning-shots")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Burning",
            duration: 3,
            amount: 1
        }]
    };
});

/**
 * Marking Shots
 * "20% chance to apply Mark on Free Aim shot."
 */
registerPictoEffect("marking-shots", async (ctx) => {
    if (ctx.trigger !== "on-free-aim" || !ctx.target) {
        return { success: false };
    }

    if (!rollChance(20)) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Marked", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} was marked by ${getPictoName("marking-shots")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Marked",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Frozen Shot
 * "Free Aim shots can Freeze."
 */
registerPictoEffect("frozen-shot", async (ctx) => {
    if (ctx.trigger !== "on-free-aim" || !ctx.target) {
        return { success: false };
    }

    // Apply Freeze effect
    await applyStatus(ctx.target.battleID, "Frozen", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} was frozen by ${getPictoName("frozen-shot")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Frozen",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Free Aim Inverted Shot
 * "Free Aim shots can apply Inverted."
 */
registerPictoEffect("free-aim-inverted-shot", async (ctx) => {
    if (ctx.trigger !== "on-free-aim" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Inverted", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} was inverted by ${getPictoName("free-aim-inverted-shot")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Inverted",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Augmented Aim
 * "50% increased Free Aim damage."
 */
registerPictoEffect("augmented-aim", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Augmented Aim requires backend implementation"
    };
});

/**
 * Piercing Shot
 * "25% increased Free Aim damage. Free Aim shots ignore Shields."
 */
registerPictoEffect("piercing-shot", async (_ctx) => {
    // NOTE: Passive damage modifier and shield penetration requiring backend implementation
    return {
        success: false,
        message: "Piercing Shot requires backend implementation"
    };
});

/**
 * Sniper
 * "First Free Aim shot each turn deals 200% increased damage and can Break."
 */
registerPictoEffect("sniper", async (_ctx) => {
    // NOTE: Requires backend implementation with turn tracking
    return {
        success: false,
        message: "Sniper requires backend implementation"
    };
});

/**
 * Versatile
 * "After a Free Aim hit, Base Attack damage is increased by 50% for 1 turn."
 */
registerPictoEffect("versatile", async (_ctx) => {
    // NOTE: Requires backend implementation with turn tracking
    return {
        success: false,
        message: "Versatile requires backend implementation"
    };
});

/**
 * Breaking Shots
 * "50% increased Break damage with Free Aim shots."
 */
registerPictoEffect("breaking-shots", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Breaking Shots requires backend implementation"
    };
});

// ==================== TINT EFFECTS ====================

/**
 * Accelerating Tint
 * "Healing Tints also apply Rush."
 */
registerPictoEffect("accelerating-tint", async (ctx) => {
    if (ctx.trigger !== "on-healing-tint" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Rush from ${getPictoName("accelerating-tint")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Empowering Tint
 * "Healing Tints also apply Powerful."
 */
registerPictoEffect("empowering-tint", async (ctx) => {
    if (ctx.trigger !== "on-healing-tint" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Powerful from ${getPictoName("empowering-tint")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Protecting Tint
 * "Healing Tints also apply Shell."
 */
registerPictoEffect("protecting-tint", async (ctx) => {
    if (ctx.trigger !== "on-healing-tint" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Shell from ${getPictoName("protecting-tint")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Shielding Tint
 * "Healing Tints also add 2 Shields."
 */
registerPictoEffect("shielding-tint", async (ctx) => {
    if (ctx.trigger !== "on-healing-tint" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Shielded", 2, undefined);

    return {
        success: true,
        message: `${ctx.target.name} gained 2 Shields from ${getPictoName("shielding-tint")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Shielded",
            amount: 2
        }]
    };
});

/**
 * Healing Tint Energy
 * "Healing Tints also give 1 AP."
 */
registerPictoEffect("healing-tint-energy", async (ctx) => {
    if (ctx.trigger !== "on-healing-tint" || !ctx.target) {
        return { success: false };
    }

    await giveMP(ctx.target.battleID, 1);

    return {
        success: true,
        message: `${ctx.target.name} gained 1 MP from ${getPictoName("healing-tint-energy")}!`
    };
});

/**
 * Revive Tint Energy
 * "Revive Tints also give 3 AP."
 */
registerPictoEffect("revive-tint-energy", async (_ctx) => {
    // NOTE: Requires backend implementation for revive tint detection
    return {
        success: false,
        message: "Revive Tint Energy requires backend implementation"
    };
});

/**
 * Better Healing Tint
 * "Healing Tints have double the Healing effect."
 */
registerPictoEffect("better-healing-tint", async (_ctx) => {
    // NOTE: Passive heal modifier requiring backend implementation
    return {
        success: false,
        message: "Better Healing Tint requires backend implementation"
    };
});

/**
 * Cleansing Tint
 * "Healing Tints also remove all Status Effects from the target."
 */
registerPictoEffect("cleansing-tint", async (_ctx) => {
    // NOTE: Requires backend implementation for status cleansing
    return {
        success: false,
        message: "Cleansing Tint requires backend implementation"
    };
});

/**
 * Great Healing Tint
 * "Healing Tints now affect the whole Expedition."
 */
registerPictoEffect("great-healing-tint", async (_ctx) => {
    // NOTE: Requires backend implementation to change tint target
    return {
        success: false,
        message: "Great Healing Tint requires backend implementation"
    };
});

/**
 * Great Energy Tint
 * "Energy Tints now affect the whole Expedition."
 */
registerPictoEffect("great-energy-tint", async (_ctx) => {
    // NOTE: Requires backend implementation to change tint target
    return {
        success: false,
        message: "Great Energy Tint requires backend implementation"
    };
});

/**
 * Charging Tint
 * "+5% of a Gradient Charge on using an item."
 */
registerPictoEffect("charging-tint", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Tint requires backend implementation"
    };
});

/**
 * Time Tint
 * "Energy Tints also apply Rush."
 */
registerPictoEffect("time-tint", async (_ctx) => {
    // NOTE: Requires backend implementation for energy tint detection
    return {
        success: false,
        message: "Time Tint requires backend implementation"
    };
});

// ==================== ATTACK EFFECTS ====================

/**
 * Empowering Attack
 * "Gain Powerful for 1 turn on Base Attack."
 */
registerPictoEffect("empowering-attack", async (ctx) => {
    if (ctx.trigger !== "on-attack") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("empowering-attack")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Protecting Attack
 * "Gain Shell for 1 turn on Base Attack."
 */
registerPictoEffect("protecting-attack", async (ctx) => {
    if (ctx.trigger !== "on-attack") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 1);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("protecting-attack")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Enfeebling Attack
 * "Base Attack applies Powerless for 1 turn."
 */
registerPictoEffect("enfeebling-attack", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Powerless", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} was weakened by ${getPictoName("enfeebling-attack")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Powerless",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Exposing Attack
 * "Base Attack applies Defenseless for 1 turn."
 */
registerPictoEffect("exposing-attack", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Unprotected", 0, 1);

    return {
        success: true,
        message: `${ctx.target.name} was exposed by ${getPictoName("exposing-attack")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Unprotected",
            duration: 1,
            amount: 0
        }]
    };
});

/**
 * Augmented Attack
 * "50% increased Base Attack damage."
 */
registerPictoEffect("augmented-attack", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Augmented Attack requires backend implementation"
    };
});

/**
 * Augmented First Strike
 * "50% increased damage on the first hit. Once per battle."
 */
registerPictoEffect("augmented-first-strike", async (_ctx) => {
    // NOTE: Requires backend implementation with battle tracking
    return {
        success: false,
        message: "Augmented First Strike requires backend implementation"
    };
});

/**
 * Combo Attack I/II/III
 * "Base Attack has 1 extra hit."
 */
const registerComboAttack = (name: string) => {
    registerPictoEffect(name, async (_ctx) => {
        // NOTE: Passive attack modifier requiring backend implementation
        return {
            success: false,
            message: `${name} requires backend implementation`
        };
    });
};

registerComboAttack("Combo Attack I");
registerComboAttack("Combo Attack II");
registerComboAttack("Combo Attack III");

/**
 * Powered Attack
 * "On every damage dealt, try to consume 1 AP. If successful, increase damage by 20%."
 */
registerPictoEffect("powered-attack", async (_ctx) => {
    // NOTE: Requires backend implementation to consume AP and modify damage
    return {
        success: false,
        message: "Powered Attack requires backend implementation"
    };
});

/**
 * Breaking Attack
 * "Base Attack can Break."
 */
registerPictoEffect("breaking-attack", async (_ctx) => {
    // NOTE: Passive attack modifier requiring backend implementation
    return {
        success: false,
        message: "Breaking Attack requires backend implementation"
    };
});

/**
 * Staggering Attack
 * "50% increased Break damage on Base Attack."
 */
registerPictoEffect("staggering-attack", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Staggering Attack requires backend implementation"
    };
});

/**
 * Charging Attack
 * "+15% of a Gradient Charge on Base Attack."
 */
registerPictoEffect("charging-attack", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Attack requires backend implementation"
    };
});

// ==================== PARRY & DODGE EFFECTS ====================

/**
 * Empowering Parry
 * "Each successful Parry increases damage by 5% until end of the following turn. Taking any damage removes this buff."
 */
registerPictoEffect("empowering-parry", async (_ctx) => {
    // NOTE: Requires backend implementation with damage tracking and stacking buffs
    return {
        success: false,
        message: "Empowering Parry requires backend implementation"
    };
});

/**
 * Burning Dodge
 * "Successful Dodges can Burn the attacker."
 */
registerPictoEffect("burning-dodge", async (ctx) => {
    if (ctx.trigger !== "on-dodge" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Burning", 1, 3);

    return {
        success: true,
        message: `${ctx.target.name} was burned by ${getPictoName("burning-dodge")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Burning",
            duration: 3,
            amount: 1
        }]
    };
});

/**
 * Defense Breaker Dodge
 * "Successful Dodges can apply Defenseless to the attacker."
 */
registerPictoEffect("defense-breaker-dodge", async (ctx) => {
    if (ctx.trigger !== "on-dodge" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Unprotected", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} was exposed by ${getPictoName("defense-breaker-dodge")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Unprotected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Defense Riser Dodge
 * "Successfully Dodging can apply Shell."
 */
registerPictoEffect("defense-riser-dodge", async (ctx) => {
    if (ctx.trigger !== "on-dodge") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Shell from ${getPictoName("defense-riser-dodge")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Empowering Dodge
 * "5% increased damage for each consecutive successful Dodge. Can stack up to 10 times."
 */
registerPictoEffect("empowering-dodge", async (_ctx) => {
    // NOTE: Requires backend implementation with stacking buffs
    return {
        success: false,
        message: "Empowering Dodge requires backend implementation"
    };
});

/**
 * Successive Parry
 * "Can't Dodge. +5% increased damage per Parry until damage taken."
 */
registerPictoEffect("successive-parry", async (_ctx) => {
    // NOTE: Requires backend implementation with damage tracking and stacking buffs
    return {
        success: false,
        message: "Successive Parry requires backend implementation"
    };
});

// ==================== DEATH EFFECTS ====================

/**
 * Death Bomb
 * "On Death, deal damage to all enemies."
 */
registerPictoEffect("death-bomb", async (_ctx) => {
    // NOTE: Requires backend implementation for damage dealing
    return {
        success: false,
        message: "Death Bomb requires backend implementation"
    };
});

/**
 * Energising Death
 * "On death, +4 AP to allies."
 */
registerPictoEffect("energising-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    for (const ally of allies) {
        await giveMP(ally.battleID, 4);
    }

    return {
        success: true,
        message: `All allies gained 4 MP from ${ctx.source.name}'s ${getPictoName("energising-death")}!`
    };
});

/**
 * Shielding Death
 * "On death, allies gain 3 Shield points."
 */
registerPictoEffect("shielding-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    const effects = [];
    for (const ally of allies) {
        await applyStatus(ally.battleID, "Shielded", 3, undefined);
        effects.push({
            targetId: ally.battleID,
            effect: "Shielded" as StatusType,
            amount: 3
        });
    }

    return {
        success: true,
        message: `All allies gained 3 Shields from ${ctx.source.name}'s ${getPictoName("shielding-death")}!`,
        appliedEffects: effects
    };
});

/**
 * Protecting Death
 * "On death, allies gain Shell."
 */
registerPictoEffect("protecting-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    const effects = [];
    for (const ally of allies) {
        await applyStatus(ally.battleID, "Protected", 0, 3);
        effects.push({
            targetId: ally.battleID,
            effect: "Protected" as StatusType,
            duration: 3,
            amount: 0
        });
    }

    return {
        success: true,
        message: `All allies gained Shell from ${ctx.source.name}'s ${getPictoName("protecting-death")}!`,
        appliedEffects: effects
    };
});

/**
 * Empowering Death
 * "On death, allies gain Powerful."
 */
registerPictoEffect("empowering-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const allies = ctx.allCharacters.filter(
        c => c.isEnemy === ctx.source.isEnemy && c.battleID !== ctx.source.battleID && c.healthPoints > 0
    );

    const effects = [];
    for (const ally of allies) {
        await applyStatus(ally.battleID, "Empowered", 0, 3);
        effects.push({
            targetId: ally.battleID,
            effect: "Empowered" as StatusType,
            duration: 3,
            amount: 0
        });
    }

    return {
        success: true,
        message: `All allies gained Powerful from ${ctx.source.name}'s ${getPictoName("empowering-death")}!`,
        appliedEffects: effects
    };
});

/**
 * Burning Death
 * "Apply 3 Burn to all enemies on Death."
 */
registerPictoEffect("burning-death", async (ctx) => {
    if (ctx.trigger !== "on-death") {
        return { success: false };
    }

    const enemies = ctx.allCharacters.filter(
        c => c.isEnemy !== ctx.source.isEnemy && c.healthPoints > 0
    );

    const effects = [];
    for (const enemy of enemies) {
        await applyStatus(enemy.battleID, "Burning", 3, 3);
        effects.push({
            targetId: enemy.battleID,
            effect: "Burning" as StatusType,
            duration: 3,
            amount: 3
        });
    }

    return {
        success: true,
        message: `All enemies burned from ${ctx.source.name}'s ${getPictoName("burning-death")}!`,
        appliedEffects: effects
    };
});

// ==================== BREAK EFFECTS ====================

/**
 * Quick Break
 * "Play again on Breaking a target."
 */
registerPictoEffect("quick-break", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation
    return {
        success: false,
        message: "Quick Break requires backend implementation"
    };
});

/**
 * Empowering Break
 * "Gain Powerful on Breaking a target."
 */
registerPictoEffect("empowering-break", async (ctx) => {
    if (ctx.trigger !== "on-break") {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("empowering-break")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Marking Break
 * "Apply Mark on Break."
 */
registerPictoEffect("marking-break", async (ctx) => {
    if (ctx.trigger !== "on-break" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Marked", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} was marked by ${getPictoName("marking-break")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Marked",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Slowing Break
 * "Apply Slow on Break."
 */
registerPictoEffect("slowing-break", async (ctx) => {
    if (ctx.trigger !== "on-break" || !ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Slowed", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} was slowed by ${getPictoName("slowing-break")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Slowed",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Fueling Break
 * "Breaking a target doubles its Burn amount."
 */
registerPictoEffect("fueling-break", async (_ctx) => {
    // NOTE: Requires backend implementation to modify burn stacks
    return {
        success: false,
        message: "Fueling Break requires backend implementation"
    };
});

/**
 * Breaker
 * "25% increased Break damage."
 */
registerPictoEffect("breaker", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Breaker requires backend implementation"
    };
});

/**
 * Critical Break
 * "25% increased Break damage on Critical hits."
 */
registerPictoEffect("critical-break", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Break requires backend implementation"
    };
});

/**
 * Breaking Burn
 * "25% increased Break damage on Burning enemies."
 */
registerPictoEffect("breaking-burn", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Breaking Burn requires backend implementation"
    };
});

// ==================== MARK EFFECTS ====================

/**
 * Powerful Mark
 * "Gain Powerful on hitting a Marked enemy."
 */
registerPictoEffect("powerful-mark", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    const isMarked = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Marked");
    if (!isMarked) {
        return { success: false };
    }

    await applyStatus(ctx.source.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.source.name} gained Powerful from ${getPictoName("powerful-mark")}!`,
        appliedEffects: [{
            targetId: ctx.source.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Burning Mark
 * "Apply Burn on hitting a Marked enemy."
 */
registerPictoEffect("burning-mark", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    const isMarked = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Marked");
    if (!isMarked) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Burning", 1, 3);

    return {
        success: true,
        message: `${ctx.target.name} was burned by ${getPictoName("burning-mark")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Burning",
            duration: 3,
            amount: 1
        }]
    };
});

/**
 * Stay Marked
 * "50% chance to apply Mark when attacking a Marked target."
 */
registerPictoEffect("stay-marked", async (ctx) => {
    if (ctx.trigger !== "on-attack" || !ctx.target) {
        return { success: false };
    }

    const isMarked = ctx.target.status?.some((s: StatusResponse) => s.effectName === "Marked");
    if (!isMarked) {
        return { success: false };
    }

    if (!rollChance(50)) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Marked", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} stayed marked by ${getPictoName("stay-marked")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Marked",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Charybde To Scylla
 * "Apply Mark on Stun removed."
 */
registerPictoEffect("charybde-to-scylla", async (_ctx) => {
    // NOTE: Requires backend implementation to detect status removal
    return {
        success: false,
        message: "Charybde To Scylla requires backend implementation"
    };
});

/**
 * Double Mark
 * "Mark requires 1 more hit to be removed."
 * NOTE: This is a passive modifier checked when Mark is applied/removed
 */
registerPictoEffect("double-mark", async (ctx) => {
    // This is a passive modifier - when applying Mark status,
    // the system should check for this picto and apply 2 stacks instead of 1
    if (ctx.trigger === "on-apply-status" && ctx.additionalData?.statusApplied === "Marked") {
        // Apply an additional Mark stack
        if (ctx.target) {
            await applyStatus(ctx.target.battleID, "Marked", 1, undefined);
            return {
                success: true,
                message: `${ctx.source.name}'s ${getPictoName("double-mark")} applied an extra Mark stack!`
            };
        }
    }
    return { success: false };
});

/**
 * Enfeebling Mark
 * "Marked targets deal 30% less damage."
 */
registerPictoEffect("enfeebling-mark", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Enfeebling Mark requires backend implementation"
    };
});

// ==================== BURN EFFECTS ====================

/**
 * Double Burn
 * "On applying a Burn stack, apply a second one."
 */
registerPictoEffect("double-burn", async (ctx) => {
    if (ctx.trigger === "on-apply-status" && ctx.additionalData?.statusApplied === "Burning") {
        // Apply an additional Burn stack
        if (ctx.target) {
            await applyStatus(ctx.target.battleID, "Burning", 1, 3);
            return {
                success: true,
                message: `${ctx.source.name}'s ${getPictoName("double-burn")} applied an extra Burn stack!`,
                appliedEffects: [{
                    targetId: ctx.target.battleID,
                    effect: "Burning",
                    duration: 3,
                    amount: 1
                }]
            };
        }
    }
    return { success: false };
});

/**
 * Longer Burn
 * "Burn duration is increased by 2."
 * NOTE: This is a passive modifier - when applying Burn, add +2 to duration
 */
registerPictoEffect("longer-burn", async (ctx) => {
    // This is a passive modifier - when applying Burn status,
    // the system should check for this picto and add +2 turns to the duration
    if (ctx.trigger === "on-apply-status" && ctx.additionalData?.statusApplied === "Burning") {
        if (ctx.target) {
            // Extend the burn duration by 2 turns
            await APIBattle.extendStatusDuration(ctx.target.battleID, "Burning", 2);
            return {
                success: true,
                message: `${ctx.source.name}'s ${getPictoName("longer-burn")} extended the burn duration!`
            };
        }
    }
    return { success: false };
});

/**
 * Burn Affinity
 * "25% increased damage on Burning targets."
 */
registerPictoEffect("burn-affinity", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Burn Affinity requires backend implementation"
    };
});

/**
 * Frozen Affinity
 * "25% increased damage on Frozen targets."
 */
registerPictoEffect("frozen-affinity", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Frozen Affinity requires backend implementation"
    };
});

/**
 * Critical Burn
 * "25% increased Critical Chance on Burning enemies."
 */
registerPictoEffect("critical-burn", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Burn requires backend implementation"
    };
});

// ==================== BUFF SYNERGY ====================

/**
 * Powerful On Shell
 * "Apply Powerful on applying Shell."
 */
registerPictoEffect("powerful-on-shell", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Protected") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Empowered", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Powerful from ${getPictoName("powerful-on-shell")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Empowered",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Rush On Powerful
 * "Apply Rush on applying Powerful."
 */
registerPictoEffect("rush-on-powerful", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Empowered") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Hastened", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Rush from ${getPictoName("rush-on-powerful")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Hastened",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Shell On Rush
 * "Apply Shell on applying Rush."
 */
registerPictoEffect("shell-on-rush", async (ctx) => {
    if (ctx.trigger !== "on-apply-status") {
        return { success: false };
    }

    if (ctx.additionalData?.statusApplied !== "Hastened") {
        return { success: false };
    }

    if (!ctx.target) {
        return { success: false };
    }

    await applyStatus(ctx.target.battleID, "Protected", 0, 3);

    return {
        success: true,
        message: `${ctx.target.name} gained Shell from ${getPictoName("shell-on-rush")}!`,
        appliedEffects: [{
            targetId: ctx.target.battleID,
            effect: "Protected",
            duration: 3,
            amount: 0
        }]
    };
});

/**
 * Longer Rush
 * "On applying Rush, its duration is increased by 2."
 */
registerPictoEffect("longer-rush", async (_ctx) => {
    // NOTE: Passive duration modifier requiring backend implementation
    return {
        success: false,
        message: "Longer Rush requires backend implementation"
    };
});

// ==================== PASSIVE MODIFIERS (REQUIRE BACKEND) ====================

// These pictos require backend implementation as they modify game mechanics:

/**
 * First Strike
 * "Play first."
 * NOTE: This should be handled during initiative calculation
 */
registerPictoEffect("first-strike", async (ctx) => {
    // This effect is passive - it affects initiative order
    // The initiative system should check for this picto and set playFirst to true
    if (ctx.trigger === "on-battle-start") {
        return {
            success: true,
            message: `${ctx.source.name} has ${getPictoName("first-strike")}! Will play first.`
        };
    }
    return { success: false };
});

/**
 * Cheater
 * "Always play twice in a row."
 */
registerPictoEffect("cheater", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation
    return {
        success: false,
        message: "Cheater requires backend implementation"
    };
});

/**
 * Faster Than Strong
 * "Always play twice in a row, but deal 50% less damage."
 */
registerPictoEffect("faster-than-strong", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation and damage modification
    return {
        success: false,
        message: "Faster Than Strong requires backend implementation"
    };
});

/**
 * Teamwork
 * "10% increased damage while all allies are alive."
 */
registerPictoEffect("teamwork", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Teamwork requires backend implementation"
    };
});

/**
 * The One
 * "Max Health is reduced to 1."
 */
registerPictoEffect("the-one", async (_ctx) => {
    // NOTE: Requires backend implementation for max health modification
    return {
        success: false,
        message: "The One requires backend implementation"
    };
});

/**
 * Hazardous Choice
 * "33% chance to skip own turn, but deal 50% more damage."
 */
registerPictoEffect("hazardous-choice", async (_ctx) => {
    // NOTE: Requires backend implementation for turn skipping and damage modification
    return {
        success: false,
        message: "Hazardous Choice requires backend implementation"
    };
});

/**
 * Augmented Counter I/II/III
 * "50% increased Counterattack damage."
 */
const registerAugmentedCounter = (name: string) => {
    registerPictoEffect(name, async (_ctx) => {
        // NOTE: Passive damage modifier requiring backend implementation
        return {
            success: false,
            message: `${name} requires backend implementation`
        };
    });
};

registerAugmentedCounter("Augmented Counter I");
registerAugmentedCounter("Augmented Counter II");
registerAugmentedCounter("Augmented Counter III");

/**
 * Back At You
 * "50% increased Counter Attack damage."
 */
registerPictoEffect("back-at-you", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Back At You requires backend implementation"
    };
});

/**
 * Powerful Shield
 * "10% increased damage per Shield Point on self."
 */
registerPictoEffect("powerful-shield", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Powerful Shield requires backend implementation"
    };
});

/**
 * Shield Breaker
 * "All hits break 1 more Shield."
 */
registerPictoEffect("shield-breaker", async (_ctx) => {
    // NOTE: Passive shield break modifier requiring backend implementation
    return {
        success: false,
        message: "Shield Breaker requires backend implementation"
    };
});

/**
 * Shield Affinity
 * "30% increased damage while having Shields, but receiving any damage always removes all Shields."
 */
registerPictoEffect("shield-affinity", async (_ctx) => {
    // NOTE: Requires backend implementation for conditional damage and shield removal
    return {
        success: false,
        message: "Shield Affinity requires backend implementation"
    };
});

/**
 * Warming Up
 * "5% increased damage per turn. Can stack up to 5 times."
 */
registerPictoEffect("warming-up", async (_ctx) => {
    // NOTE: Requires backend implementation with stacking buffs
    return {
        success: false,
        message: "Warming Up requires backend implementation"
    };
});

/**
 * Glass Canon
 * "Deal 25% more damage, but take 25% more damage."
 */
registerPictoEffect("glass-canon", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Glass Canon requires backend implementation"
    };
});

/**
 * Critical Moment
 * "50% increased Critical Chance if Health is below 30%."
 */
registerPictoEffect("critical-moment", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Moment requires backend implementation"
    };
});

/**
 * At Death's Door
 * "Deal 50% more damage if Health is below 10%."
 */
registerPictoEffect("at-deaths-door", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "At Death's Door requires backend implementation"
    };
});

/**
 * Full Strength
 * "25% increased damage on full Health."
 */
registerPictoEffect("full-strength", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Full Strength requires backend implementation"
    };
});

/**
 * Painted Power
 * "Damage can exceed 9,999."
 */
registerPictoEffect("painted-power", async (_ctx) => {
    // NOTE: Passive damage cap modifier requiring backend implementation
    return {
        success: false,
        message: "Painted Power requires backend implementation"
    };
});

/**
 * Exhausting Power
 * "50% increased damage if Exhausted."
 */
registerPictoEffect("exhausting-power", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Exhausting Power requires backend implementation"
    };
});

/**
 * Cursed Power
 * "30% increased damage while Cursed."
 */
registerPictoEffect("cursed-power", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Cursed Power requires backend implementation"
    };
});

/**
 * Confident Fighter
 * "30% increased damage, but can't be Healed."
 */
registerPictoEffect("confident-fighter", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Confident Fighter requires backend implementation"
    };
});

/**
 * Stun Boost
 * "30% increased damage on Stunned targets."
 */
registerPictoEffect("stun-boost", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Stun Boost requires backend implementation"
    };
});

/**
 * Roulette
 * "Every hit has a 50% chance to deal either 50% or 200% of its damage."
 */
registerPictoEffect("roulette", async (_ctx) => {
    // NOTE: Requires backend implementation for damage variance
    return {
        success: false,
        message: "Roulette requires backend implementation"
    };
});

/**
 * Soul Eater
 * "Deal 30% more damage, but lose 20% Health per turn."
 */
registerPictoEffect("soul-eater", async (ctx) => {
    if (ctx.trigger === "on-turn-start") {
        // const damageAmount = Math.floor(ctx.source.maxHealthPoints * 0.20);
        // NOTE: Requires backend implementation for self-damage
        return {
            success: false,
            message: "Soul Eater requires backend implementation for self-damage"
        };
    }
    // NOTE: Damage modifier requires backend implementation
    return {
        success: false,
        message: "Soul Eater requires backend implementation"
    };
});

/**
 * Painter
 * "Convert all Physical damage to Void damage."
 */
registerPictoEffect("painter", async (_ctx) => {
    // NOTE: Requires backend implementation for damage type conversion
    return {
        success: false,
        message: "Painter requires backend implementation"
    };
});

/**
 * Immaculate
 * "30% increased damage until a hit is received."
 */
registerPictoEffect("immaculate", async (_ctx) => {
    // NOTE: Requires backend implementation with damage tracking
    return {
        success: false,
        message: "Immaculate requires backend implementation"
    };
});

/**
 * Tainted
 * "15% increased damage for each Status Effect on self."
 */
registerPictoEffect("tainted", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Tainted requires backend implementation"
    };
});

/**
 * First Offensive
 * "First hit dealt and taken deals 50% more damage."
 */
registerPictoEffect("first-offensive", async (_ctx) => {
    // NOTE: Requires backend implementation with battle tracking
    return {
        success: false,
        message: "First Offensive requires backend implementation"
    };
});

/**
 * Pro Retreat
 * "Allows Flee to be instantaneous."
 */
registerPictoEffect("pro-retreat", async (_ctx) => {
    // NOTE: Requires backend implementation for flee mechanics
    return {
        success: false,
        message: "Pro Retreat requires backend implementation"
    };
});

/**
 * Greater Powerful
 * "+15% to Powerful damage increase."
 */
registerPictoEffect("greater-powerful", async (_ctx) => {
    // NOTE: Passive buff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Powerful requires backend implementation"
    };
});

/**
 * Greater Shell
 * "+10% to Shell damage reduction."
 */
registerPictoEffect("greater-shell", async (_ctx) => {
    // NOTE: Passive buff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Shell requires backend implementation"
    };
});

/**
 * Greater Rush
 * "+25% to Rush Speed increase."
 */
registerPictoEffect("greater-rush", async (_ctx) => {
    // NOTE: Passive buff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Rush requires backend implementation"
    };
});

/**
 * Greater Powerless
 * "+15% to Powerless damage reduction."
 */
registerPictoEffect("greater-powerless", async (_ctx) => {
    // NOTE: Passive debuff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Powerless requires backend implementation"
    };
});

/**
 * Greater Defenceless
 * "+15% to Defenceless damage amplification."
 */
registerPictoEffect("greater-defenceless", async (_ctx) => {
    // NOTE: Passive debuff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Defenceless requires backend implementation"
    };
});

/**
 * Greater Slow
 * "+15% to Slow Speed reduction."
 */
registerPictoEffect("greater-slow", async (_ctx) => {
    // NOTE: Passive debuff modifier requiring backend implementation
    return {
        success: false,
        message: "Greater Slow requires backend implementation"
    };
});

/**
 * Evasive Healer
 * "Heals provided are doubled until any damage is taken."
 */
registerPictoEffect("evasive-healer", async (_ctx) => {
    // NOTE: Requires backend implementation with damage tracking
    return {
        success: false,
        message: "Evasive Healer requires backend implementation"
    };
});

/**
 * Draining Cleanse
 * "Consume 1 AP to prevent Status Effects application, if possible."
 */
registerPictoEffect("draining-cleanse", async (_ctx) => {
    // NOTE: Requires backend implementation to intercept status effects
    return {
        success: false,
        message: "Draining Cleanse requires backend implementation"
    };
});

/**
 * Gradient Fighter
 * "25% increased damage with Gradient Attacks."
 */
registerPictoEffect("gradient-fighter", async (_ctx) => {
    // NOTE: Passive damage modifier requiring backend implementation
    return {
        success: false,
        message: "Gradient Fighter requires backend implementation"
    };
});

/**
 * Gradient Breaker
 * "50% increased Break damage with Gradient Attacks."
 */
registerPictoEffect("gradient-breaker", async (_ctx) => {
    // NOTE: Passive break modifier requiring backend implementation
    return {
        success: false,
        message: "Gradient Breaker requires backend implementation"
    };
});

/**
 * Post Gradient
 * "Play immediately after using a Gradient Attack."
 */
registerPictoEffect("post-gradient", async (_ctx) => {
    // NOTE: Requires backend implementation for turn order manipulation
    return {
        success: false,
        message: "Post Gradient requires backend implementation"
    };
});

/**
 * Charging Recovery
 * "50% increased Gradient Generation with Healing Skills."
 */
registerPictoEffect("charging-recovery", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Recovery requires backend implementation"
    };
});

/**
 * Charging Counter
 * "+10% of a Gradient Charge on Counterattack."
 */
registerPictoEffect("charging-counter", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Counter requires backend implementation"
    };
});

/**
 * Charging Weakness
 * "+15% of a Gradient Charge on hitting a Weakness. Once per turn."
 */
registerPictoEffect("charging-weakness", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Weakness requires backend implementation"
    };
});

/**
 * Charging Mark
 * "+20% of a Gradient Charge on hitting a Marked target. Once per turn."
 */
registerPictoEffect("charging-mark", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Mark requires backend implementation"
    };
});

/**
 * Charging Critical
 * "+20% of a Gradient Charge on Critical Hit. Once per turn."
 */
registerPictoEffect("charging-critical", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Critical requires backend implementation"
    };
});

/**
 * Charging Burn
 * "+20% of a Gradient Charge on applying Burn. Once per turn."
 */
registerPictoEffect("charging-burn", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Burn requires backend implementation"
    };
});

/**
 * Charging Stun
 * "+5% of a Gradient Charge on hitting a Stunned enemy."
 */
registerPictoEffect("charging-stun", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Stun requires backend implementation"
    };
});

/**
 * Charging Alteration
 * "+10% of a Gradient Charge on applying a Buff. Once per turn."
 */
registerPictoEffect("charging-alteration", async (_ctx) => {
    // NOTE: Requires backend implementation for gradient charging
    return {
        success: false,
        message: "Charging Alteration requires backend implementation"
    };
});

/**
 * The Best Defense
 * "Deal 50% more damage, but can't Parry or Dodge."
 */
registerPictoEffect("the-best-defense", async (_ctx) => {
    // NOTE: Requires backend implementation for defensive action blocking
    return {
        success: false,
        message: "The Best Defense requires backend implementation"
    };
});

/**
 * Passive Defense
 * "Reduce damage taken by 50%, but can't Parry or Dodge."
 */
registerPictoEffect("passive-defense", async (_ctx) => {
    // NOTE: Requires backend implementation for defensive action blocking
    return {
        success: false,
        message: "Passive Defense requires backend implementation"
    };
});

/**
 * Critical Weakness
 * "25% increased Critical Chance on Weakness."
 */
registerPictoEffect("critical-weakness", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Weakness requires backend implementation"
    };
});

/**
 * Critical Stun
 * "Increased critical hit chance against stunned enemies."
 */
registerPictoEffect("critical-stun", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Stun requires backend implementation"
    };
});

/**
 * Critical Vulnerability
 * "25% increased Critical Chance on Defenceless enemies."
 */
registerPictoEffect("critical-vulnerability", async (_ctx) => {
    // NOTE: Passive critical modifier requiring backend implementation
    return {
        success: false,
        message: "Critical Vulnerability requires backend implementation"
    };
});

// ==================== IMMUNITY PICTOS ====================
// ==================== ANTI STATUS IMMUNITY PICTOS ====================

/**
 * Anti-Status Pictos: Provide complete immunity to specific status effects
 * These pictos add an immunity entry to the battle character when equipped
 */

const antiStatusPictos: { name: string; statusType: string }[] = [
    { name: "Anti Bound", statusType: "Entangled" },
    { name: "Anti Curse", statusType: "Cursed" },
    { name: "Anti Dizzy", statusType: "Dizzy" },
    { name: "Anti Exhaust", statusType: "Exhausted" },
    { name: "Anti Inverted", statusType: "Inverted" },
    { name: "Anti-Blight", statusType: "Plagued" },
    { name: "Anti-Burn", statusType: "Burning" },
    { name: "Anti-Charm", statusType: "Confused" },
    { name: "Anti-Freeze", statusType: "Frozen" },
    { name: "Anti-Stun", statusType: "Stunned" }
];

antiStatusPictos.forEach(({ name, statusType }) => {
    registerPictoEffect(name, async (ctx) => {
        if (ctx.trigger === "on-battle-start") {
            // Add immunity for this status type
            await APIBattle.addImmunity(
                ctx.source.battleID,
                statusType,
                "immune"
            );
            return {
                success: true,
                message: `${ctx.source.name} is now immune to ${statusType} thanks to ${getPictoName(name)}!`
            };
        }
        return { success: false };
    });
});

// ==================== ENERGISING START PICTOS ====================

/**
 * Energising Start Pictos: Grant +1 AP at the start of battle
 * These are simple pictos that give 1 AP when the battle begins
 */

const energisingStartPictos = [
    "Energising Start I",
    "Energising Start II",
    "Energising Start III",
    "Energising Start IV"
];

energisingStartPictos.forEach((pictoName) => {
    registerPictoEffect(pictoName, async (ctx) => {
        if (ctx.trigger === "on-battle-start") {
            await giveMP(ctx.source.battleID, 1);
            return {
                success: true,
                message: `${ctx.source.name} gained +1 MP from ${getPictoName(pictoName)}!`
            };
        }
        return { success: false };
    });
});

// ==================== ELEMENTAL COAT PICTOS ====================

/**
 * Elemental Coat Pictos: Provide -50% damage from specific element types
 * These pictos add elemental resistance to reduce damage by half
 */

const elementalCoatPictos: { name: string; element: string }[] = [
    { name: "Physical Coat", element: "Physical" },
    { name: "Fire Coat", element: "Fire" },
    { name: "Ice Coat", element: "Ice" },
    { name: "Thunder Coat", element: "Lightning" },  // Thunder = Lightning
    { name: "Earth Coat", element: "Earth" },
    { name: "Light Coat", element: "Light" },
    { name: "Dark Coat", element: "Dark" },
    { name: "Void Coat", element: "Void" }  // Added for completeness
];

elementalCoatPictos.forEach(({ name, element }) => {
    registerPictoEffect(name, async (ctx) => {
        if (ctx.trigger === "on-battle-start") {
            // Add 50% resistance (multiplier 0.5 = half damage)
            await APIBattle.addResistance(
                ctx.source.battleID,
                element,
                "resist",  // resistance type
                0.5        // 50% damage (half)
            );
            return {
                success: true,
                message: `${ctx.source.name} now has ${element} resistance from ${getPictoName(name)}! Takes 50% less ${element} damage.`
            };
        }
        return { success: false };
    });
});

// ==================== DEAD ENERGY PICTOS ====================

/**
 * Dead Energy Pictos: Grant +3 AP when killing an enemy
 * These pictos reward the player for eliminating enemies
 */

const deadEnergyPictos = [
    "Dead Energy I",
    "Dead Energy II"
];

deadEnergyPictos.forEach((pictoName) => {
    registerPictoEffect(pictoName, async (ctx) => {
        if (ctx.trigger === "on-kill") {
            // Grant +3 AP for killing an enemy
            await giveMP(ctx.source.battleID, 3);
            return {
                success: true,
                message: `${ctx.source.name} gained +3 MP from ${getPictoName(pictoName)} for eliminating ${ctx.target?.name || "an enemy"}!`
            };
        }
        return { success: false };
    });
});

// ==================== AUGMENTED COUNTER ====================
// All three Augmented Counter pictos add +50% counterattack damage (multiplier 1.5)

const augmentedCounterPictos = [
    "Augmented Counter I",
    "Augmented Counter II",
    "Augmented Counter III"
];

augmentedCounterPictos.forEach((pictoName) => {
    registerPictoEffect(pictoName, async (ctx) => {
        if (ctx.trigger === "on-battle-start") {
            await APIBattle.addModifier(
                ctx.source.battleID,
                "counter",        // modifierType: applies to counterattacks
                1.5,              // multiplier: +50% damage (1.0 base + 0.5 bonus = 1.5x)
                0                 // flatBonus: none
            );
            return {
                success: true,
                message: `${ctx.source.name} now deals +50% counterattack damage from ${getPictoName(pictoName)}!`
            };
        }
        return { success: false };
    });
});

// ==================== COMBO ATTACK ====================
// All three Combo Attack pictos add +1 extra hit to Base Attacks
// NOTE: This requires integration in PlayerPage.tsx to check for this modifier
//       and increase hitCount from 1 to 2 when executing base attacks.
//
// Implementation approach:
// 1. Picto adds a modifier with type "base-attack" and flatBonus = 1 (representing +1 hit)
// 2. PlayerPage should call getModifiers() before base attack
// 3. If any active modifier has type "base-attack" and flatBonus > 0, add to hitCount
//
// Example integration in PlayerPage.tsx:
//   const modifiers = await APIBattle.getModifiers(source.battleID);
//   const comboModifiers = modifiers.filter(m => m.modifierType === "base-attack" && m.flatBonus > 0);
//   const extraHits = comboModifiers.reduce((sum, m) => sum + m.flatBonus, 0);
//   const hitCount = 1 + extraHits; // Base 1 hit + extra hits from pictos

const comboAttackPictos = [
    "Combo Attack I",
    "Combo Attack II",
    "Combo Attack III"
];

comboAttackPictos.forEach((pictoName) => {
    registerPictoEffect(pictoName, async (ctx) => {
        if (ctx.trigger === "on-battle-start") {
            await APIBattle.addModifier(
                ctx.source.battleID,
                "base-attack",    // modifierType: applies to base attacks
                1.0,              // multiplier: no damage change (1.0x = 100%)
                1                 // flatBonus: represents +1 extra hit (not damage bonus)
            );
            return {
                success: true,
                message: `${ctx.source.name}'s base attacks now have +1 extra hit from ${getPictoName(pictoName)}!`
            };
        }
        return { success: false };
    });
});

// ==================== EXPORT ====================

export {
    pictoEffectHandlers,
    applyStatus,
    isFightingAlone,
    allAlliesAlive,
    rollChance,
    giveMP,
    healCharacter
};
