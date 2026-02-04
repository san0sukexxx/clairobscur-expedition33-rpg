import { APIBattle } from "../api/APIBattle";
import type { BattleCharacterInfo, StatusType } from "../api/ResponseModel";
import type { SkillMetadata } from "../data/SkillEffectsRegistry";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { performAttributeTest, countSuccesses, type AttributeTestResult } from "./AttributeTestUtils";
import { getStatusLabel } from "./BattleUtils";

/**
 * Special mechanics for skills that require complex logic beyond standard damage/effects.
 * These functions are called after the main skill execution in PlayerPage.tsx.
 */

interface SpecialMechanicContext {
  source: BattleCharacterInfo;
  target?: BattleCharacterInfo;
  resolved: {
    metadata: SkillMetadata;
    targetIds: number[];
    effects: any[];
  };
  allCharacters: BattleCharacterInfo[];
  showToast: (message: string) => void;
}

export interface AttributeTestsContext {
  source: BattleCharacterInfo;
  target: BattleCharacterInfo;
  player: GetPlayerResponse;
  allCharacters: BattleCharacterInfo[];
  metadata: SkillMetadata;
  diceBoardRef: React.RefObject<any>;
  timeoutDiceBoardRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string) => void;
}

/**
 * Card Weaver: Redistribute target's Foretell to all other enemies
 * NOTE: Passive removed - keeping stub for interface compatibility
 */
export async function handleRedistributeForetell(_ctx: SpecialMechanicContext): Promise<void> {
  return;
}

/**
 * Card Weaver: Grant extra turn
 * NOTE: Passive removed - keeping stub for interface compatibility
 */
export async function handleGrantExtraTurn(_ctx: SpecialMechanicContext): Promise<void> {
  return;
}

/**
 * Rush: Apply Hastened to 1-3 random allies
 * NOTE: Passive removed - keeping stub for interface compatibility
 */
export async function handleRandomAllyBuff(_ctx: SpecialMechanicContext): Promise<void> {
  return;
}

/**
 * Dark Cleansing: Cleanse all debuffs from target and copy buffs to other allies
 * NOTE: Passive removed - keeping stub for interface compatibility
 */
export async function handleCleansesAndCopiesBuffs(_ctx: SpecialMechanicContext): Promise<void> {
  return;
}

/**
 * Plentiful Harvest: Grant MP to random ally per Foretell consumed
 * NOTE: Passive removed - keeping stub for interface compatibility
 */
export async function handleGrantMpPerForetell(
  _ctx: SpecialMechanicContext,
  _mpToGrant: number
): Promise<void> {
  return;
}

/**
 * Execute all special mechanics in order
 * NOTE: Passives removed - keeping stub for interface compatibility
 */
export async function executeAllSpecialMechanics(
  _ctx: SpecialMechanicContext,
  _mpToGrant?: number
): Promise<void> {
  return;
}

/**
 * Generic handler for skills with attribute tests
 * Processes attributeTests from SkillMetadata and applies effects based on successes
 */
export async function handleAttributeTests(ctx: AttributeTestsContext): Promise<void> {
  const { source, target, player, allCharacters, metadata, diceBoardRef, timeoutDiceBoardRef, showToast } = ctx;

  const testConfig = metadata.attributeTests;
  if (!testConfig) return;

  // Build list of potential targets based on targetPriority
  const potentialTargets: BattleCharacterInfo[] = [];

  if (testConfig.onSuccess?.applyStatus) {
    const { targetPriority, effectType } = testConfig.onSuccess.applyStatus;

    // Helper to check if character already has the status
    const hasStatus = (char: BattleCharacterInfo) =>
      char.status?.some(s => s.effectName === effectType) ?? false;

    if (targetPriority === "selected-first") {
      // Add selected target first (if it's an ally - can be self if canTargetSelf is true)
      if (target && !target.isEnemy) {
        potentialTargets.push(target);
      }

      // Add remaining allies (excluding already added target)
      const remainingAllies = allCharacters.filter(c =>
        !c.isEnemy &&
        c.battleID !== target?.battleID &&
        c.healthPoints > 0
      );

      // Prioritize allies without the status, then those with it
      const withoutStatus = remainingAllies.filter(c => !hasStatus(c));
      const withStatus = remainingAllies.filter(c => hasStatus(c));

      // Shuffle each group and add: first those without status, then those with
      const shuffledWithout = [...withoutStatus].sort(() => Math.random() - 0.5);
      const shuffledWith = [...withStatus].sort(() => Math.random() - 0.5);
      potentialTargets.push(...shuffledWithout, ...shuffledWith);

    } else if (targetPriority === "random-allies") {
      // All allies except self
      const allies = allCharacters.filter(c =>
        !c.isEnemy &&
        c.battleID !== source.battleID &&
        c.healthPoints > 0
      );

      // Prioritize allies without the status
      const withoutStatus = allies.filter(c => !hasStatus(c));
      const withStatus = allies.filter(c => hasStatus(c));

      const shuffledWithout = [...withoutStatus].sort(() => Math.random() - 0.5);
      const shuffledWith = [...withStatus].sort(() => Math.random() - 0.5);
      potentialTargets.push(...shuffledWithout, ...shuffledWith);

    } else if (targetPriority === "self") {
      potentialTargets.push(source);
    }
  }

  // Perform attribute tests one by one
  const results: AttributeTestResult[] = [];

  const performTestSequentially = (index: number): Promise<void> => {
    return new Promise((resolveTest) => {
      if (index >= testConfig.count) {
        resolveTest();
        return;
      }

      performAttributeTest(
        diceBoardRef,
        timeoutDiceBoardRef,
        player,
        testConfig.type,
        testConfig.dc,
        (result) => {
          results.push(result);

          // Show toast for each roll
          showToast(`Total: ${result.total} / CD ${result.dc}`);

          console.log(`Teste ${index + 1}: ${result.roll} + ${result.attribute} = ${result.total} vs CD ${result.dc} -> ${result.success ? "Sucesso" : "Falha"}`);

          // Continue with next test
          performTestSequentially(index + 1).then(resolveTest);
        }
      );
    });
  };

  await performTestSequentially(0);

  const successes = countSuccesses(results);

  // Apply status effects based on successes
  if (testConfig.onSuccess?.applyStatus && successes > 0) {
    const { effectType, remainingTurns } = testConfig.onSuccess.applyStatus;
    const targetsToApply = potentialTargets.slice(0, successes);

    for (const allyTarget of targetsToApply) {
      await APIBattle.addStatus({
        battleCharacterId: allyTarget.battleID,
        effectType: effectType,
        ammount: 0,
        remainingTurns: remainingTurns,
        sourceCharacterId: source.battleID
      });
      showToast(`${allyTarget.name} recebeu ${getStatusLabel(effectType)}!`);
    }
  }

  // Add charges based on successes
  if (testConfig.onSuccess?.addCharges && successes > 0) {
    const chargesToAdd = testConfig.onSuccess.addCharges * successes;
    const currentCharges = source.chargePoints ?? 0;
    const maxCharges = source.maxChargePoints ?? 10;
    const newCharges = Math.min(currentCharges + chargesToAdd, maxCharges);

    await APIBattle.updateCharacterChargePoints(source.battleID, newCharges);
    showToast(`${source.name} ganhou ${chargesToAdd} carga(s)!`);
  }
}
