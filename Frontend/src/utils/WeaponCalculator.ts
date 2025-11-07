import { roundDownOneDecimal } from "./MathUtils";

export function calculateWeaponPower(power: number, level: number): number {
  return roundDownOneDecimal((power / 8) * level / 1000);
}
export function calculateWeaponPlusDices(power: number, level: number): number {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  return integerPart;
}
export function calculateWeaponPlusPower(power: number, level: number): number | null {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  if (decimalPart == undefined) return null;
  return decimalPart;
}
export function displayWeaponPlusDices(power: number, level: number): string | null {
  return "+" + calculateWeaponPlusDices(power, level);
}
export function displayWeaponPlusPower(power: number, level: number): string | null {
  const weaponPower = calculateWeaponPlusPower(power, level);
  if (weaponPower == null) return null;
  return "+" + weaponPower;
}
export function displayWeaponAttributeRank(rank: string, level: number): string {
  const ranks = ["S", "A", "B", "C", "D"];
  const index = ranks.indexOf(rank);

  if (index === -1) return rank;

  if (level < 4) {
    return ranks[Math.min(index + 2, ranks.length - 1)];
  }

  if (level < 20) {
    return ranks[Math.min(index + 1, ranks.length - 1)];
  }

  if (level === 33) {
    return ranks[Math.max(index - 1, 0)];
  }

  return rank;
}