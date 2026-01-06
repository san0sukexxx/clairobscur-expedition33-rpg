/**
 * WEAPON PASSIVES SYSTEM - MAIN INDEX
 *
 * This file initializes all weapon passive effects for the battle system.
 * Import this file in your battle logic to enable weapon passives.
 *
 * Total Weapons: 108 (27 Swords + 23 Lune + 24 Maelle + 12 Monoco + 22 Sciel)
 * Total Passives: ~300+ unique passive effects
 *
 * Usage:
 * ```typescript
 * import { executeWeaponPassives } from './utils/WeaponPassives_Index';
 *
 * // In battle logic:
 * const results = await executeWeaponPassives(
 *   "on-base-attack",
 *   playerCharacter,
 *   allCharacters,
 *   battleId,
 *   "Abysseram",
 *   12, // weapon level
 *   targetCharacter,
 *   { damageAmount: 150 }
 * );
 * ```
 */

// Import all weapon passive implementations
import "./WeaponPassiveEffects"; // Swords + core system
import "./WeaponPassiveEffects_Lune"; // Lune weapons
import "./WeaponPassiveEffects_All"; // Maelle, Monoco, Sciel weapons

// Re-export main functions for easy access
export {
  executeWeaponPassives,
  clearBattleWeaponTracking,
  clearTurnWeaponTracking,
  clearBattleStackingEffects,
  registerWeaponPassive
} from "./WeaponPassiveEffects";

// Re-export types
export type {
  WeaponPassiveTrigger,
  WeaponPassiveContext,
  WeaponPassiveResult
} from "./WeaponPassiveEffects";

/**
 * INTEGRATION GUIDE
 *
 * 1. Import in PlayerPage.tsx:
 *    import { executeWeaponPassives } from '../utils/WeaponPassives_Index';
 *
 * 2. Add weapon level tracking to player state:
 *    - Add weaponLevel field to character data
 *    - Track weapon level in player_weapon table (backend)
 *
 * 3. Execute passives at key battle moments:
 *
 *    // On battle start
 *    await executeWeaponPassives("on-battle-start", player, allChars, battleId, weaponName, weaponLevel);
 *
 *    // On turn start
 *    await executeWeaponPassives("on-turn-start", player, allChars, battleId, weaponName, weaponLevel);
 *
 *    // On base attack
 *    const results = await executeWeaponPassives(
 *      "on-base-attack",
 *      player,
 *      allChars,
 *      battleId,
 *      weaponName,
 *      weaponLevel,
 *      target,
 *      { damageAmount: baseDamage }
 *    );
 *
 *    // Apply modified damage if passive affects damage
 *    if (results.some(r => r.modifiedDamage)) {
 *      const modifiedDamage = results.find(r => r.modifiedDamage)?.modifiedDamage || baseDamage;
 *      // Use modifiedDamage instead of baseDamage
 *    }
 *
 *    // On skill used
 *    await executeWeaponPassives(
 *      "on-skill-used",
 *      player,
 *      allChars,
 *      battleId,
 *      weaponName,
 *      weaponLevel,
 *      target,
 *      {
 *        skillElement: "Fire",
 *        skillName: "Fireball",
 *        damageAmount: skillDamage
 *      }
 *    );
 *
 *    // On critical hit
 *    await executeWeaponPassives("on-critical-hit", player, allChars, battleId, weaponName, weaponLevel, target);
 *
 *    // On damage dealt (for damage modifiers)
 *    const damageResults = await executeWeaponPassives(
 *      "on-damage-dealt",
 *      player,
 *      allChars,
 *      battleId,
 *      weaponName,
 *      weaponLevel,
 *      target,
 *      { damageAmount: finalDamage, criticalHit: wasCrit }
 *    );
 *
 *    // On damage taken
 *    await executeWeaponPassives(
 *      "on-damage-taken",
 *      player,
 *      allChars,
 *      battleId,
 *      weaponName,
 *      weaponLevel,
 *      attacker,
 *      { damageAmount: damageTaken }
 *    );
 *
 * 4. Clean up on battle end:
 *    clearBattleWeaponTracking(battleId);
 *    clearBattleStackingEffects(battleId);
 *
 * 5. Clean up on turn end:
 *    clearTurnWeaponTracking(battleId);
 */

/**
 * TRIGGER REFERENCE
 *
 * Core Triggers:
 * - on-battle-start: When battle begins
 * - on-turn-start: At the start of character's turn
 * - on-base-attack: When using basic attack
 * - on-skill-used: When using any skill
 * - on-critical-hit: When landing a critical hit
 * - on-counterattack: When counterattacking
 * - on-damage-dealt: After dealing damage (for modifiers)
 * - on-damage-taken: After taking damage
 *
 * Advanced Triggers:
 * - on-rank-change: When Perfection Rank changes
 * - on-stance-change: When Maelle stance changes
 * - on-mask-change: When Monoco mask changes
 * - on-break: When breaking enemy shields
 * - on-free-aim: When using Free Aim shot
 * - on-heal: When healing occurs
 * - on-stain-consumed: When Lune consumes stains
 * - on-stain-generated: When stains are generated
 * - on-twilight-start: When Sciel enters Twilight
 * - on-mark-applied: When Mark status is applied
 * - on-shield-gained: When gaining shields
 * - on-shield-broken: When breaking shields
 * - on-parry: When successfully parrying
 * - on-revive: When being revived
 * - on-death: When dying
 * - on-kill: When killing an enemy
 * - on-gradient-use: When using gradient attack
 * - on-ap-gain: When gaining AP
 * - on-burn-applied: When Burn is applied
 * - on-buff-applied: When any buff is applied
 * - on-debuff-applied: When any debuff is applied
 */

/**
 * PASSIVE EFFECT PATTERNS
 *
 * 1. Damage Modifiers:
 *    - Check trigger and conditions
 *    - Return { success: true, modifiedDamage: damage * multiplier }
 *
 * 2. Status Effects:
 *    - Apply via await applyStatus(targetId, effectType, amount, duration)
 *    - Return { success: true, message: "..." }
 *
 * 3. Stacking Effects:
 *    - Use getStacks/addStack/resetStacks
 *    - Track across turns
 *    - Apply multiplier based on stacks
 *
 * 4. Once-per-battle/turn:
 *    - Use canActivateEffect + trackEffectActivation
 *    - Check before executing
 *
 * 5. Extra Turns:
 *    - Return { success: true, extraTurn: true }
 *
 * 6. Death Prevention:
 *    - Return { success: true, preventDeath: true }
 */

/**
 * TODO: Backend Integration Needed
 *
 * 1. Add weapon_level field to player_weapon table
 * 2. Add API endpoint to update weapon level
 * 3. Implement AP system (giveAP function)
 * 4. Implement perfection/rank system integration
 * 5. Implement stance system for Maelle
 * 6. Implement mask/bestial wheel for Monoco
 * 7. Implement stain system for Lune
 * 8. Implement Sun/Moon charge + Twilight system for Sciel
 * 9. Implement Foretell mechanic for Sciel
 * 10. Implement turn order modification for "play first" effects
 * 11. Implement gradient charge system
 * 12. Implement shield break/steal mechanics
 * 13. Add damage type conversion support
 * 14. Add skill AP cost modification system
 */
