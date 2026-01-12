import { APIBattle } from "../api/APIBattle";
import type { BattleCharacterInfo, StainType } from "../api/ResponseModel";
import type { SkillMetadata } from "../data/SkillEffectsRegistry";

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
 * Check if character has sufficient stains for a skill
 * Light stains act as wildcards and can substitute for any elemental stain
 *
 * IMPORTANT: Only requiresAllStains blocks skill usage.
 * consumesStains is OPTIONAL - skill can be used without stains, but stains enable bonus effects.
 */
export function hasRequiredStains(character: BattleCharacterInfo, skillMetadata: SkillMetadata): boolean {
    // Only block if skill explicitly requires all 4 elemental stains (e.g., Elemental Genesis)
    if (skillMetadata.requiresAllStains) {
        return hasAllElementalStains(character);
    }

    // For all other skills, stains are OPTIONAL (used for bonus effects, not requirements)
    // Skills with consumesStains can still be used without the stains
    return true;
}

/**
 * Consume stains from character based on skill metadata
 * Returns the new stain slots
 * Light stains act as wildcards - if specific stain is missing, Light will be consumed instead
 */
export function consumeStains(
    character: BattleCharacterInfo,
    skillMetadata: SkillMetadata
): [string | null, string | null, string | null, string | null] {
    if (!skillMetadata.consumesStains) {
        return [
            character.stainSlot1 ?? null,
            character.stainSlot2 ?? null,
            character.stainSlot3 ?? null,
            character.stainSlot4 ?? null
        ];
    }

    const stains = [
        character.stainSlot1,
        character.stainSlot2,
        character.stainSlot3,
        character.stainSlot4
    ];

    for (const { stain, count } of skillMetadata.consumesStains) {
        let toRemove = count;

        // Count how many we can remove (specific stain + Light wildcards)
        const specificCount = stains.filter(s => s === stain).length;
        const lightCount = stains.filter(s => s === "Light").length;
        const totalAvailable = specificCount + lightCount;

        // If we don't have enough (specific + Light), don't consume anything for this stain requirement
        if (totalAvailable < count) {
            continue; // Skip this stain requirement, don't consume anything
        }

        // First, try to remove the specific stain type
        for (let i = 0; i < stains.length && toRemove > 0; i++) {
            if (stains[i] === stain) {
                stains[i] = null;
                toRemove--;
            }
        }

        // If we still need to remove more, use Light as wildcard
        if (toRemove > 0) {
            for (let i = 0; i < stains.length && toRemove > 0; i++) {
                if (stains[i] === "Light") {
                    stains[i] = null;
                    toRemove--;
                }
            }
        }
    }

    return [stains[0] ?? null, stains[1] ?? null, stains[2] ?? null, stains[3] ?? null];
}

/**
 * Add stains to character based on skill metadata
 * Returns the new stain slots
 *
 * Rules when all 4 slots are full:
 * - Replace a non-Light stain (Lightning, Earth, Fire, Ice)
 * - NEVER replace Light stains
 * - If all 4 slots are Light, do nothing (stain is lost)
 */
export function addStains(
    currentStains: [string | null, string | null, string | null, string | null],
    stainsToAdd: StainType[]
): [string | null, string | null, string | null, string | null] {
    const stains = [...currentStains];

    for (const stain of stainsToAdd) {
        // First, try to find an empty slot
        const emptyIndex = stains.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            stains[emptyIndex] = stain;
            continue; // Move to next stain to add
        }

        // No empty slots - need to replace
        // Find first non-Light stain to replace
        const replaceableIndex = stains.findIndex(s => s !== null && s !== "Light");

        if (replaceableIndex !== -1) {
            // Replace the non-Light stain
            stains[replaceableIndex] = stain;
        }
        // If all 4 slots are Light, do nothing (stain is lost)
    }

    return [stains[0] ?? null, stains[1] ?? null, stains[2] ?? null, stains[3] ?? null];
}

/**
 * Transform a stain (e.g., Fire -> Light for Electrify)
 * Returns the new stain slots
 */
export function transformStain(
    character: BattleCharacterInfo,
    from: StainType,
    to: StainType
): [string | null, string | null, string | null, string | null] {
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

    return [stains[0] ?? null, stains[1] ?? null, stains[2] ?? null, stains[3] ?? null];
}

/**
 * Update character stains via API
 */
export async function updateCharacterStains(
    battleCharacterId: number,
    stains: [string | null, string | null, string | null, string | null]
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
