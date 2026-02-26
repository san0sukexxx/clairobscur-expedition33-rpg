import { APIBattle } from "../api/APIBattle";
import type { BattleCharacterInfo, StainType } from "../api/ResponseModel";

/**
 * Count how many of a specific stain the character has
 */
export function countStains(character: BattleCharacterInfo, stainType: StainType): number {
    const stains = [
        character.stainSlot1,
        character.stainSlot2,
        character.stainSlot3,
        character.stainSlot4
    ];
    return stains.filter(s => s === stainType).length;
}

/**
 * Check if character has all 4 elemental stains (Lightning, Earth, Fire, Ice)
 * Light stains act as wildcards and can substitute for any elemental stain
 */
export function hasAllElementalStains(character: BattleCharacterInfo): boolean {
    const stains = [
        character.stainSlot1,
        character.stainSlot2,
        character.stainSlot3,
        character.stainSlot4
    ];

    const requiredElements: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];
    const lightCount = stains.filter(s => s === "Light").length;

    // Check how many required elements are missing
    const missingElements = requiredElements.filter(element => !stains.includes(element));

    // We can use Light stains as wildcards for missing elements
    return missingElements.length <= lightCount;
}

/**
 * Add stains to character based on skill metadata
 * Returns the new stain slots
 *
 * Rules when all 4 slots are full:
 * - Light stains have priority: replace first non-Light stain
 * - Non-Light stains are lost if no empty slot is available
 * - Light stains are NEVER replaced automatically
 * - If all 4 slots are Light, new stains are lost
 * - Light stains are processed FIRST to ensure they get priority
 */
export function addStains(
    currentStains: [StainType | null, StainType | null, StainType | null, StainType | null],
    stainsToAdd: StainType[]
): [StainType | null, StainType | null, StainType | null, StainType | null] {
    const stains = [...currentStains];

    // Separate Light and non-Light stains
    const lightStains = stainsToAdd.filter(s => s === "Light");
    const nonLightStains = stainsToAdd.filter(s => s !== "Light");

    // Process Light stains first, then non-Light stains
    const orderedStains = [...lightStains, ...nonLightStains];

    for (const stain of orderedStains) {
        // First, try to find an empty slot
        const emptyIndex = stains.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            stains[emptyIndex] = stain;
            continue;
        }

        // No empty slot: only Light has priority to replace non-Light stains
        if (stain === "Light") {
            const replaceableIndex = stains.findIndex(s => s !== null && s !== "Light");
            if (replaceableIndex !== -1) {
                stains[replaceableIndex] = stain;
            }
        }
        // Non-Light stains are lost if all slots are full
    }

    return [stains[0] ?? null, stains[1] ?? null, stains[2] ?? null, stains[3] ?? null] as [StainType | null, StainType | null, StainType | null, StainType | null];
}

/**
 * Transform a stain (e.g., Fire -> Light for Electrify)
 * Returns the new stain slots
 */
export function transformStain(
    character: BattleCharacterInfo,
    from: StainType,
    to: StainType
): [StainType | null, StainType | null, StainType | null, StainType | null] {
    const stains = [
        character.stainSlot1,
        character.stainSlot2,
        character.stainSlot3,
        character.stainSlot4
    ];

    // Find first instance of 'from' stain and replace with 'to'
    const index = stains.findIndex(s => s === from);
    if (index !== -1) {
        stains[index] = to;
    }

    return [stains[0] ?? null, stains[1] ?? null, stains[2] ?? null, stains[3] ?? null] as [StainType | null, StainType | null, StainType | null, StainType | null];
}

/**
 * Update character stains via API
 */
export async function updateCharacterStains(
    battleCharacterId: number,
    stains: [StainType | null, StainType | null, StainType | null, StainType | null]
): Promise<void> {
    await APIBattle.updateStains(battleCharacterId, {
        stainSlot1: stains[0],
        stainSlot2: stains[1],
        stainSlot3: stains[2],
        stainSlot4: stains[3]
    });
}

/**
 * Get the dominant element based on stain composition (for Sky Break)
 */
export function getDominantElement(character: BattleCharacterInfo): StainType {
    const stains = [
        character.stainSlot1,
        character.stainSlot2,
        character.stainSlot3,
        character.stainSlot4
    ].filter(s => s !== null) as StainType[];

    if (stains.length === 0) return "Lightning"; // Default

    // Count occurrences
    const counts: Record<string, number> = {};
    for (const stain of stains) {
        counts[stain] = (counts[stain] || 0) + 1;
    }

    // Find most common
    let maxCount = 0;
    let dominant: StainType = "Lightning";
    for (const [stain, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            dominant = stain as StainType;
        }
    }

    return dominant;
}
