/**
 * PICTO/LUMINA EFFECTS INTEGRATION GUIDE
 *
 * This file contains integration examples for connecting picto/lumina effects
 * to the battle system in PlayerPage.tsx
 */

import { executePictoEffects } from "./PictoEffects";
import type { BattleCharacterInfo, PictoResponse, LuminaResponse } from "../api/ResponseModel";

// ==================== INTEGRATION EXAMPLES ====================

/**
 * Example 1: Integrate with Heal Action (Accelerating Heal)
 *
 * Place this AFTER a successful heal in PlayerPage.tsx
 */
export async function triggerOnHealAlly(
    healer: BattleCharacterInfo,
    healedTarget: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[],
    healAmount?: number
) {
    const results = await executePictoEffects(
        "on-heal-ally",
        healer,
        allCharacters,
        battleId,
        pictos,
        luminas,
        healedTarget,
        { healAmount }
    );

    // Log results for debugging
    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Example 2: Integrate with Free Aim Shot (Accelerating Shots)
 *
 * Place this AFTER a successful Free Aim shot in PlayerPage.tsx
 */
export async function triggerOnFreeAim(
    shooter: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-free-aim",
        shooter,
        allCharacters,
        battleId,
        pictos,
        luminas
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Example 3: Integrate with Battle Start (Accelerating Last Stand)
 *
 * Place this when battle starts or turn begins
 */
export async function triggerOnBattleStart(
    character: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-battle-start",
        character,
        allCharacters,
        battleId,
        pictos,
        luminas
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Example 4: Integrate with Turn Start (Accelerating Last Stand)
 *
 * Place this at the start of character's turn
 */
export async function triggerOnTurnStart(
    character: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-turn-start",
        character,
        allCharacters,
        battleId,
        pictos,
        luminas
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Example 5: Integrate with Revival (Aegis Revival)
 *
 * Place this AFTER a character is revived
 */
export async function triggerOnRevived(
    revivedCharacter: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-revived",
        revivedCharacter,
        allCharacters,
        battleId,
        pictos,
        luminas
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Example 6: Integrate with Healing Tint (Accelerating Tint)
 *
 * Place this AFTER using a Healing Tint
 */
export async function triggerOnHealingTint(
    user: BattleCharacterInfo,
    target: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-healing-tint",
        user,
        allCharacters,
        battleId,
        pictos,
        luminas,
        target
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

// ==================== USAGE IN PLAYERPAGE.TSX ====================

/**
 * HOW TO USE IN PLAYERPAGE.TSX:
 *
 * 1. Import the trigger functions:
 *    import { triggerOnHealAlly, triggerOnFreeAim, etc } from "../utils/PictoEffectsIntegration";
 *
 * 2. Get the source character (player in battle):
 *    const sourceCharacter = player.fightInfo.characters?.find(c => c.id === player.playerSheet.characterId);
 *
 * 3. Get all characters in battle:
 *    const allCharacters = player.fightInfo.characters ?? [];
 *
 * 4. Call the appropriate trigger after an action:
 *
 *    Example A - After Healing:
 *    ```typescript
 *    async function handleHealAction(target: BattleCharacterInfo, healAmount: number) {
 *        // ... existing heal logic ...
 *        await APIBattle.heal(target.battleID, healAmount);
 *
 *        // ✅ ADD THIS: Trigger picto/lumina effects
 *        await triggerOnHealAlly(
 *            sourceCharacter!,
 *            target,
 *            allCharacters,
 *            player.pictos,
 *            player.luminas,
 *            healAmount
 *        );
 *
 *        // ... refresh battle state ...
 *    }
 *    ```
 *
 *    Example B - After Free Aim:
 *    ```typescript
 *    async function handleFreeAimShot() {
 *        // ... existing free aim logic ...
 *        await APIBattle.attack({ ... });
 *
 *        // ✅ ADD THIS: Trigger picto/lumina effects
 *        await triggerOnFreeAim(
 *            sourceCharacter!,
 *            allCharacters,
 *            player.pictos,
 *            player.luminas
 *        );
 *
 *        // ... refresh battle state ...
 *    }
 *    ```
 *
 *    Example C - At Battle Start:
 *    ```typescript
 *    useEffect(() => {
 *        if (player.fightInfo.battleId && sourceCharacter) {
 *            // ✅ ADD THIS: Trigger battle start effects
 *            triggerOnBattleStart(
 *                sourceCharacter,
 *                allCharacters,
 *                player.pictos,
 *                player.luminas
 *            );
 *        }
 *    }, [player.fightInfo.battleId]);
 *    ```
 */

/**
 * Trigger on-kill effects when an enemy is killed
 *
 * Place this AFTER dealing damage that kills an enemy in PlayerPage.tsx
 */
export async function triggerOnKill(
    killer: BattleCharacterInfo,
    killedEnemy: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    const results = await executePictoEffects(
        "on-kill",
        killer,
        allCharacters,
        battleId,
        pictos,
        luminas,
        killedEnemy
    );

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

/**
 * Integrate with Dodge Action (Dodger picto)
 *
 * Place this AFTER a successful dodge in PlayerPage.tsx
 */
export async function triggerOnDodge(
    dodger: BattleCharacterInfo,
    attacker: BattleCharacterInfo | undefined,
    allCharacters: BattleCharacterInfo[],
    battleId: number,
    pictos?: PictoResponse[],
    luminas?: LuminaResponse[]
) {
    console.log("[Dodger Debug] Triggering on-dodge effects");
    console.log("[Dodger Debug] Dodger:", dodger.name);
    console.log("[Dodger Debug] Pictos:", pictos);
    console.log("[Dodger Debug] Luminas:", luminas);

    const results = await executePictoEffects(
        "on-dodge",
        dodger,
        allCharacters,
        battleId,
        pictos,
        luminas,
        attacker
    );

    console.log("[Dodger Debug] Results:", results);

    results.forEach(result => {
        if (result.success && result.message) {
            console.log(`[Picto Effect] ${result.message}`);
        }
    });

    return results;
}

// ==================== DISPLAY EFFECT MESSAGES (OPTIONAL) ====================

/**
 * Optional: Show effect messages to the user
 *
 * You can use the toast system to show when picto effects activate:
 */
export function showPictoEffectMessage(message: string, toast: any) {
    toast.showToast(message, "info");
}
