import type { BattleCharacterInfo, StatusType } from "../../../api/ResponseModel";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { APIBattle } from "../../../api/APIBattle";
import { t } from "../../../i18n";
import { hasStatus } from "../../../utils/NpcCalculator";
import { getStatusStacks } from "../../../utils/BattleSkillUtils";

/**
 * Gets the total Foretell stacks on a target
 */
export function getForetellStacks(target: BattleCharacterInfo): number {
  return getStatusStacks(target, "Foretell");
}

/**
 * Gets the total Foretell count across all enemies in a battle
 */
export function getTotalForetellInBattle(
  allCharacters: BattleCharacterInfo[],
  sourceIsEnemy: boolean
): number {
  // Count Foretell on all enemies (opposite team from source)
  const enemies = allCharacters.filter(c => c.isEnemy !== sourceIsEnemy && c.healthPoints > 0);

  let totalForetell = 0;
  for (const enemy of enemies) {
    totalForetell += getForetellStacks(enemy);
  }

  return totalForetell;
}

/**
 * Consumes all Foretell from a target and returns the count
 */
export async function consumeForetell(
  target: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<number> {
  const stacks = getForetellStacks(target);

  if (stacks > 0) {
    // Remove all Foretell status
    await APIBattle.removeStatus(target.battleID, "Foretell");
    showToast(t("playerPage.skills.foretellConsumedCount", { count: stacks }));
  }

  return stacks;
}

/**
 * Consumes one Foretell per hit for bonus damage
 */
export async function consumeForetellPerHit(
  target: BattleCharacterInfo
): Promise<boolean> {
  const hadForetell = await APIBattle.consumeOneForetell(target.battleID);
  return hadForetell;
}

/**
 * Calculates damage bonus from consumed Foretell
 */
export function calculateForetellDamageBonus(
  consumedStacks: number,
  bonusPerStack: number = 2
): number {
  return consumedStacks * bonusPerStack;
}

/**
 * Calculates flat heal bonus from consumed Foretell
 */
export function calculateForetellHealBonus(
  consumedStacks: number,
  healBonusPerStack: number = 1
): number {
  // Returns flat bonus (e.g., +1 heal per stack)
  return consumedStacks * healBonusPerStack;
}

/**
 * Calculates flat damage bonus for per-hit Foretell consumption
 */
export function getForetellPerHitBonus(
  hadForetell: boolean,
  bonus: number = 4
): number {
  return hadForetell ? bonus : 0;
}

/**
 * Consumes all Foretell from ALL enemies (Our Sacrifice)
 */
export async function consumeForetellFromAllEnemies(
  allCharacters: BattleCharacterInfo[],
  sourceIsEnemy: boolean,
  showToast: (message: string) => void
): Promise<number> {
  const enemies = allCharacters.filter(c => c.isEnemy !== sourceIsEnemy && c.healthPoints > 0);

  let totalConsumed = 0;

  for (const enemy of enemies) {
    const stacks = getForetellStacks(enemy);
    if (stacks > 0) {
      await APIBattle.removeStatus(enemy.battleID, "Foretell");
      totalConsumed += stacks;
    }
  }

  if (totalConsumed > 0) {
    showToast(t("playerPage.skills.foretellConsumedFromAll", { count: totalConsumed }));
  }

  return totalConsumed;
}

/**
 * Propagates Foretell from target to all other enemies (Card Weaver)
 * Reads target's Foretell count and grants the same amount to each other enemy, respecting the cap.
 * Does NOT remove Foretell from the target.
 */
export async function redistributeForetell(
  target: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<void> {
  const foretellStacks = getForetellStacks(target);

  if (foretellStacks === 0) {
    showToast(t("playerPage.skills.noForetellToRedistribute"));
    return;
  }

  // Find other enemies (same team as target, not the target itself)
  const otherEnemies = allCharacters.filter(
    c => c.isEnemy === target.isEnemy &&
      c.battleID !== target.battleID &&
      c.healthPoints > 0
  );

  if (otherEnemies.length === 0) {
    showToast(t("playerPage.skills.noOtherEnemiesToRedistribute"));
    return;
  }

  const cap = getTwilightForetellCap(source);

  for (const enemy of otherEnemies) {
    const currentStacks = getForetellStacks(enemy);
    const stacksToAdd = Math.min(foretellStacks, cap - currentStacks);

    if (stacksToAdd > 0) {
      await APIBattle.addStatus({
        battleCharacterId: enemy.battleID,
        effectType: "Foretell",
        ammount: stacksToAdd,
        remainingTurns: 0,
        sourceCharacterId: source.battleID,
      });
    }
  }

  showToast(t("playerPage.skills.foretellRedistributed", { count: foretellStacks, enemies: otherEnemies.length }));
}

/**
 * Grants extra turn indicator (Card Weaver - just shows toast, backend handles turn order)
 */
export function notifyExtraTurn(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): void {
  showToast(t("playerPage.skills.extraTurnGranted", { name: source.name }));
}

/**
 * Drains all allies HP to 1 (Our Sacrifice)
 * Returns total HP drained for damage bonus
 */
export async function drainAlliesHp(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  showToast: (message: string) => void
): Promise<number> {
  // Find all allies (same team as source, including self)
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.healthPoints > 0
  );

  let totalDrained = 0;

  for (const ally of allies) {
    const hpToDrain = ally.healthPoints - 1;
    if (hpToDrain > 0) {
      await APIBattle.updateCharacterHp(ally.battleID, 1);
      totalDrained += hpToDrain;
    }
  }

  showToast(t("playerPage.skills.hpDrained", { amount: totalDrained }));

  return totalDrained;
}

/**
 * Grants MP to ally with lowest MP% per Foretell consumed (Plentiful Harvest)
 */
export async function grantMpPerForetell(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  consumedForetell: number,
  mpPerForetell: number,
  showToast: (message: string) => void
): Promise<void> {
  if (consumedForetell === 0) return;

  // Find ally with lowest MP%
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy &&
      c.battleID !== source.battleID &&
      c.healthPoints > 0 &&
      (c.maxMagicPoints ?? 0) > 0
  );

  if (allies.length === 0) return;

  let lowestMpAlly = allies[0];
  let lowestMpPercent = (lowestMpAlly.magicPoints ?? 0) / (lowestMpAlly.maxMagicPoints ?? 1);

  for (const ally of allies) {
    const mpPercent = (ally.magicPoints ?? 0) / (ally.maxMagicPoints ?? 1);
    if (mpPercent < lowestMpPercent) {
      lowestMpPercent = mpPercent;
      lowestMpAlly = ally;
    }
  }

  const mpToGrant = consumedForetell * mpPerForetell;
  const currentMp = lowestMpAlly.magicPoints ?? 0;
  const maxMp = lowestMpAlly.maxMagicPoints ?? 99;
  const newMp = Math.min(currentMp + mpToGrant, maxMp);

  await APIBattle.updateCharacterMp(lowestMpAlly.battleID, newMp);
  showToast(t("playerPage.skills.mpGrantedToLowest", { name: lowestMpAlly.name, amount: mpToGrant }));
}

