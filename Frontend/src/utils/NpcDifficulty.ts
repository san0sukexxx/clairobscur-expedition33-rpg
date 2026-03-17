import { getNpcById } from "./NpcUtils";

// D&D 5e – CR to XP reward table
const CR_XP_TABLE: Record<string, number> = {
    "0": 10,
    "0.125": 25,
    "0.25": 50,
    "0.5": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000,
};

export function crToXp(cr: number): number {
    return CR_XP_TABLE[String(cr)] ?? 0;
}

export function calculateNPCDifficulty(npcId: string): number {
    const npc = getNpcById(npcId);
    if (!npc) return 0;

    if (npc.challengeRating != null) {
        return Number(npc.challengeRating);
    }

    const strMod = Math.floor((npc.strength - 10) / 2);
    const dexMod = Math.floor((npc.dexterity - 10) / 2);
    const conMod = Math.floor((npc.constitution - 10) / 2);
    let score = strMod + dexMod + conMod;

    if (npc.weakTo) score -= (Array.isArray(npc.weakTo) ? npc.weakTo.length : 1);
    if (npc.resistentTo) score += (Array.isArray(npc.resistentTo) ? npc.resistentTo.length : 1);
    if (npc.imuneTo) score += (Array.isArray(npc.imuneTo) ? npc.imuneTo.length : 1);
    if (npc.absorbElement) score += (Array.isArray(npc.absorbElement) ? npc.absorbElement.length : 1);
    if (npc.freeShotWeakPoints) score -= 1;
    if (npc.attackList && npc.attackList.length > 0) score += 1;
    if (npc.isFlying) score += 1;
    if (npc.maxLifeBonus) score += 1;

    if (score <= 1) return 0.25;
    if (score <= 3) return 0.5;
    if (score <= 5) return 1;
    if (score <= 7) return 2;
    if (score <= 9) return 3;
    if (score <= 11) return 4;
    if (score <= 13) return 5;
    return Math.min(30, 6 + Math.floor((score - 14) / 2));
}

export function formatCR(cr: number): string {
    if (cr === 0.125) return "1/8";
    if (cr === 0.25) return "1/4";
    if (cr === 0.5) return "1/2";
    return String(cr);
}
