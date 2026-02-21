import type { BattleCharacterInfo, StatusType, WeaponInfo } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { APIBattle } from "../../../api/APIBattle";
import { t } from "../../../i18n";

export type PerfectionRank = "D" | "C" | "B" | "A" | "S";

const RANK_ORDER: PerfectionRank[] = ["D", "C", "B", "A", "S"];

/**
 * Gets the current perfection rank of a character
 */
export function getPerfectionRank(source: BattleCharacterInfo): PerfectionRank | null {
  const rank = source.perfectionRank;
  if (!rank) return null;
  if (RANK_ORDER.includes(rank as PerfectionRank)) {
    return rank as PerfectionRank;
  }
  return null;
}

/**
 * Checks if character is at a specific rank
 */
export function isAtRank(source: BattleCharacterInfo, rank: string): boolean {
  return source.perfectionRank === rank;
}

/**
 * Checks if character is at rank or higher
 */
export function isAtRankOrHigher(source: BattleCharacterInfo, minRank: string): boolean {
  const currentRank = getPerfectionRank(source);
  if (!currentRank) return false;

  const currentIndex = RANK_ORDER.indexOf(currentRank);
  const minIndex = RANK_ORDER.indexOf(minRank as PerfectionRank);

  return currentIndex >= minIndex;
}

export interface RankConditionalBonuses {
  damageBonus: number;
  bonusMpReturn: number;
  grantsMp: number;
  bonusMpToAllies: number;
  canReapplyStun: boolean;
  effectDuration: number | null;
}

/**
 * Calculates rank-conditional bonuses for a skill
 */
export function calculateRankBonuses(
  source: BattleCharacterInfo,
  metadata: SkillMetadata
): RankConditionalBonuses {
  const bonuses: RankConditionalBonuses = {
    damageBonus: 0,
    bonusMpReturn: 0,
    grantsMp: 0,
    bonusMpToAllies: 0,
    canReapplyStun: false,
    effectDuration: null,
  };

  const currentRank = getPerfectionRank(source);
  if (!currentRank) return bonuses;

  // Check rankConditionalBonus
  if (metadata.rankConditionalBonus && metadata.rankConditionalBonus.rank === currentRank) {
    const rcb = metadata.rankConditionalBonus;

    if (rcb.damageBonus) {
      bonuses.damageBonus += rcb.damageBonus;
    }
    if (rcb.bonusMpReturn) {
      bonuses.bonusMpReturn = rcb.bonusMpReturn;
    }
    if (rcb.grantsMp) {
      bonuses.grantsMp = rcb.grantsMp;
    }
    if (rcb.bonusMpToAllies) {
      bonuses.bonusMpToAllies = rcb.bonusMpToAllies;
    }
    if (rcb.canReapplyStun) {
      bonuses.canReapplyStun = true;
    }
  }

  // Check rankConditionalDuration
  if (metadata.rankConditionalDuration && metadata.rankConditionalDuration.rank === currentRank) {
    bonuses.effectDuration = metadata.rankConditionalDuration.duration;
  }

  return bonuses;
}

/**
 * Grants perfection points to character and handles rank up
 */
export async function grantPerfectionPoints(
  source: BattleCharacterInfo,
  basePoints: number,
  hasCritical: boolean,
  bonusOnCrit: number | undefined,
  showToast: (message: string) => void
): Promise<{ newRank: string; rankedUp: boolean }> {
  let totalPoints = basePoints;

  // Add bonus points on critical hit
  if (hasCritical && bonusOnCrit) {
    totalPoints += bonusOnCrit;
  }

  if (totalPoints <= 0) {
    return { newRank: source.perfectionRank ?? "D", rankedUp: false };
  }

  const result = await APIBattle.addPerfectionPoints(source.battleID, totalPoints);

  if (result.rankedUp) {
    showToast(t("playerPage.skills.rankUp", { rank: result.newRank }));
  } else {
    showToast(t("playerPage.skills.perfectionGained", { points: result.pointsAdded }));
  }

  return { newRank: result.newRank, rankedUp: result.rankedUp };
}

/**
 * Grants perfection points per hit
 */
export async function grantPerfectionPerHit(
  source: BattleCharacterInfo,
  hitCount: number,
  pointsPerHit: number,
  hasCritical: boolean,
  criticalGivesPerfectionBonus: boolean | undefined,
  showToast: (message: string) => void
): Promise<{ newRank: string; rankedUp: boolean }> {
  let totalPoints = hitCount * pointsPerHit;

  // If critical gives bonus, add extra points per hit with crit
  if (hasCritical && criticalGivesPerfectionBonus) {
    // Assume 1 extra point per hit that was critical
    totalPoints += 1;
  }

  if (totalPoints <= 0) {
    return { newRank: source.perfectionRank ?? "D", rankedUp: false };
  }

  const result = await APIBattle.addPerfectionPoints(source.battleID, totalPoints);

  if (result.rankedUp) {
    showToast(t("playerPage.skills.rankUp", { rank: result.newRank }));
  }

  return { newRank: result.newRank, rankedUp: result.rankedUp };
}

/**
 * Gains perfection rank directly (for skills like Fléau)
 */
export async function gainPerfectionRank(
  source: BattleCharacterInfo,
  ranksToGain: number,
  showToast: (message: string) => void
): Promise<boolean> {
  let success = false;

  for (let i = 0; i < ranksToGain; i++) {
    const ranked = await APIBattle.rankUpCharacter(source.battleID);
    if (ranked) {
      success = true;
    } else {
      break; // Already at max rank
    }
  }

  if (success) {
    showToast(t("playerPage.skills.rankUp", { rank: "+1" }));
  }

  return success;
}

