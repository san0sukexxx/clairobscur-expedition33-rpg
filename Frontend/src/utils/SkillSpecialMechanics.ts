import { APIBattle } from "../api/APIBattle";
import type { BattleCharacterInfo, StatusType } from "../api/ResponseModel";
import type { SkillMetadata } from "../data/SkillEffectsRegistry";

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