/**
 * Propagates damage to other burning enemies (Searing Bond)
 */
export async function propagateBurnDamage(
  target: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  source: BattleCharacterInfo,
  damage: number,
  damagePercent: number = 50,
  foretellAmount: number = 1,
  showToast: (message: string) => void
): Promise<void> {
  // Find other burning enemies (same team as target, not the target itself)
  const otherBurningEnemies = allCharacters.filter(
    c => c.isEnemy === target.isEnemy &&
      c.battleID !== target.battleID &&
      c.healthPoints > 0 &&
      hasStatus(c, "Burning")
  );

  if (otherBurningEnemies.length === 0) return;

  const propagatedDamage = Math.floor(damage * (damagePercent / 100));
  const cap = getTwilightForetellCap(source);

  for (const enemy of otherBurningEnemies) {
    // Deal propagated damage
    const newHp = Math.max(0, enemy.healthPoints - propagatedDamage);
    await APIBattle.updateCharacterHp(enemy.battleID, newHp);

    // Apply Foretell (same amount as primary target, respecting cap)
    const currentStacks = getForetellStacks(enemy);
    const stacksToAdd = Math.min(foretellAmount, cap - currentStacks);
    if (stacksToAdd > 0) {
      await APIBattle.addStatus({
        battleCharacterId: enemy.battleID,
        effectType: "Foretell",
        ammount: stacksToAdd,
        remainingTurns: 0,
        sourceCharacterId: source.battleID,
      });
    }
  }

  showToast(t("playerPage.skills.burnDamagePropagated", {
    damage: propagatedDamage,
    count: otherBurningEnemies.length
  }));
}

/**
 * Cleanses all debuffs from target and copies buffs to other allies (Dark Cleansing)
 */