/**
 * Reduces perfection rank (for Verso Demoralisation)
 */
export async function reducePerfectionRank(
  source: BattleCharacterInfo,
  ranksToReduce: number,
  showToast: (message: string) => void
): Promise<boolean> {
  let success = false;

  for (let i = 0; i < ranksToReduce; i++) {
    const ranked = await APIBattle.rankDownCharacter(source.battleID);
    if (ranked) {
      success = true;
    } else {
      break; // Already at min rank
    }
  }

  if (success) {
    showToast(t("playerPage.skills.rankDown"));
  }

  return success;
}

/**
 * Sets rank to S directly (for ultimate skills like Overload)
 */
export async function setRankToS(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<void> {
  // Rank up until we reach S
  let currentRank = getPerfectionRank(source);

  while (currentRank !== "S") {
    const ranked = await APIBattle.rankUpCharacter(source.battleID);
    if (!ranked) break;
    const currentIndex = RANK_ORDER.indexOf(currentRank ?? "D");
    if (currentIndex < RANK_ORDER.length - 1) {
      currentRank = RANK_ORDER[currentIndex + 1];
    } else {
      break;
    }
  }

  showToast(t("playerPage.skills.rankSetToS"));
}

/**
 * Upgrades rank to S on break (for Le Tremblement)
 */
export async function upgradeRankToSOnBreak(
  source: BattleCharacterInfo,
  targetBroken: boolean,
  showToast: (message: string) => void
): Promise<void> {
  if (!targetBroken) return;

  await setRankToS(source, showToast);
}

/**
 * Calculates HP cost for skills with costsHpPercent
 */
export function calculateHpCost(source: BattleCharacterInfo, hpPercent: number): number {
  const currentHp = source.healthPoints;
  return Math.floor(currentHp * (hpPercent / 100));
}

/**
 * Deducts HP cost before skill execution
 */
export async function deductHpCost(
  source: BattleCharacterInfo,
  hpPercent: number,
  showToast: (message: string) => void
): Promise<number> {
  const cost = calculateHpCost(source, hpPercent);
  const newHp = Math.max(1, source.healthPoints - cost); // Never kill self

  await APIBattle.updateCharacterHp(source.battleID, newHp);
  showToast(t("playerPage.skills.hpCost", { amount: cost }));

  return cost;
}

/**
 * Transfers all status effects from allies to Verso (Burden skill)
 */
export async function transferAllStatusToSelf(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  showToast: (message: string) => void
): Promise<void> {
  // Find all allies (same team, not self)
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.battleID !== source.battleID && c.healthPoints > 0
  );

  let transferredCount = 0;

  for (const ally of allies) {
    const statuses = ally.status ?? [];

    for (const status of statuses) {
      // Remove from ally
      await APIBattle.removeStatus(ally.battleID, status.effectName);

      // Add to self (Verso)
      await APIBattle.addStatus({
        battleCharacterId: source.battleID,
        effectType: status.effectName as StatusType,
        ammount: status.ammount ?? 0,
        remainingTurns: status.remainingTurns,
        sourceCharacterId: source.battleID,
      });

      transferredCount++;
    }
  }

  if (transferredCount > 0) {
    showToast(t("playerPage.skills.statusTransferred", { count: transferredCount }));
  }
}

/**
 * Returns MP to source after skill execution
 */
export async function returnMp(
  source: BattleCharacterInfo,
  minMp: number,
  maxMp: number,
  bonusMpReturn: number,
  showToast: (message: string) => void
): Promise<void> {
  const baseReturn = Math.floor(Math.random() * (maxMp - minMp + 1)) + minMp;
  const totalReturn = baseReturn + bonusMpReturn;

  const currentMp = source.magicPoints ?? 0;
  const maxMpCap = source.maxMagicPoints ?? 99;
  const newMp = Math.min(currentMp + totalReturn, maxMpCap);

  await APIBattle.updateCharacterMp(source.battleID, newMp);
  showToast(t("playerPage.skills.mpReturned", { amount: totalReturn }));
}

/**
 * Grants MP to all allies (Leadership skill)
 */
export async function grantMpToAllAllies(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  minMp: number,
  maxMp: number,
  bonusMpToAllies: number,
  showToast: (message: string) => void
): Promise<void> {
  const allies = allCharacters.filter(
    c => c.isEnemy === source.isEnemy && c.battleID !== source.battleID && c.healthPoints > 0
  );

  const baseMpGrant = Math.floor(Math.random() * (maxMp - minMp + 1)) + minMp;
  const totalMpGrant = baseMpGrant + bonusMpToAllies;

  for (const ally of allies) {
    const currentMp = ally.magicPoints ?? 0;
    const maxMpCap = ally.maxMagicPoints ?? 99;
    const newMp = Math.min(currentMp + totalMpGrant, maxMpCap);

    await APIBattle.updateCharacterMp(ally.battleID, newMp);
  }

  showToast(t("playerPage.skills.mpGrantedToAllies", { amount: totalMpGrant }));
}

/**
 * Random perfection gain (for Verso Puissant)
 */
export async function gainRandomPerfection(
  source: BattleCharacterInfo,
  minPoints: number,
  maxPoints: number,
  showToast: (message: string) => void
): Promise<void> {
  const points = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;

  const result = await APIBattle.addPerfectionPoints(source.battleID, points);

  if (result.rankedUp) {
    showToast(t("playerPage.skills.rankUp", { rank: result.newRank }));
  } else {
    showToast(t("playerPage.skills.perfectionGained", { points }));
  }
}
