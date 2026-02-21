import type { BattleCharacterInfo, StatusType } from "../../../api/ResponseModel";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { APIBattle } from "../../../api/APIBattle";
import { t } from "../../../i18n";
import { hasStatus } from "../../../utils/NpcCalculator";
import { isMonoco } from "../../../constants/player/characterIds";

export type MaskType = "Almighty" | "Agile" | "Balanced" | "Heavy" | "Caster";

/**
 * Mask positions in the Bestial Wheel:
 * Position 0: Almighty (all bonuses)
 * Position 1-2: Agile
 * Position 3-4: Balanced
 * Position 5-6: Heavy
 * Position 7-8: Caster
 */
export function getCurrentMask(position: number | null | undefined): MaskType {
  if (position === null || position === undefined || position === 0) {
    return "Almighty";
  }

  const normalizedPosition = position % 9;

  if (normalizedPosition === 0) return "Almighty";
  if (normalizedPosition <= 2) return "Agile";
  if (normalizedPosition <= 4) return "Balanced";
  if (normalizedPosition <= 6) return "Heavy";
  return "Caster"; // 7-8
}

/**
 * Checks if character is at a specific mask position
 */
export function isAtMask(source: BattleCharacterInfo, maskType: MaskType): boolean {
  const currentMask = getCurrentMask(source.bestialWheelPosition);
  return currentMask === maskType || currentMask === "Almighty";
}

/**
 * Checks if character is at Caster or Almighty mask (for MP/healing bonuses)
 */
export function isAtCasterOrAlmighty(source: BattleCharacterInfo): boolean {
  const mask = getCurrentMask(source.bestialWheelPosition);
  return mask === "Caster" || mask === "Almighty";
}

/**
 * Checks if character is at Agile or Almighty mask (for break bar bonuses)
 */
export function isAtAgileOrAlmighty(source: BattleCharacterInfo): boolean {
  const mask = getCurrentMask(source.bestialWheelPosition);
  return mask === "Agile" || mask === "Almighty";
}

/**
 * Checks if character is at Heavy or Almighty mask (for shield bonuses)
 */
export function isAtHeavyOrAlmighty(source: BattleCharacterInfo): boolean {
  const mask = getCurrentMask(source.bestialWheelPosition);
  return mask === "Heavy" || mask === "Almighty";
}

export interface MaskBonuses {
  damageBonus: number;
  healingMultiplier: number;
  mpBonusGranted: number;
  shieldBonus: number;
  breakBarFillPercent: number;
  buffMultiplier: number;
}

/**
 * Gets mask-based flat damage bonus (only for characters with Bestial Wheel)
 */
