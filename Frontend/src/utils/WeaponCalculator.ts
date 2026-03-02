import type { WeaponInfo } from "../api/ResponseModel";
import { roundDownOneDecimal } from "./MathUtils";

export function calculateWeaponPower(power: number, level: number): number {
  return roundDownOneDecimal(power * level / 1000);
}
export function calculateWeaponPlusPower(power: number, level: number): number | null {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  return integerPart;
}
export function calculateWeaponCounterMaxPower(power: number, level: number): number | null {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  if (decimalPart == undefined) return integerPart * 3;
  return integerPart * 3 + decimalPart;
}
export function displayWeaponPlusPower(power: number, level: number): string | null {
  const weaponPower = calculateWeaponPlusPower(power, level);
  if (weaponPower == null) return null;
  return "+" + weaponPower;
}

const ranks = ["S", "A", "B", "C", "D"];
export function displayWeaponAttributeRank(rank: string, level: number): string {
  const index = ranks.indexOf(rank);

  if (index === -1) return rank;

  if (level == 1) {
    return ranks[Math.min(index + 2, ranks.length - 1)];
  }

  if (level == 2) {
    return ranks[Math.min(index + 1, ranks.length - 1)];
  }

  if (level === 4) {
    return ranks[Math.max(index - 1, 0)];
  }

  return rank;
}
export function rankToValue(rank: string, level: number): number {
  const weaponRank = displayWeaponAttributeRank(rank, level)
  const index = ranks.indexOf(weaponRank) + 1;
  if (index === -1) return 0;
  return (ranks.length - index);
}
export function calculateWeaponVitality(rank: string, level: number): number {
  return rankToValue(rank, level)
}
export function calculateWeaponVitalityBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.vitality == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.vitality;
  return calculateWeaponVitality(rank, weaponInfo.weapon?.level ?? 0);
}
export function calculateWeaponDexterityBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.dexterity == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.dexterity;
  return rankToValue(rank, weaponInfo.weapon?.level ?? 0)
}
export function calculateWeaponDefenseBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.defense == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.defense;
  return rankToValue(rank, weaponInfo.weapon?.level ?? 0)
}
export function calculateWeaponProficiencyBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.luck == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.luck;
  return Math.floor(rankToValue(rank, weaponInfo.weapon?.level ?? 0) * 1.5)
}
export function displayWeaponVitalityBonus(rank: string, level: number): string {
  return "+" + calculateWeaponVitality(rank, level)
}
export function displayWeaponDefenseBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level)
}
export function displayWeaponProficiencyBonus(rank: string, level: number): string {
  return "+" + Math.floor(rankToValue(rank, level) * 1.5)
}
export function displayWeaponDexterityBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level)
}

const DAMAGE_DICE_BY_LEVEL: Record<number, string> = {
  1: "1d4",
  2: "1d6",
  3: "1d8",
  4: "1d10",
};

export function getWeaponDamageDice(weaponLevel: number): string {
  return DAMAGE_DICE_BY_LEVEL[weaponLevel] ?? "1d4";
}