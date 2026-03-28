import type { AbilityScores, GetPlayerResponse } from "../api/APIPlayer";
import type { WeaponInfo } from "../api/ResponseModel";
import { calculateWeaponPlusPower, calculateWeaponProficiencyBonus, calculateWeaponDexterityBonus } from "./WeaponCalculator";
import { playerPictosTotalSpeed, playerPictosTotalHealth, playerPictosTotalStrength, playerPictosTotalIntelligence, playerPictosTotalWisdom, playerPictosTotalCharisma, abilityScoreCap } from "./PlayerCalculator";

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

/** Returns the attack ability for basic (non-skill) attacks */
export function getBasicAttackAttribute(characterId: string | undefined): AbilityKey {
  const BASIC_ATTACK_OVERRIDE: Record<string, AbilityKey> = {
    lune: "strength",
    monoco: "strength",
  };
  const id = characterId?.toLowerCase() ?? "";
  return BASIC_ATTACK_OVERRIDE[id] ?? ATTACK_ATTRIBUTE_MAP[id] ?? "strength";
}

/** Returns the primary attack ability for a character */
export function getAttackAttribute(characterId: string | undefined): AbilityKey {
  return ATTACK_ATTRIBUTE_MAP[characterId?.toLowerCase() ?? ""] ?? "strength";
}

/** Returns the effective attack attribute score for a player (with picto/weapon bonuses) */
export function getAttackAttributeScore(player: GetPlayerResponse, weaponInfo?: WeaponInfo): number {
  const attrKey = getAttackAttribute(player.playerSheet?.characterId);
  const base = player.playerSheet?.abilityScores?.[attrKey] ?? 10;
  return Math.min(abilityScoreCap(player), base + getAbilityPictoBonus(player, attrKey) + getAbilityWeaponBonus(attrKey, weaponInfo));
}

function getAbilityPictoBonus(player: GetPlayerResponse, key: AbilityKey): number {
  const map: Record<AbilityKey, (p: GetPlayerResponse) => number> = {
    strength: playerPictosTotalStrength,
    dexterity: playerPictosTotalSpeed,
    constitution: playerPictosTotalHealth,
    intelligence: playerPictosTotalIntelligence,
    wisdom: playerPictosTotalWisdom,
    charisma: playerPictosTotalCharisma,
  };
  return (map[key] ?? (() => 0))(player);
}

function getAbilityWeaponBonus(key: AbilityKey, weaponInfo?: WeaponInfo): number {
  if (!weaponInfo) return 0;
  if (key === "dexterity") return calculateWeaponDexterityBonus(weaponInfo);
  return 0;
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
export function calculateAttackBonus(player: GetPlayerResponse, weaponInfo: WeaponInfo, overrideAbilityKey?: AbilityKey): AttackBonusBreakdown {
  const abilityKey = overrideAbilityKey ?? getAttackAttribute(player.playerSheet?.characterId);
  const baseScore = player.playerSheet?.abilityScores?.[abilityKey] ?? 10;
  const abilityScore = Math.min(abilityScoreCap(player), baseScore + getAbilityPictoBonus(player, abilityKey) + getAbilityWeaponBonus(abilityKey, weaponInfo));
  const abilityMod = getAbilityModifier(abilityScore);
  const level = player.playerSheet?.totalPoints ?? 1;
  const baseProficiency = calculateProficiencyBonus(level);
  const weaponProficiency = calculateWeaponProficiencyBonus(weaponInfo);
  const proficiency = baseProficiency + weaponProficiency;
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
export function calculateDamageBonus(player: GetPlayerResponse, weaponInfo: WeaponInfo, overrideAbilityKey?: AbilityKey): DamageBonusBreakdown {
  const abilityKey = overrideAbilityKey ?? getAttackAttribute(player.playerSheet?.characterId);
  const baseScore = player.playerSheet?.abilityScores?.[abilityKey] ?? 10;
  const abilityScore = Math.min(abilityScoreCap(player), baseScore + getAbilityPictoBonus(player, abilityKey) + getAbilityWeaponBonus(abilityKey, weaponInfo));
  const abilityMod = getAbilityModifier(abilityScore);
  const weaponPower = getWeaponPowerModifier(weaponInfo);

  return {
    abilityMod,
    weaponPower,
    total: abilityMod + weaponPower,
    abilityKey,
  };
}