export function getMaskDamageBonus(source: BattleCharacterInfo): number {
  // Only apply to characters that actually have the Bestial Wheel (Monoco)
  if (source.bestialWheelPosition === null || source.bestialWheelPosition === undefined) {
    return 0;
  }

  const mask = getCurrentMask(source.bestialWheelPosition);

  switch (mask) {
    case "Almighty":
      return 3;
    case "Caster":
      return 2;
    case "Agile":
      return 2;
    case "Heavy":
      return 2;
    case "Balanced":
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculates all mask bonuses for a skill
 */
export function calculateMaskBonuses(
  source: BattleCharacterInfo,
  metadata: SkillMetadata
): MaskBonuses {
  const bonuses: MaskBonuses = {
    damageBonus: isMonoco(source.id) ? getMaskDamageBonus(source) : 0,
    healingMultiplier: 1.0,
    mpBonusGranted: 0,
    shieldBonus: 0,
    breakBarFillPercent: 0,
    buffMultiplier: 1,
  };

  const atCaster = isAtCasterOrAlmighty(source);
  const atAgile = isAtAgileOrAlmighty(source);
  const atHeavy = isAtHeavyOrAlmighty(source);

  // grantsMpAtCasterMask - grants extra MP at Caster/Almighty
  if (metadata.grantsMpAtCasterMask && atCaster) {
    bonuses.mpBonusGranted = metadata.grantsMpAtCasterMask;
  }

  // healsHpPercentAtCasterMask - heals more at Caster/Almighty
  if (metadata.healsHpPercentAtCasterMask && atCaster) {
    bonuses.healingMultiplier = 1.0; // Will be handled separately
  }

  // doublesHealAtCasterMask - doubles healing at Caster/Almighty
  if (metadata.doublesHealAtCasterMask && atCaster) {
    bonuses.healingMultiplier = 2.0;
  }

  // fillsBreakBarAtAgileMask - fills break bar at Agile/Almighty
  if (metadata.fillsBreakBarAtAgileMask && atAgile) {
    bonuses.breakBarFillPercent = metadata.fillsBreakBarAtAgileMask;
  }

  // doublesBuffsAtCasterMask - doubles buffs at Caster/Almighty
  if (metadata.doublesBuffsAtCasterMask && atCaster) {
    bonuses.buffMultiplier = 2;
  }

  return bonuses;
}

/**
 * Advances the Bestial Wheel position
 * For utility skills (no attack request), updates directly via API
 */
export async function advanceBestialWheel(
  source: BattleCharacterInfo,
  advance: number,
  showToast: (message: string) => void
): Promise<number> {
  const currentPosition = source.bestialWheelPosition ?? 0;
  const newPosition = (currentPosition + advance) % 9;

  await APIBattle.updateBestialWheelPosition(source.battleID, newPosition);

  const newMask = getCurrentMask(newPosition);
  showToast(t("playerPage.skills.wheelAdvanced", { mask: newMask }));

  return newPosition;
}

/**
 * Forces the wheel to Almighty position (0)
 */
export async function forceAlmightyMask(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<void> {
  await APIBattle.updateBestialWheelPosition(source.battleID, 0);
  showToast(t("playerPage.skills.forcedToAlmighty"));
}

/**
 * Switches to Almighty if target is Marked (Benisseur Mortar)
 */
export async function switchToAlmightyIfMarked(
  source: BattleCharacterInfo,
  target: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<boolean> {
  if (!hasStatus(target, "Marked")) {
    return false;
  }

  await forceAlmightyMask(source, showToast);
  return true;
}

/**
 * Calculates damage bonus for shields ignored (Chevaliere Piercing)
 */
export function calculateShieldStackBonus(
  target: BattleCharacterInfo,
  damagePerStack: number
): number {
  const shieldStacks = target.status?.filter(s => s.effectName === "Shield") ?? [];
  let totalStacks = 0;

  for (const shield of shieldStacks) {
    totalStacks += shield.ammount ?? 1;
  }

  return totalStacks * damagePerStack;
}

/**
 * Calculates damage when sacrificing HP (Cultist Blood - 90% HP sacrifice)
 */
export function calculateSacrificeBonus(
  source: BattleCharacterInfo,
  sacrificePercent: number
): { damageBonus: number; hpToSacrifice: number } {
  const currentHp = source.healthPoints;
  const hpToSacrifice = Math.floor(currentHp * (sacrificePercent / 100));

  // Damage bonus equals HP sacrificed
  return {
    damageBonus: hpToSacrifice,
    hpToSacrifice,
  };
}

/**
 * Applies HP sacrifice (Cultist Blood)
 */
export async function applySacrifice(
  source: BattleCharacterInfo,
  sacrificePercent: number,
  showToast: (message: string) => void
): Promise<number> {
  const { hpToSacrifice } = calculateSacrificeBonus(source, sacrificePercent);
  const newHp = Math.max(1, source.healthPoints - hpToSacrifice);

  await APIBattle.updateCharacterHp(source.battleID, newHp);
  showToast(t("playerPage.skills.hpSacrificed", { amount: hpToSacrifice }));

  return hpToSacrifice;
}

/**
 * Calculates damage scaling with low HP (Cultist Slashes)
 * More damage when HP is lower
 */
export function calculateLowHpDamageBonus(source: BattleCharacterInfo): number {
  const missingHp = source.maxHealthPoints - source.healthPoints;
  return Math.min(Math.floor(missingHp / 2), 6);
}

/**
 * Checks for burning target bonus (Danseuse Waltz)
 */
export function hasBurningBonus(target: BattleCharacterInfo): boolean {
  return hasStatus(target, "Burning");
}

/**
 * Tracks damage escalation per use (Lampmaster Light)
 * Returns the current stack count from character status
 */
export function getDamageEscalationStacks(
  source: BattleCharacterInfo
): number {
  const escalation = source.status?.find(s => s.effectName === "DamageEscalation");
  return escalation?.ammount ?? 0;
}

/**
 * Increments damage escalation stacks after skill use (Lampmaster Light)
 */
export async function incrementDamageEscalation(
  source: BattleCharacterInfo,
  maxStacks: number,
  showToast: (message: string) => void
): Promise<void> {
  const currentStacks = getDamageEscalationStacks(source);
  const newStacks = Math.min(currentStacks + 1, maxStacks);

  if (currentStacks > 0) {
    await APIBattle.removeStatus(source.battleID, "DamageEscalation");
  }
  await APIBattle.addStatus({
    battleCharacterId: source.battleID,
    effectType: "DamageEscalation",
    ammount: newStacks,
    sourceCharacterId: source.battleID
  });

  showToast(t("playerPage.skills.damageEscalation", { stacks: newStacks, bonus: newStacks * 20 }));
}

/**
 * Calculates damage escalation multiplier (Lampmaster Light: +20% per use, max 5)
 */
export function calculateEscalationBonus(stacks: number, maxStacks: number = 5): number {
  const actualStacks = Math.min(stacks, maxStacks);
  // +2 damage per stack (max +10)
  return actualStacks * 2;
}

/**
 * Returns flat bonus damage vs stunned targets (Arauto do Fim / Mighty Strike)
 */
export function shouldDoubleDamageVsStunned(
  target: BattleCharacterInfo,
  metadata: SkillMetadata
): boolean {
  if (!metadata.plusDamageVsStunned) return false;
  return hasStatus(target, "Stunned");
}

/**
 * Checks for bonus damage vs powerless (Obscur Sword)
 */
export function hasPowerlessBonus(target: BattleCharacterInfo): boolean {
  return hasStatus(target, "Powerless");
}

/**
 * Grants MP at Caster mask (Orphelin Cheers)
 */
export async function grantMpAtCasterMask(
  source: BattleCharacterInfo,
  targets: BattleCharacterInfo[],
  mpAmount: number,
  showToast: (message: string) => void
): Promise<void> {
  if (!isAtCasterOrAlmighty(source)) return;

  for (const target of targets) {
    const currentMp = target.magicPoints ?? 0;
    const maxMp = target.maxMagicPoints ?? 99;
    const newMp = Math.min(currentMp + mpAmount, maxMp);

    await APIBattle.updateCharacterMp(target.battleID, newMp);
  }

  showToast(t("playerPage.skills.mpGrantedAtCaster", { amount: mpAmount }));
}

/**
 * Heals HP percent at Caster mask (Pelerin Heal)
 */
export async function healHpPercentAtCasterMask(
  source: BattleCharacterInfo,
  targets: BattleCharacterInfo[],
  hpPercent: number,
  showToast: (message: string) => void
): Promise<void> {
  if (!isAtCasterOrAlmighty(source)) return;

  for (const target of targets) {
    const maxHp = target.maxHealthPoints;
    const healAmount = Math.floor(maxHp * (hpPercent / 100));
    const newHp = Math.min(target.healthPoints + healAmount, maxHp);

    await APIBattle.updateCharacterHp(target.battleID, newHp);
  }

  showToast(t("playerPage.skills.healedAtCaster", { percent: hpPercent }));
}

/**
 * Grants MP to all allies with mask bonus (Potier Energy)
 */
export async function grantMpToAllAlliesWithMaskBonus(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  minMp: number,
  maxMp: number,
  showToast: (message: string) => void
): Promise<void> {
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.healthPoints > 0
  );

  let baseMp = Math.floor(Math.random() * (maxMp - minMp + 1)) + minMp;

  // Add +1 at Caster/Almighty
  if (isAtCasterOrAlmighty(source)) {
    baseMp += 1;
  }

  for (const ally of allies) {
    const currentMp = ally.magicPoints ?? 0;
    const maxMpCap = ally.maxMagicPoints ?? 99;
    const newMp = Math.min(currentMp + baseMp, maxMpCap);

    await APIBattle.updateCharacterMp(ally.battleID, newMp);
  }

  showToast(t("playerPage.skills.mpGrantedToAllAllies", { amount: baseMp }));
}

/**
 * Applies random buffs with mask bonus (Troubadour Trumpet)
 */
export async function applyRandomBuffsWithMaskBonus(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  showToast: (message: string) => void
): Promise<void> {
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.healthPoints > 0
  );

  // Random 1-3 allies
  const allyCount = Math.floor(Math.random() * 3) + 1;
  const selectedAllies = allies
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(allyCount, allies.length));

  const possibleBuffs: StatusType[] = ["Empowered", "Regeneration", "Shield"];
  let buffsPerAlly = 1;

  // Double buffs at Caster/Almighty
  if (isAtCasterOrAlmighty(source)) {
    buffsPerAlly = 2;
  }

  for (const ally of selectedAllies) {
    for (let i = 0; i < buffsPerAlly; i++) {
      const randomBuff = possibleBuffs[Math.floor(Math.random() * possibleBuffs.length)];

      await APIBattle.addStatus({
        battleCharacterId: ally.battleID,
        effectType: randomBuff,
        ammount: 1,
        remainingTurns: 3,
        sourceCharacterId: source.battleID,
      });
    }
  }

  showToast(t("playerPage.skills.randomBuffsApplied", { count: selectedAllies.length, buffs: buffsPerAlly }));
}

/**
 * Heals per hit with mask bonus (Sapling Absorption)
 */
export function calculateHealPerHit(
  source: BattleCharacterInfo,
  baseHealPercent: number,
  hitCount: number
): number {
  let healPercent = baseHealPercent;

  // Double at Caster/Almighty
  if (isAtCasterOrAlmighty(source)) {
    healPercent *= 2;
  }

  const maxHp = source.maxHealthPoints;
  const totalHeal = Math.floor(maxHp * (healPercent / 100) * hitCount);

  return totalHeal;
}

/**
 * Applies heal per hit (Sapling Absorption)
 */
export async function applyHealPerHit(
  source: BattleCharacterInfo,
  baseHealPercent: number,
  hitCount: number,
  showToast: (message: string) => void
): Promise<void> {
  const totalHeal = calculateHealPerHit(source, baseHealPercent, hitCount);

  const newHp = Math.min(source.healthPoints + totalHeal, source.maxHealthPoints);
  await APIBattle.updateCharacterHp(source.battleID, newHp);

  showToast(t("playerPage.skills.healedPerHit", { amount: totalHeal }));
}

/**
 * Heals all allies per hit (Contorsionniste Blast: 10% per enemy hit)
 */
export async function healAlliesPerHit(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  healPercent: number,
  hitCount: number,
  showToast: (message: string) => void
): Promise<void> {
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.healthPoints > 0
  );

  for (const ally of allies) {
    const healAmount = Math.floor(ally.maxHealthPoints * (healPercent / 100) * hitCount);
    const newHp = Math.min(ally.healthPoints + healAmount, ally.maxHealthPoints);
    await APIBattle.updateCharacterHp(ally.battleID, newHp);
  }

  const totalPercent = healPercent * hitCount;
  showToast(t("playerPage.skills.alliesHealedPerHit", { percent: totalPercent }));
}

/**
 * Grants MP at Heavy/Almighty mask (Cruler Barrier)
 */
export async function grantMpAtHeavyMask(
  source: BattleCharacterInfo,
  targets: BattleCharacterInfo[],
  mpAmount: number,
  showToast: (message: string) => void
): Promise<void> {
  if (!isAtHeavyOrAlmighty(source)) return;

  for (const target of targets) {
    const currentMp = target.magicPoints ?? 0;
    const maxMp = target.maxMagicPoints ?? 99;
    const newMp = Math.min(currentMp + mpAmount, maxMp);

    await APIBattle.updateCharacterMp(target.battleID, newMp);
  }

  showToast(t("playerPage.skills.mpGrantedAtHeavy", { amount: mpAmount }));
}
