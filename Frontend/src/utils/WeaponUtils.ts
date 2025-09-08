export function calculateWeaponPower(power: number, level: number): number {
    return power / 20 * level;
}
export function displayWeaponPower(power: number, level: number): number {
    return Math.round((power / 20) * level);
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
