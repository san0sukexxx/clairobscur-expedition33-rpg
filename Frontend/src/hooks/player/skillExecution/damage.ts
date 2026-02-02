import type { BattleCharacterInfo, WeaponInfo, Element } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { ResolvedSkill } from "../../../utils/BattleSkillUtils";
import { calculatePlayerCriticalBonus, calculateRawWeaponPower } from "../../../utils/PlayerCalculator";
import { diceTotal, countCriticalRolls } from "../../../utils/DiceCalculator";
import { calculateSkillHitDamage } from "../../../utils/BattleSkillUtils";
import { calculateNpcAttackReceivedDamage, getElementModifier } from "../../../utils/NpcCalculator";
import type { HitResult } from "./types";

/**
 * Determines the element for a skill based on metadata
 */
export function determineSkillElement(
  resolved: ResolvedSkill,
  weaponInfo: WeaponInfo | null
): Element | undefined {
  const weaponElement = weaponInfo?.details?.attributes?.element;
  return resolved.metadata.forcedElement ??
    (resolved.metadata.usesWeaponElement ? weaponElement : undefined);
}

/**
 * Calculates damage for a single hit
 */
export function calculateHitDamage(
  diceResult: any,
  player: GetPlayerResponse | null | undefined,
  weaponInfo: WeaponInfo | null,
  resolved: ResolvedSkill
): { baseDamage: number; hasCritical: boolean } {
  const total = diceTotal(diceResult);
  const critBonus = calculatePlayerCriticalBonus(diceResult, player ?? null, weaponInfo);
  const playerPower = (player?.playerSheet?.power ?? 0) + critBonus;
  const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
  const basePower = playerPower + weaponPower + total;
  const diceRoll = diceResult.flatMap((group: any) => group.rolls?.map((r: any) => r.value) ?? []);
  const baseDamage = calculateSkillHitDamage(resolved, basePower, diceRoll);
  const hasCritical = countCriticalRolls(diceResult) > 0;

  return { baseDamage, hasCritical };
}

/**
 * Applies element modifier to damage against an NPC
 */
export function applyElementModifier(
  baseDamage: number,
  targetId: string,
  skillElement: Element | undefined
): { damageWithElement: number; elementMod: any } {
  if (!skillElement) {
    return { damageWithElement: baseDamage, elementMod: null };
  }

  const elementMod = getElementModifier(targetId, skillElement);
  if (elementMod) {
    return {
      damageWithElement: baseDamage + elementMod.flatBonus,
      elementMod
    };
  }

  return { damageWithElement: baseDamage, elementMod: null };
}

/**
 * Calculates final damage after NPC defense
 */
export function calculateFinalDamage(
  target: BattleCharacterInfo,
  damageWithElement: number
): number {
  return calculateNpcAttackReceivedDamage(target, damageWithElement);
}

/**
 * Calculates charge increase for skills that generate charges
 */
export function calculateChargeIncrease(
  resolved: ResolvedSkill,
  hasCritical: boolean
): number | undefined {
  if (resolved.metadata.extraChargePerHit === undefined) {
    return undefined;
  }
  return hasCritical ? 1 + resolved.metadata.extraChargePerHit : 1;
}

/**
 * Logs element configuration for debugging
 */
export function logElementConfiguration(
  skillId: string,
  resolved: ResolvedSkill,
  weaponElement: Element | undefined,
  skillElement: Element | undefined
): void {
  console.log("=== Skill Element Configuration ===");
  console.log("Skill ID:", skillId);
  console.log("usesWeaponElement:", resolved.metadata.usesWeaponElement);
  console.log("forcedElement:", resolved.metadata.forcedElement ?? "None");
  console.log("Weapon Element:", weaponElement ?? "None");
  console.log("Final Skill Element:", skillElement ?? "None (Physical)");
}

/**
 * Logs element vs NPC interaction for debugging
 */
export function logElementVsNpc(
  target: BattleCharacterInfo,
  skillElement: Element | undefined,
  elementMod: any,
  baseDamage: number,
  damageWithElement: number
): void {
  console.log(`=== Skill Element vs NPC ===`);
  console.log(`Target: ${target.name} (${target.id})`);

  if (skillElement) {
    console.log(`Skill Element: ${skillElement}`);
    if (elementMod) {
      console.log(`NPC Reaction: ${elementMod.type}`);
      console.log(`Element Bonus: ${elementMod.flatBonus}`);
      console.log(`Damage: ${baseDamage} -> ${damageWithElement}`);
    } else {
      console.log(`NPC Reaction: neutral (no modifier)`);
    }
  } else {
    console.log(`No element (Physical damage)`);
  }
}