export async function cleansesAndCopiesBuffs(
  target: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<void> {
  // First, cleanse target
  await APIBattle.cleanse(target.battleID);

  // Get target's buffs to copy
  const buffs = target.status?.filter(s => {
    const buffTypes: StatusType[] = ["Empowered", "Regeneration", "Shield", "Haste", "Protected"];
    return buffTypes.includes(s.effectName as StatusType);
  }) ?? [];

  if (buffs.length === 0) {
    showToast(t("playerPage.skills.cleansedNoBufs", { name: target.name }));
    return;
  }

  // Find other allies (same team, not source, not target)
  const otherAllies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy &&
      c.battleID !== source.battleID &&
      c.battleID !== target.battleID &&
      c.healthPoints > 0
  );

  // Copy buffs to other allies
  for (const ally of otherAllies) {
    for (const buff of buffs) {
      await APIBattle.addStatus({
        battleCharacterId: ally.battleID,
        effectType: buff.effectName as StatusType,
        ammount: buff.ammount ?? 0,
        remainingTurns: buff.remainingTurns ?? 3,
        sourceCharacterId: source.battleID,
      });
    }
  }

  showToast(t("playerPage.skills.buffsCopied", { count: buffs.length, allies: otherAllies.length }));
}

/**
 * Applies additional Foretell on critical hits (Spectral Sweep)
 */
export async function applyForetellOnCrit(
  target: BattleCharacterInfo,
  source: BattleCharacterInfo,
  foretellAmount: number,
  showToast: (message: string) => void
): Promise<void> {
  await APIBattle.addStatus({
    battleCharacterId: target.battleID,
    effectType: "Foretell",
    ammount: foretellAmount,
    remainingTurns: 0,
    sourceCharacterId: source.battleID,
  });

  showToast(t("playerPage.skills.foretellAppliedOnCrit", { count: foretellAmount }));
}

/**
 * Grants MP to an ally (Intervention)
 */
export async function grantMpToAlly(
  target: BattleCharacterInfo,
  mpAmount: number,
  showToast: (message: string) => void
): Promise<void> {
  const currentMp = target.magicPoints ?? 0;
  const maxMp = target.maxMagicPoints ?? 99;
  const newMp = Math.min(currentMp + mpAmount, maxMp);

  await APIBattle.updateCharacterMp(target.battleID, newMp);
  showToast(t("playerPage.skills.mpGrantedToAlly", { name: target.name, amount: mpAmount }));
}

/**
 * Delays a target's turn (Delaying Slash)
 */
export async function delayTargetTurn(
  target: BattleCharacterInfo,
  delayAmount: number,
  showToast: (message: string) => void
): Promise<void> {
  await APIBattle.delayTurn(target.battleID, delayAmount);
  showToast(t("playerPage.skills.turnDelayedAmount", { name: target.name, amount: delayAmount }));
}

/**
 * Extends Twilight status duration (Twilight Dance)
 */
export async function extendTwilight(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<void> {
  if (!hasStatus(source, "Twilight")) return;

  await APIBattle.extendStatusDuration(source.battleID, "Twilight", 1);
  showToast(t("playerPage.skills.twilightExtended"));
}

/**
 * Calculates damage scaling with total Foretell in battle (End Slice)
 */
export function calculateForetellScalingBonus(
  allCharacters: BattleCharacterInfo[],
  sourceIsEnemy: boolean
): number {
  const totalForetell = getTotalForetellInBattle(allCharacters, sourceIsEnemy);
  // Each Foretell adds +1 damage or some multiplier
  return totalForetell;
}

/**
 * Grants +1 MP per Foretell consumed (universal Sciel mechanic)
 */
export async function grantMpFromForetell(
  source: BattleCharacterInfo,
  consumedCount: number,
  showToast: (message: string) => void
): Promise<void> {
  if (consumedCount <= 0) return;

  const currentMp = source.magicPoints ?? 0;
  const maxMp = source.maxMagicPoints ?? 99;
  const newMp = Math.min(currentMp + consumedCount, maxMp);

  await APIBattle.updateCharacterMp(source.battleID, newMp);
  showToast(t("playerPage.skills.foretellMpGained", { amount: consumedCount }));
}

/**
 * Returns the Foretell cap: 10 normally, 20 during Twilight
 */
export function getTwilightForetellCap(source: BattleCharacterInfo): number {
  if (hasStatus(source, "Twilight")) {
    return 20;
  }
  return 10;
}
