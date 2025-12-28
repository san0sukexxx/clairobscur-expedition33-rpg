import type { BattleCharacterInfo, StatusType } from "../api/ResponseModel";
import { APIBattle } from "../api/APIBattle";

// ==================== WEAPON PASSIVE TYPES ====================

/**
 * Trigger events when weapon passive effects can activate
 */
export type WeaponPassiveTrigger =
  | "on-battle-start"
  | "on-turn-start"
  | "on-base-attack"
  | "on-skill-used"
  | "on-critical-hit"
  | "on-counterattack"
  | "on-damage-dealt"
  | "on-damage-taken"
  | "on-rank-change"
  | "on-stance-change"
  | "on-mask-change"
  | "on-break"
  | "on-free-aim"
  | "on-heal"
  | "on-stain-consumed"
  | "on-stain-generated"
  | "on-twilight-start"
  | "on-mark-applied"
  | "on-shield-gained"
  | "on-shield-broken"
  | "on-parry"
  | "on-revive"
  | "on-death"
  | "on-kill"
  | "on-gradient-use"
  | "on-ap-gain"
  | "on-burn-applied"
  | "on-buff-applied"
  | "on-debuff-applied";

/**
 * Context passed to weapon passive handlers
 */
export interface WeaponPassiveContext {
  trigger: WeaponPassiveTrigger;
  source: BattleCharacterInfo;
  target?: BattleCharacterInfo;
  allCharacters: BattleCharacterInfo[];
  weaponName: string;
  weaponLevel: number;
  battleId: number;
  additionalData?: {
    damageAmount?: number;
    healAmount?: number;
    criticalHit?: boolean;
    skillElement?: string;
    skillName?: string;
    skillType?: string; // "Physical", "Fire", "Ice", "Lightning", "Earth", "Light", "Dark"
    stainsConsumed?: string[];
    stainsGenerated?: string[];
    oldRank?: string;
    newRank?: string;
    oldStance?: string;
    newStance?: string;
    oldMask?: string;
    newMask?: string;
    shieldsBroken?: number;
    shieldsGained?: number;
    burnStacks?: number;
    foretellStacks?: number;
    sunCharges?: number;
    moonCharges?: number;
    apGained?: number;
    wasUpgradedSkill?: boolean;
    isTwilight?: boolean;
    isMoonPhase?: boolean;
    isSunPhase?: boolean;
    targetHasForetell?: boolean;
    targetMarked?: boolean;
    targetPowerless?: boolean;
    targetBurnStacks?: number;
    consecutiveTurnsWithoutDamage?: number;
  };
}

/**
 * Result of a weapon passive activation
 */
export interface WeaponPassiveResult {
  success: boolean;
  message?: string;
  modifiedDamage?: number;
  preventDeath?: boolean;
  extraTurn?: boolean;
  applyEffects?: {
    targetId: number;
    effect: StatusType;
    duration?: number;
    amount?: number;
  }[];
}

// ==================== WEAPON PASSIVE REGISTRY ====================

type WeaponPassiveHandler = (ctx: WeaponPassiveContext) => Promise<WeaponPassiveResult>;

const passiveHandlers = new Map<string, WeaponPassiveHandler>();

/**
 * Register a weapon passive handler
 * @param weaponName - Name of the weapon
 * @param passiveLevel - Level at which this passive unlocks (4, 10, or 20)
 * @param handler - Handler function for the passive
 */
export function registerWeaponPassive(
  weaponName: string,
  passiveLevel: number,
  handler: WeaponPassiveHandler
): void {
  const key = `${weaponName.toLowerCase()}-L${passiveLevel}`;
  passiveHandlers.set(key, handler);
}

/**
 * Execute weapon passive effects for a given trigger
 * @param trigger - The event that triggered the effects
 * @param source - Character with the weapon equipped
 * @param allCharacters - All characters in battle
 * @param battleId - Battle ID for API calls
 * @param weaponName - Name of the equipped weapon
 * @param weaponLevel - Current level of the weapon
 * @param target - Target of the action (if applicable)
 * @param additionalData - Extra context data
 */
