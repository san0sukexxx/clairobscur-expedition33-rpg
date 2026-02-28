import type { AbilityScores, GetPlayerResponse } from "../api/APIPlayer";
import type { WeaponInfo } from "../api/ResponseModel";
import { calculateWeaponPlusPower } from "./WeaponCalculator";

/** D&D 5e ability modifier: floor((score - 10) / 2) */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** D&D 5e proficiency bonus by level */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2;
}

type AbilityKey = keyof AbilityScores;

const ATTACK_ATTRIBUTE_MAP: Record<string, AbilityKey> = {
  gustave: "strength",
  verso:   "strength",
  maelle:  "dexterity",
  monoco:  "wisdom",
  sciel:   "charisma",
  lune:    "intelligence",
};

/** Returns the primary attack ability for a character */
export function getAttackAttribute(characterId: string | undefined): AbilityKey {
  return ATTACK_ATTRIBUTE_MAP[characterId?.toLowerCase() ?? ""] ?? "strength";
}

/** Returns the attack attribute score for a player */
export function getAttackAttributeScore(player: GetPlayerResponse): number {
  const attrKey = getAttackAttribute(player.playerSheet?.characterId);
  return player.playerSheet?.abilityScores?.[attrKey] ?? 10;
}

/** Calculates weapon power modifier (integer part of power * level / 1000) */
export function getWeaponPowerModifier(weaponInfo: WeaponInfo): number {
  const power = weaponInfo.details?.attributes.power ?? 0;
  const level = weaponInfo.weapon?.level ?? 0;
  return calculateWeaponPlusPower(power, level) ?? 0;
}

export interface AttackBonusBreakdown {
  abilityMod: number;
  proficiency: number;
  weaponPower: number;
  total: number;
  abilityKey: AbilityKey;
  abilityScore: number;
}

/** Calculates the full attack bonus breakdown */
export function calculateAttackBonus(player: GetPlayerResponse, weaponInfo: WeaponInfo): AttackBonusBreakdown {
  const abilityKey = getAttackAttribute(player.playerSheet?.characterId);
  const abilityScore = player.playerSheet?.abilityScores?.[abilityKey] ?? 10;
  const abilityMod = getAbilityModifier(abilityScore);
  const level = player.playerSheet?.totalPoints ?? 1;
  const proficiency = calculateProficiencyBonus(level);
  const weaponPower = getWeaponPowerModifier(weaponInfo);

  return {
    abilityMod,
    proficiency,
    weaponPower,
    total: abilityMod + proficiency + weaponPower,
    abilityKey,
    abilityScore,
  };
}

export interface DamageBonusBreakdown {
  abilityMod: number;
  weaponPower: number;
  total: number;
  abilityKey: AbilityKey;
}

/** Calculates the damage bonus (ability mod + weapon power, no proficiency) */
export function calculateDamageBonus(player: GetPlayerResponse, weaponInfo: WeaponInfo): DamageBonusBreakdown {
  const abilityKey = getAttackAttribute(player.playerSheet?.characterId);
  const abilityScore = player.playerSheet?.abilityScores?.[abilityKey] ?? 10;
  const abilityMod = getAbilityModifier(abilityScore);
  const weaponPower = getWeaponPowerModifier(weaponInfo);

  return {
    abilityMod,
    weaponPower,
    total: abilityMod + weaponPower,
    abilityKey,
  };
}