export async function executeWeaponPassives(
  trigger: WeaponPassiveTrigger,
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  battleId: number,
  weaponName: string,
  weaponLevel: number,
  target?: BattleCharacterInfo,
  additionalData?: WeaponPassiveContext["additionalData"]
): Promise<WeaponPassiveResult[]> {
  const results: WeaponPassiveResult[] = [];

  // Execute passives for levels that have been unlocked
  const unlockedLevels = [4, 10, 20].filter(level => weaponLevel >= level);

  for (const level of unlockedLevels) {
    const key = `${weaponName.toLowerCase()}-L${level}`;
    const handler = passiveHandlers.get(key);

    if (handler) {
      try {
        const result = await handler({
          trigger,
          source,
          target,
          allCharacters,
          weaponName,
          weaponLevel,
          battleId,
          additionalData
        });

        if (result.success) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error executing weapon passive ${key}:`, error);
        results.push({
          success: false,
          message: `Failed to execute ${weaponName} passive (Level ${level})`
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
 * Heal a character
 */
async function healCharacter(targetId: number, amount: number): Promise<void> {
  await APIBattle.heal(targetId, amount);
}

/**
 * Deal damage to a character
 */
async function dealDamage(targetId: number, amount: number): Promise<void> {
  // TODO: Implement damage dealing in APIBattle
  console.log(`[Weapon Passive] Dealing ${amount} damage to character ${targetId}`);
}

/**
 * Give AP to a character
 */
async function giveAP(targetId: number, amount: number): Promise<void> {
  // TODO: Implement AP system in backend
  console.log(`[Weapon Passive] Giving ${amount} AP to character ${targetId}`);
}

/**
 * Roll percentage chance (0-100)
 */
function rollChance(percentage: number): boolean {
  return Math.random() * 100 < percentage;
}

/**
 * Get all allies of a character
 */
function getAllies(source: BattleCharacterInfo, allCharacters: BattleCharacterInfo[]): BattleCharacterInfo[] {
  return allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.battleID !== source.battleID
  );
}

/**
 * Get all enemies of a character
 */
function getEnemies(source: BattleCharacterInfo, allCharacters: BattleCharacterInfo[]): BattleCharacterInfo[] {
  return allCharacters.filter(c => c.isEnemy !== source.isEnemy);
}

/**
 * Track effect activation usage (for once-per-battle effects)
 */
const effectActivationTracker: Record<string, Set<string>> = {};

function canActivateEffect(
  battleId: number,
  characterId: number,
  effectName: string,
  limitType: "once-per-battle" | "once-per-turn"
): boolean {
  const key = `${battleId}-${characterId}-${effectName}`;
  const trackerKey = `${battleId}-${limitType}`;

  if (!effectActivationTracker[trackerKey]) {
    effectActivationTracker[trackerKey] = new Set();
  }

  return !effectActivationTracker[trackerKey].has(key);
}

function trackEffectActivation(
  battleId: number,
  characterId: number,
  effectName: string,
  limitType: "once-per-battle" | "once-per-turn"
): void {
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
export function clearBattleWeaponTracking(battleId: number): void {
  Object.keys(effectActivationTracker).forEach(key => {
    if (key.startsWith(`${battleId}-`)) {
      delete effectActivationTracker[key];
    }
  });
}

/**
 * Clear once-per-turn effects at the start of each turn
 */
export function clearTurnWeaponTracking(battleId: number): void {
  const trackerKey = `${battleId}-once-per-turn`;
  if (effectActivationTracker[trackerKey]) {
    effectActivationTracker[trackerKey].clear();
  }
}

/**
 * Track stacking effects (for effects that can stack multiple times)
 */
const stackingEffects: Record<string, number> = {};

function getStacks(battleId: number, characterId: number, effectName: string): number {
  const key = `${battleId}-${characterId}-${effectName}`;
  return stackingEffects[key] || 0;
}

function addStack(battleId: number, characterId: number, effectName: string, maxStacks?: number): number {
  const key = `${battleId}-${characterId}-${effectName}`;
  const currentStacks = stackingEffects[key] || 0;
  const newStacks = Math.min(currentStacks + 1, maxStacks || 999);
  stackingEffects[key] = newStacks;
  return newStacks;
}

function resetStacks(battleId: number, characterId: number, effectName: string): void {
  const key = `${battleId}-${characterId}-${effectName}`;
  stackingEffects[key] = 0;
}

function setStacks(battleId: number, characterId: number, effectName: string, stacks: number): void {
  const key = `${battleId}-${characterId}-${effectName}`;
  stackingEffects[key] = stacks;
}

/**
 * Clear stacking effects for a battle
 */
export function clearBattleStackingEffects(battleId: number): void {
  Object.keys(stackingEffects).forEach(key => {
    if (key.startsWith(`${battleId}-`)) {
      delete stackingEffects[key];
    }
  });
}

// ==================== WEAPON PASSIVES IMPLEMENTATION ====================
// Note: Passives are organized by weapon type (Swords, Lune, Maelle, Monoco, Sciel)

// ===== SWORDS =====

// Abysseram
registerWeaponPassive("Abysseram", 4, async (ctx) => {
  // "50% increased damage on Rank D. No damage increase on other ranks."
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "D" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5,
      message: `${ctx.source.name}'s Abysseram deals extra damage on Rank D!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Abysseram", 10, async (ctx) => {
  // "50% increased Base Attack damage."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5,
      message: `${ctx.source.name}'s Abysseram enhances Base Attack!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Abysseram", 20, async (ctx) => {
  // "On Rank D, recover 20% Health with Base Attack."
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "D") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.2);
    await healCharacter(ctx.source.battleID, healAmount);
    return {
      success: true,
      message: `${ctx.source.name} recovered ${healAmount} HP!`
    };
  }
  return { success: false };
});

// Baguette (used by all characters)
registerWeaponPassive("Baguette", 4, async (ctx) => {
  // "Kill self on battle start."
  if (ctx.trigger === "on-battle-start") {
    await dealDamage(ctx.source.battleID, ctx.source.healthPoints);
    return {
      success: true,
      message: `${ctx.source.name} was defeated by Baguette's curse!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Baguette", 10, async (ctx) => {
  // "Revive with 100% Health. Once per battle."
  if (ctx.trigger === "on-death") {
    if (canActivateEffect(ctx.battleId, ctx.source.battleID, "Baguette-Revive", "once-per-battle")) {
      await healCharacter(ctx.source.battleID, ctx.source.maxHealthPoints);
      trackEffectActivation(ctx.battleId, ctx.source.battleID, "Baguette-Revive", "once-per-battle");
      return {
        success: true,
        message: `${ctx.source.name} was revived by Baguette with full health!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Baguette", 20, async (ctx) => {
  // "Play first."
  // TODO: Implement turn order modification
  if (ctx.trigger === "on-battle-start") {
    return {
      success: true,
      message: `${ctx.source.name} will act first!`
    };
  }
  return { success: false };
});

// Blodam
registerWeaponPassive("Blodam", 4, async (ctx) => {
  // "Perfection is now based on current Health. Gain 1 Rank every 20% missing Health."
  // TODO: This requires modifying perfection calculation system
  if (ctx.trigger === "on-battle-start" || ctx.trigger === "on-damage-taken") {
    return {
      success: true,
      message: `${ctx.source.name}'s Perfection is based on missing Health!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Blodam", 10, async (ctx) => {
  // "20% increased Light damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Light" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2,
      message: `${ctx.source.name}'s Light Skill deals extra damage!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Blodam", 20, async (ctx) => {
  // "+1 AP on Rank Up."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.oldRank && ctx.additionalData?.newRank) {
    const rankOrder = ["D", "C", "B", "A", "S"];
    const oldIndex = rankOrder.indexOf(ctx.additionalData.oldRank);
    const newIndex = rankOrder.indexOf(ctx.additionalData.newRank);
    if (newIndex > oldIndex) {
      await giveAP(ctx.source.battleID, 1);
      return {
        success: true,
        message: `${ctx.source.name} gained 1 AP from ranking up!`
      };
    }
  }
  return { success: false };
});

// Chevalam
registerWeaponPassive("Chevalam", 4, async (ctx) => {
  // "Start battle at Rank S, but can't be Healed or gain Shields."
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set rank to S and apply healing/shield block
    return {
      success: true,
      message: `${ctx.source.name} starts at Rank S but cannot be healed or shielded!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Chevalam", 10, async (ctx) => {
  // "20% increased damage for each consecutive turn without taking damage. Can stack up to 5 times."
  if (ctx.trigger === "on-damage-taken") {
    resetStacks(ctx.battleId, ctx.source.battleID, "Chevalam-DamageStacks");
    return { success: true, message: `${ctx.source.name}'s damage stacks reset!` };
  }
  if (ctx.trigger === "on-turn-start") {
    const stacks = addStack(ctx.battleId, ctx.source.battleID, "Chevalam-DamageStacks", 5);
    return {
      success: true,
      message: `${ctx.source.name} has ${stacks} damage stack(s) (+${stacks * 20}% damage)!`
    };
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Chevalam-DamageStacks");
    if (stacks > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.2)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Chevalam", 20, async (ctx) => {
  // "Apply Rush on Rank S."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.newRank === "S") {
    await applyStatus(ctx.source.battleID, "Rush", 0, 3);
    return {
      success: true,
      message: `${ctx.source.name} gained Rush at Rank S!`
    };
  }
  return { success: false };
});

// Confuso
registerWeaponPassive("Confuso", 4, async (ctx) => {
  // "Light damage can Burn on Critical hits."
  if (ctx.trigger === "on-critical-hit" && ctx.additionalData?.skillElement === "Light" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 1, 3);
    return {
      success: true,
      message: `${ctx.target.name} was burned by ${ctx.source.name}'s critical Light attack!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Confuso", 10, async (ctx) => {
  // "Apply 3 Burn instead of Mark."
  // TODO: This requires intercepting Mark application
  if (ctx.trigger === "on-mark-applied" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 3, 3);
    return {
      success: true,
      message: `${ctx.source.name} applied 3 Burn instead of Mark!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Confuso", 20, async (ctx) => {
  // "Increase Burn damage by 50% per Rank, up to 300% on Rank S."
  // TODO: This requires modifying Burn damage calculation
  if (ctx.trigger === "on-burn-applied") {
    const rankMultipliers: Record<string, number> = { D: 1.5, C: 2.0, B: 2.5, A: 3.0, S: 4.0 };
    const multiplier = rankMultipliers[ctx.source.perfectionRank || "D"] || 1.0;
    return {
      success: true,
      message: `${ctx.source.name}'s Burn damage increased by ${((multiplier - 1) * 100).toFixed(0)}%!`
    };
  }
  return { success: false };
});

// Contorso
registerWeaponPassive("Contorso", 4, async (ctx) => {
  // "Switch to Rank S on Break. Base Attack can Break."
  if (ctx.trigger === "on-break") {
    // TODO: Set rank to S
    return {
      success: true,
      message: `${ctx.source.name} switched to Rank S!`
    };
  }
  if (ctx.trigger === "on-base-attack") {
    // TODO: Allow base attack to break shields
    return { success: true };
  }
  return { success: false };
});

registerWeaponPassive("Contorso", 10, async (ctx) => {
  // "100% Critical Chance on Rank S."
  // TODO: This requires modifying critical chance calculation
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "S") {
    return {
      success: true,
      message: `${ctx.source.name} has guaranteed criticals at Rank S!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Contorso", 20, async (ctx) => {
  // "Triggers a lightning strike on Critical hits."
  if (ctx.trigger === "on-critical-hit" && ctx.target) {
    const strikeDamage = Math.floor(ctx.source.might * 0.5);
    await dealDamage(ctx.target.battleID, strikeDamage);
    return {
      success: true,
      message: `A lightning strike hit ${ctx.target.name} for ${strikeDamage} damage!`
    };
  }
  return { success: false };
});

// Corpeso
registerWeaponPassive("Corpeso", 4, async (ctx) => {
  // "Base Attack applies 2 Burn stack per Rank."
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    const rankOrder = ["D", "C", "B", "A", "S"];
    const rankIndex = rankOrder.indexOf(ctx.source.perfectionRank || "D");
    const burnStacks = (rankIndex + 1) * 2;
    await applyStatus(ctx.target.battleID, "Burn", burnStacks, 3);
    return {
      success: true,
      message: `${ctx.source.name} applied ${burnStacks} Burn stacks!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Corpeso", 10, async (ctx) => {
  // "+1 AP on Rank Up."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.oldRank && ctx.additionalData?.newRank) {
    const rankOrder = ["D", "C", "B", "A", "S"];
    const oldIndex = rankOrder.indexOf(ctx.additionalData.oldRank);
    const newIndex = rankOrder.indexOf(ctx.additionalData.newRank);
    if (newIndex > oldIndex) {
      await giveAP(ctx.source.battleID, 1);
      return { success: true, message: `${ctx.source.name} gained 1 AP!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Corpeso", 20, async (ctx) => {
  // "Increase Burn damage by 50% per Rank, up to 300% on Rank S."
  // Same as Confuso L20
  if (ctx.trigger === "on-burn-applied") {
    const rankMultipliers: Record<string, number> = { D: 1.5, C: 2.0, B: 2.5, A: 3.0, S: 4.0 };
    const multiplier = rankMultipliers[ctx.source.perfectionRank || "D"] || 1.0;
    return {
      success: true,
      message: `${ctx.source.name}'s Burn damage increased by ${((multiplier - 1) * 100).toFixed(0)}%!`
    };
  }
  return { success: false };
});

// Cruleram
registerWeaponPassive("Cruleram", 4, async (ctx) => {
  // "Don't lose Rank when taking damage from Powerless enemies."
  if (ctx.trigger === "on-damage-taken" && ctx.additionalData?.targetPowerless) {
    // TODO: Prevent rank loss
    return {
      success: true,
      message: `${ctx.source.name} didn't lose Rank from Powerless enemy!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Cruleram", 10, async (ctx) => {
  // "+1 Perfection on hitting a Powerless enemy."
  if (ctx.trigger === "on-damage-dealt" && ctx.target && ctx.additionalData?.targetPowerless) {
    // TODO: Add perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Cruleram", 20, async (ctx) => {
  // "Apply Powerless on Counterattack."
  if (ctx.trigger === "on-counterattack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Powerless", 0, 2);
    return {
      success: true,
      message: `${ctx.target.name} was made Powerless!`
    };
  }
  return { success: false };
});

// Cultam
registerWeaponPassive("Cultam", 4, async (ctx) => {
  // "No Perfection loss on damage taken. Perfection is instead lost on being Healed."
  // TODO: This requires modifying perfection loss mechanics
  if (ctx.trigger === "on-damage-taken" || ctx.trigger === "on-heal") {
    return {
      success: true,
      message: `${ctx.source.name}'s perfection system is inverted!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Cultam", 10, async (ctx) => {
  // "Gain 2 AP on Counterattack."
  if (ctx.trigger === "on-counterattack") {
    await giveAP(ctx.source.battleID, 2);
    return {
      success: true,
      message: `${ctx.source.name} gained 2 AP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Cultam", 20, async (ctx) => {
  // "Gain 1 Rank on Counterattack."
  if (ctx.trigger === "on-counterattack") {
    // TODO: Increase rank by 1
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Rank!`
    };
  }
  return { success: false };
});

// Danseso
registerWeaponPassive("Danseso", 4, async (ctx) => {
  // "Base attack gives 1 Perfection per Burn on target."
  if (ctx.trigger === "on-base-attack" && ctx.target && ctx.additionalData?.targetBurnStacks) {
    // TODO: Add perfection based on burn stacks
    return {
      success: true,
      message: `${ctx.source.name} gained ${ctx.additionalData.targetBurnStacks} Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Danseso", 10, async (ctx) => {
  // "While Powerful, 20% chance to Burn on hit."
  if (ctx.trigger === "on-damage-dealt" && ctx.target) {
    // TODO: Check if source has Powerful status
    if (rollChance(20)) {
      await applyStatus(ctx.target.battleID, "Burn", 1, 3);
      return {
        success: true,
        message: `${ctx.target.name} was burned!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Danseso", 20, async (ctx) => {
  // "+1 AP on Rank Up."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.oldRank && ctx.additionalData?.newRank) {
    const rankOrder = ["D", "C", "B", "A", "S"];
    const oldIndex = rankOrder.indexOf(ctx.additionalData.oldRank);
    const newIndex = rankOrder.indexOf(ctx.additionalData.newRank);
    if (newIndex > oldIndex) {
      await giveAP(ctx.source.battleID, 1);
      return { success: true, message: `${ctx.source.name} gained 1 AP!` };
    }
  }
  return { success: false };
});

// Delaram
registerWeaponPassive("Delaram", 4, async (ctx) => {
  // "Start battle on Rank B, but 50% Health."
  if (ctx.trigger === "on-battle-start") {
    const halfHealth = Math.floor(ctx.source.maxHealthPoints * 0.5);
    await dealDamage(ctx.source.battleID, ctx.source.healthPoints - halfHealth);
    // TODO: Set rank to B
    return {
      success: true,
      message: `${ctx.source.name} starts at Rank B with 50% Health!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Delaram", 10, async (ctx) => {
  // "Recover 15% Health on Base Attack."
  if (ctx.trigger === "on-base-attack") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.15);
    await healCharacter(ctx.source.battleID, healAmount);
    return {
      success: true,
      message: `${ctx.source.name} recovered ${healAmount} HP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Delaram", 20, async (ctx) => {
  // "Apply Powerful on Rank B."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.newRank === "B") {
    await applyStatus(ctx.source.battleID, "Powerful", 0, 3);
    return {
      success: true,
      message: `${ctx.source.name} became Powerful!`
    };
  }
  return { success: false };
});

// Demonam
registerWeaponPassive("Demonam", 4, async (ctx) => {
  // "Casting a Light Skill increases damage of next Physical Skill cast by 50% and vice versa."
  if (ctx.trigger === "on-skill-used") {
    if (ctx.additionalData?.skillElement === "Light") {
      setStacks(ctx.battleId, ctx.source.battleID, "Demonam-PhysicalBoost", 1);
      return { success: true, message: `${ctx.source.name}'s next Physical Skill will deal 50% more damage!` };
    } else if (ctx.additionalData?.skillElement === "Physical") {
      setStacks(ctx.battleId, ctx.source.battleID, "Demonam-LightBoost", 1);
      return { success: true, message: `${ctx.source.name}'s next Light Skill will deal 50% more damage!` };
    }
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    if (ctx.additionalData.skillElement === "Physical" && getStacks(ctx.battleId, ctx.source.battleID, "Demonam-PhysicalBoost") > 0) {
      resetStacks(ctx.battleId, ctx.source.battleID, "Demonam-PhysicalBoost");
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.5 };
    } else if (ctx.additionalData.skillElement === "Light" && getStacks(ctx.battleId, ctx.source.battleID, "Demonam-LightBoost") > 0) {
      resetStacks(ctx.battleId, ctx.source.battleID, "Demonam-LightBoost");
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.5 };
    }
  }
  return { success: false };
});

registerWeaponPassive("Demonam", 10, async (ctx) => {
  // "20% increased Physical damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Physical" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Demonam", 20, async (ctx) => {
  // "Dealing Light damage with a Skill recovers 3% Health."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Light") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.03);
    await healCharacter(ctx.source.battleID, healAmount);
    return {
      success: true,
      message: `${ctx.source.name} recovered ${healAmount} HP!`
    };
  }
  return { success: false };
});

// Dreameso
registerWeaponPassive("Dreameso", 4, async (ctx) => {
  // "Gain 1 Rank on Counterattack."
  if (ctx.trigger === "on-counterattack") {
    // TODO: Increase rank by 1
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Rank!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Dreameso", 10, async (ctx) => {
  // "50% increased Counterattack damage."
  if (ctx.trigger === "on-counterattack" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

registerWeaponPassive("Dreameso", 20, async (ctx) => {
  // "Gain 2 AP on Counterattack."
  if (ctx.trigger === "on-counterattack") {
    await giveAP(ctx.source.battleID, 2);
    return {
      success: true,
      message: `${ctx.source.name} gained 2 AP!`
    };
  }
  return { success: false };
});

// Dualiso
registerWeaponPassive("Dualiso", 4, async (ctx) => {
  // "Play again after a Base Attack."
  if (ctx.trigger === "on-base-attack") {
    return {
      success: true,
      extraTurn: true,
      message: `${ctx.source.name} attacks again!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Dualiso", 10, async (ctx) => {
  // "50% increased Base Attack damage."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

registerWeaponPassive("Dualiso", 20, async (ctx) => {
  // "Base Attack gives 4 Perfection."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Add 4 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 4 Perfection!`
    };
  }
  return { success: false };
});

// Gaultaram
registerWeaponPassive("Gaultaram", 4, async (ctx) => {
  // "When hit, lose 1 Perfection instead of 1 Rank."
  if (ctx.trigger === "on-damage-taken") {
    // TODO: Modify perfection loss instead of rank loss
    return {
      success: true,
      message: `${ctx.source.name} lost 1 Perfection instead of 1 Rank!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Gaultaram", 10, async (ctx) => {
  // "Apply Rush on Rank S."
  if (ctx.trigger === "on-rank-change" && ctx.additionalData?.newRank === "S") {
    await applyStatus(ctx.source.battleID, "Rush", 0, 3);
    return {
      success: true,
      message: `${ctx.source.name} gained Rush!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Gaultaram", 20, async (ctx) => {
  // "Gain 2 Perfection on turn start."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Add 2 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 2 Perfection!`
    };
  }
  return { success: false };
});

// Gesam
registerWeaponPassive("Gesam", 4, async (ctx) => {
  // "Convert Light damage from Skills to Physical damage."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Light") {
    // TODO: Convert damage type
    return {
      success: true,
      message: `${ctx.source.name} converted Light damage to Physical!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Gesam", 10, async (ctx) => {
  // "20% increased Physical damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Physical" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Gesam", 20, async (ctx) => {
  // "-1 AP cost for Physical Skills."
  // TODO: This requires modifying AP cost calculation
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Physical") {
    return {
      success: true,
      message: `Physical Skill cost reduced!`
    };
  }
  return { success: false };
});

// Glaceso
registerWeaponPassive("Glaceso", 4, async (ctx) => {
  // "+1 Perfection on Critical hit."
  if (ctx.trigger === "on-critical-hit") {
    // TODO: Add 1 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Glaceso", 10, async (ctx) => {
  // "Self-Heal by 2% Health on dealing a Critical hit."
  if (ctx.trigger === "on-critical-hit") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.02);
    await healCharacter(ctx.source.battleID, healAmount);
    return {
      success: true,
      message: `${ctx.source.name} recovered ${healAmount} HP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Glaceso", 20, async (ctx) => {
  // "Counterattack is always a Critical hit."
  if (ctx.trigger === "on-counterattack") {
    // TODO: Force critical hit
    return {
      success: true,
      message: `${ctx.source.name}'s counterattack is a guaranteed critical!`
    };
  }
  return { success: false };
});

// Lanceram
registerWeaponPassive("Lanceram", 4, async (ctx) => {
  // "Rank can't be lower than C."
  // TODO: This requires modifying rank system
  if (ctx.trigger === "on-battle-start" || ctx.trigger === "on-rank-change") {
    return {
      success: true,
      message: `${ctx.source.name}'s minimum rank is C!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Lanceram", 10, async (ctx) => {
  // "Base Attack gives 4 Perfection."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Add 4 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 4 Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Lanceram", 20, async (ctx) => {
  // "Parrying gives 2 Perfection instead of 1."
  if (ctx.trigger === "on-parry") {
    // TODO: Add 2 perfection (instead of normal 1)
    return {
      success: true,
      message: `${ctx.source.name} gained 2 Perfection from parrying!`
    };
  }
  return { success: false };
});

// Liteso
registerWeaponPassive("Liteso", 4, async (ctx) => {
  // "Base Attack consumes all Shields to deal 100% increased damage per Shield."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    // TODO: Get shield count and consume them
    const shields = 0; // Placeholder
    if (shields > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + shields),
        message: `${ctx.source.name} consumed ${shields} shields for massive damage!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Liteso", 10, async (ctx) => {
  // "+1 Shield on Counterattack."
  if (ctx.trigger === "on-counterattack") {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Shield!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Liteso", 20, async (ctx) => {
  // "Base Attack gives 4 Perfection."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Add 4 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 4 Perfection!`
    };
  }
  return { success: false };
});

// Nosaram
registerWeaponPassive("Nosaram", 4, async (ctx) => {
  // "Double Perfection gained on Free Aim shots."
  if (ctx.trigger === "on-free-aim") {
    // TODO: Double perfection gained
    return {
      success: true,
      message: `${ctx.source.name} gained double Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Nosaram", 10, async (ctx) => {
  // "Free Aim shots break 2 Shields."
  if (ctx.trigger === "on-free-aim") {
    // TODO: Break 2 shields
    return {
      success: true,
      message: `${ctx.source.name} broke 2 Shields!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Nosaram", 20, async (ctx) => {
  // "50% increased Free Aim damage."
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

// Sakaram
registerWeaponPassive("Sakaram", 4, async (ctx) => {
  // "Can't lose Perfection. No damage increase from Rank."
  // TODO: This requires modifying perfection and rank damage systems
  if (ctx.trigger === "on-battle-start" || ctx.trigger === "on-damage-taken") {
    return {
      success: true,
      message: `${ctx.source.name} can't lose Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Sakaram", 10, async (ctx) => {
  // "50% increased Base Attack damage."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

registerWeaponPassive("Sakaram", 20, async (ctx) => {
  // "Base Attack gives 4 Perfection."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Add 4 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 4 Perfection!`
    };
  }
  return { success: false };
});

// Seeram
registerWeaponPassive("Seeram", 4, async (ctx) => {
  // "+1 to all Perfection gain but can't reach Rank S."
  // TODO: This requires modifying perfection gain and rank cap
  if (ctx.trigger === "on-battle-start") {
    return {
      success: true,
      message: `${ctx.source.name} gains +1 Perfection but can't reach Rank S!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Seeram", 10, async (ctx) => {
  // "Base Attack gives 4 Perfection."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Add 4 perfection
    return {
      success: true,
      message: `${ctx.source.name} gained 4 Perfection!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Seeram", 20, async (ctx) => {
  // "20% increased Light damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Light" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

// Simoso
registerWeaponPassive("Simoso", 4, async (ctx) => {
  // "An ethereal Sword deals Light damage on any damage dealt with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.target) {
    const bonusDamage = Math.floor(ctx.source.might * 0.3);
    await dealDamage(ctx.target.battleID, bonusDamage);
    return {
      success: true,
      message: `An ethereal sword dealt ${bonusDamage} Light damage!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Simoso", 10, async (ctx) => {
  // "20% chance to apply Burn on dealing Light damage."
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.skillElement === "Light" && ctx.target) {
    if (rollChance(20)) {
      await applyStatus(ctx.target.battleID, "Burn", 1, 3);
      return {
        success: true,
        message: `${ctx.target.name} was burned!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Simoso", 20, async (ctx) => {
  // "Can't die if at least Rank A."
  if (ctx.trigger === "on-death") {
    const rankOrder = ["D", "C", "B", "A", "S"];
    const rankIndex = rankOrder.indexOf(ctx.source.perfectionRank || "D");
    if (rankIndex >= 3) { // A or S
      return {
        success: true,
        preventDeath: true,
        message: `${ctx.source.name} survived with 1 HP!`
      };
    }
  }
  return { success: false };
});

// Sireso
registerWeaponPassive("Sireso", 4, async (ctx) => {
  // "Bonus damage from Perfection applies to all allies at half value. Bonus damage no longer applies to Verso."
  // TODO: This requires modifying damage calculation system globally
  if (ctx.trigger === "on-battle-start") {
    return {
      success: true,
      message: `${ctx.source.name} shares Perfection damage with allies!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Sireso", 10, async (ctx) => {
  // "Perfection gained is increased by 1 while Powerful."
  // TODO: Check if source has Powerful status and increase perfection gain
  if (ctx.trigger === "on-turn-start") {
    return {
      success: true,
      message: `${ctx.source.name} gains extra Perfection while Powerful!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Sireso", 20, async (ctx) => {
  // "Support Skills cost 1 less AP."
  // TODO: This requires modifying AP cost calculation
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Support") {
    return {
      success: true,
      message: `Support Skill cost reduced!`
    };
  }
  return { success: false };
});

// Tireso
registerWeaponPassive("Tireso", 4, async (ctx) => {
  // "Gain 1 Rank on applying Mark."
  if (ctx.trigger === "on-mark-applied") {
    // TODO: Increase rank by 1
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Rank!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Tireso", 10, async (ctx) => {
  // "Mark an enemy on Base Attack."
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Mark", 0, 3);
    return {
      success: true,
      message: `${ctx.target.name} was marked!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Tireso", 20, async (ctx) => {
  // "Apply Powerless on Marking an enemy."
  if (ctx.trigger === "on-mark-applied" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Powerless", 0, 2);
    return {
      success: true,
      message: `${ctx.target.name} was made Powerless!`
    };
  }
  return { success: false };
});

// Note: Noahram and Verleso have no passives (empty arrays)

// Export all helper functions for testing
export {
  applyStatus,
  healCharacter,
  dealDamage,
  giveAP,
  rollChance,
  getAllies,
  getEnemies,
  canActivateEffect,
  trackEffectActivation,
  getStacks,
  addStack,
  resetStacks,
  setStacks
};
