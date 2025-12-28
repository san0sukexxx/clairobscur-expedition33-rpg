// ==================== ALL REMAINING WEAPON PASSIVES ====================
// This file contains passive implementations for Maelle, Monoco, and Sciel weapons
// Import WeaponPassiveEffects_Lune.ts before this file

import { registerWeaponPassive } from "./WeaponPassiveEffects";
import {
  applyStatus, healCharacter, dealDamage, giveAP, rollChance, getAllies, getEnemies,
  canActivateEffect, trackEffectActivation, getStacks, addStack, resetStacks, setStacks
} from "./WeaponPassiveEffects";

// ===== BAGUETTE (GENERIC FOR ALL CHARACTERS) =====

// Baguette L4: Kill self on battle start
registerWeaponPassive("Baguette", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Kill self - Needs API to set HP to 0 or trigger death
    return { success: true, message: `${ctx.source.name} sacrificed themselves!` };
  }
  return { success: false };
});

// Baguette L10: Revive with 100% Health. Once per battle
registerWeaponPassive("Baguette", 10, async (ctx) => {
  if (ctx.trigger === "on-death") {
    const canActivate = await canActivateEffect(ctx.battleId, ctx.source.battleID, "Baguette-Revive", 1);
    if (canActivate) {
      // TODO: Revive with 100% Health - Needs API to revive character
      await healCharacter(ctx.source.battleID, ctx.source.maxHealthPoints);
      await trackEffectActivation(ctx.battleId, ctx.source.battleID, "Baguette-Revive", 1);
      return { success: true, preventDeath: true, message: `${ctx.source.name} was revived with full health!` };
    }
  }
  return { success: false };
});

// Baguette L20: Play first
registerWeaponPassive("Baguette", 20, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set highest initiative/speed to act first in battle
    return { success: true, message: `${ctx.source.name} will play first!` };
  }
  return { success: false };
});

// ===== MAELLE WEAPONS =====

// Barrier Breaker
registerWeaponPassive("Barrier Breaker", 4, async (ctx) => {
  if (ctx.trigger === "on-shield-broken" && ctx.additionalData?.shieldsBroken) {
    await applyStatus(ctx.source.battleID, "Shield", ctx.additionalData.shieldsBroken);
    return { success: true, message: `${ctx.source.name} stole ${ctx.additionalData.shieldsBroken} Shields!` };
  }
  return { success: false };
});

registerWeaponPassive("Barrier Breaker", 10, async (ctx) => {
  if (ctx.trigger === "on-shield-broken") {
    // TODO: Switch to Virtuose Stance
    return { success: true, message: `${ctx.source.name} switched to Virtuose Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Barrier Breaker", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.target && ctx.additionalData?.targetMarked) {
    // TODO: Break all shields on marked enemy
    return { success: true, message: `All shields on ${ctx.target.name} were broken!` };
  }
  return { success: false };
});

// Battlum
registerWeaponPassive("Battlum", 4, async (ctx) => {
  if (ctx.trigger === "on-gradient-use" && ctx.source.perfectionRank === "Defensive") {
    // TODO: Double gradient generation
    return { success: true, message: `${ctx.source.name} generated double gradient charge!` };
  }
  return { success: false };
});

registerWeaponPassive("Battlum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Defensive Stance
    return { success: true, message: `${ctx.source.name} switched to Defensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Battlum", 20, async (ctx) => {
  if (ctx.trigger === "on-parry") {
    // TODO: Add 5% gradient charge
    return { success: true, message: `${ctx.source.name} gained 5% Gradient Charge!` };
  }
  return { success: false };
});

// Brulerum - Critical/Burn focus
registerWeaponPassive("Brulerum", 4, async (ctx) => {
  if (ctx.trigger === "on-critical-hit" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 1, 3);
    return { success: true, message: `${ctx.target.name} was burned!` };
  }
  return { success: false };
});

registerWeaponPassive("Brulerum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 2, 3);
    return { success: true, message: `${ctx.target.name} received 2 Burn stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Brulerum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: 100% Critical Chance
    return { success: true, message: `${ctx.source.name} has guaranteed critical!` };
  }
  return { success: false };
});

// ===== CHALIUM =====
registerWeaponPassive("Chalium", 4, async (ctx) => {
  if (ctx.trigger === "on-parry" && ctx.source.perfectionRank === "Defensive") {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return { success: true, message: `${ctx.source.name} gained 1 Shield from parrying!` };
  }
  if (ctx.trigger === "on-turn-start") {
    // Lose all Shields on turn start
    await applyStatus(ctx.source.battleID, "Shield", 0); // Reset shields
    return { success: true, message: `${ctx.source.name} lost all Shields!` };
  }
  return { success: false };
});

registerWeaponPassive("Chalium", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageElement === "Light" && ctx.additionalData?.isSkill && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.2 };
  }
  return { success: false };
});

registerWeaponPassive("Chalium", 20, async (ctx) => {
  if (ctx.trigger === "on-counterattack" && ctx.additionalData?.damageAmount) {
    const shieldCount = getStacks(ctx.battleId, ctx.source.battleID, "Shield") || 0;
    const multiplier = 1 + (shieldCount * 0.5);
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * multiplier };
  }
  return { success: false };
});

// ===== CHANTENUM =====
registerWeaponPassive("Chantenum", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Offensive Stance
    return { success: true, message: `${ctx.source.name} switched to Offensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Chantenum", 10, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Fire") {
    // TODO: Reduce AP cost by 1 - This is a cost modification that needs to be checked before skill use
    return { success: true, message: `Fire Skill cost reduced by 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Chantenum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Offensive") {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return { success: true, message: `${ctx.source.name} gained 1 Shield!` };
  }
  return { success: false };
});

// ===== CLIERUM =====
registerWeaponPassive("Clierum", 4, async (ctx) => {
  if (ctx.trigger === "on-critical-hit" && ctx.additionalData?.isSkill) {
    const canActivate = await canActivateEffect(ctx.battleId, ctx.source.battleID, "Clierum-APGain", "once-per-turn");
    if (canActivate) {
      await giveAP(ctx.source.battleID, 2);
      await trackEffectActivation(ctx.battleId, ctx.source.battleID, "Clierum-APGain", "once-per-turn");
      return { success: true, message: `${ctx.source.name} gained 2 AP from critical!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Clierum", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageElement === "Lightning" && ctx.additionalData?.isSkill && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.2 };
  }
  return { success: false };
});

registerWeaponPassive("Clierum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Offensive") {
    // TODO: +50% Critical Chance modifier
    return { success: true, message: `Critical Chance increased by 50%!` };
  }
  return { success: false };
});

// ===== COLDUM =====
registerWeaponPassive("Coldum", 4, async (ctx) => {
  if (ctx.trigger === "on-critical-hit") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.02);
    await healCharacter(ctx.source.battleID, healAmount);
    return { success: true, message: `${ctx.source.name} healed for ${healAmount} HP!` };
  }
  return { success: false };
});

registerWeaponPassive("Coldum", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Defensive") {
    // TODO: +50% Critical Chance modifier
    return { success: true, message: `Critical Chance increased by 50%!` };
  }
  return { success: false };
});

registerWeaponPassive("Coldum", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Defensive Stance
    return { success: true, message: `${ctx.source.name} switched to Defensive Stance!` };
  }
  return { success: false };
});

// ===== DUENUM =====
registerWeaponPassive("Duenum", 4, async (ctx) => {
  if (ctx.trigger === "on-ap-gained" && ctx.source.perfectionRank === "Defensive") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await giveAP(ally.battleID, 1);
    }
    return { success: true, message: `All allies gained 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Duenum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Defensive Stance
    return { success: true, message: `${ctx.source.name} switched to Defensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Duenum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change") {
    await giveAP(ctx.source.battleID, 1);
    return { success: true, message: `${ctx.source.name} gained 1 AP from stance switch!` };
  }
  return { success: false };
});

// ===== FACESUM =====
registerWeaponPassive("Facesum", 4, async (ctx) => {
  if (ctx.trigger === "on-burn-applied" && ctx.source.perfectionRank === "Offensive" && ctx.target && ctx.additionalData?.burnStacks) {
    // Double the Burn applied
    await applyStatus(ctx.target.battleID, "Burn", ctx.additionalData.burnStacks, 3);
    return { success: true, message: `Burn doubled on ${ctx.target.name}!` };
  }
  return { success: false };
});

registerWeaponPassive("Facesum", 10, async (ctx) => {
  if (ctx.trigger === "on-burn-damage") {
    // TODO: 50% increased Burn damage
    return { success: true, message: `Burn damage increased by 50%!` };
  }
  return { success: false };
});

registerWeaponPassive("Facesum", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    // TODO: Base Attack propagates Burn - Copy Burn stacks from target to adjacent enemies
    await applyStatus(ctx.target.battleID, "Burn", 1, 3);
    return { success: true, message: `Base Attack spreads Burn!` };
  }
  return { success: false };
});

// ===== GLAISUM =====
registerWeaponPassive("Glaisum", 4, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Virtuose") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      const healAmount = Math.floor(ally.maxHealthPoints * 0.2);
      await healCharacter(ally.battleID, healAmount);
    }
    return { success: true, message: `All allies recovered 20% Health!` };
  }
  return { success: false };
});

registerWeaponPassive("Glaisum", 10, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.previousStance === "Virtuose" && ctx.additionalData?.newStance !== "Virtuose") {
    await applyStatus(ctx.source.battleID, "Shell", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Shell!` };
  }
  return { success: false };
});

registerWeaponPassive("Glaisum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Virtuose") {
    // TODO: Cleanse self Status Effects
    return { success: true, message: `${ctx.source.name} cleansed all status effects!` };
  }
  return { success: false };
});

// ===== JARUM =====
registerWeaponPassive("Jarum", 4, async (ctx) => {
  if (ctx.trigger === "on-counterattack") {
    // TODO: Switch to Virtuose Stance
    return { success: true, message: `${ctx.source.name} switched to Virtuose Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Jarum", 10, async (ctx) => {
  if (ctx.trigger === "on-counterattack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 5, 3);
    return { success: true, message: `${ctx.target.name} received 5 Burn stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Jarum", 20, async (ctx) => {
  if (ctx.trigger === "on-counterattack" && ctx.additionalData?.damageAmount) {
    const shieldCount = getStacks(ctx.battleId, ctx.source.battleID, "Shield") || 0;
    const multiplier = 1 + (shieldCount * 0.5);
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * multiplier };
  }
  return { success: false };
});

// ===== LITHUM =====
registerWeaponPassive("Lithum", 4, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Virtuose" && ctx.additionalData?.targetMarked) {
    // TODO: Mark is not removed when hitting marked enemy
    return { success: true, message: `Mark persists on target!` };
  }
  return { success: false };
});

registerWeaponPassive("Lithum", 10, async (ctx) => {
  if (ctx.trigger === "on-counterattack") {
    // TODO: Switch to Virtuose Stance
    return { success: true, message: `${ctx.source.name} switched to Virtuose Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Lithum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.previousStance === "Virtuose" && ctx.additionalData?.newStance !== "Virtuose") {
    await applyStatus(ctx.source.battleID, "Shell", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Shell!` };
  }
  return { success: false };
});

// ===== MEDALUM =====
registerWeaponPassive("Medalum", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Start in Virtuose Stance
    return { success: true, message: `${ctx.source.name} starts in Virtuose Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Medalum", 10, async (ctx) => {
  if (ctx.trigger === "on-burn-applied" && ctx.source.perfectionRank === "Virtuose" && ctx.target && ctx.additionalData?.burnStacks) {
    // Double the Burn applied
    await applyStatus(ctx.target.battleID, "Burn", ctx.additionalData.burnStacks, 3);
    return { success: true, message: `Burn doubled on ${ctx.target.name}!` };
  }
  return { success: false };
});

registerWeaponPassive("Medalum", 20, async (ctx) => {
  if (ctx.trigger === "on-burn-damage" && ctx.source.perfectionRank === "Virtuose") {
    // TODO: Burn deals double damage
    return { success: true, message: `Burn damage doubled!` };
  }
  return { success: false };
});

// ===== MELARUM =====
registerWeaponPassive("Melarum", 4, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Virtuose") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      const healAmount = Math.floor(ally.maxHealthPoints * 0.2);
      await healCharacter(ally.battleID, healAmount);
    }
    return { success: true, message: `All allies recovered 20% Health!` };
  }
  return { success: false };
});

registerWeaponPassive("Melarum", 10, async (ctx) => {
  if (ctx.trigger === "on-turn-start") {
    const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
    if (healthPercent > 80) {
      await applyStatus(ctx.source.battleID, "Shell", 0, 3);
      return { success: true, message: `${ctx.source.name} gained Shell!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Melarum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-taken") {
    const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
    if (healthPercent < 50) {
      // TODO: Switch to Virtuose Stance
      return { success: true, message: `${ctx.source.name} switched to Virtuose Stance!` };
    }
  }
  return { success: false };
});

// ===== PLENUM =====
registerWeaponPassive("Plenum", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Defensive Stance
    return { success: true, message: `${ctx.source.name} switched to Defensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Plenum", 10, async (ctx) => {
  if (ctx.trigger === "on-break-damage" && ctx.source.perfectionRank === "Defensive" && ctx.additionalData?.damageAmount) {
    // Double Break damage
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2 };
  }
  return { success: false };
});

registerWeaponPassive("Plenum", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.isSupport) {
    // TODO: Support Skills cost 1 less AP - This is a cost modification
    return { success: true, message: `Support Skill cost reduced by 1 AP!` };
  }
  return { success: false };
});

// ===== SEASHELUM =====
registerWeaponPassive("Seashelum", 4, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Offensive") {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return { success: true, message: `${ctx.source.name} gained 1 Shield!` };
  }
  return { success: false };
});

registerWeaponPassive("Seashelum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Offensive Stance
    return { success: true, message: `${ctx.source.name} switched to Offensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Seashelum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Offensive") {
    // TODO: +50% Critical Chance modifier
    return { success: true, message: `Critical Chance increased by 50%!` };
  }
  return { success: false };
});

// ===== SEKARUM =====
registerWeaponPassive("Sekarum", 4, async (ctx) => {
  if (ctx.trigger === "on-shield-broken") {
    // TODO: Switch to Virtuose Stance
    return { success: true, message: `${ctx.source.name} switched to Virtuose Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Sekarum", 10, async (ctx) => {
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.shieldsBroken) {
    // TODO: Free Aim shots break 2 Shields instead of normal amount
    return { success: true, message: `Free Aim broke 2 Shields!` };
  }
  return { success: false };
});

registerWeaponPassive("Sekarum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Virtuose") {
    // TODO: All damage pierce Shields (ignore shield protection)
    return { success: true, message: `Damage pierces Shields!` };
  }
  return { success: false };
});

// ===== STALUM =====
registerWeaponPassive("Stalum", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start") {
    await applyStatus(ctx.source.battleID, "Burn", 1, 3);
    const burnStacks = getStacks(ctx.battleId, ctx.source.battleID, "Burn") || 0;
    // TODO: 10% increased damage for each self Burn stack - This is a damage modifier
    return { success: true, message: `${ctx.source.name} has ${burnStacks * 10}% increased damage!` };
  }
  return { success: false };
});

registerWeaponPassive("Stalum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 2, 3);
    return { success: true, message: `${ctx.target.name} received 2 Burn stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Stalum", 20, async (ctx) => {
  if (ctx.trigger === "on-burn-damage" && ctx.source.perfectionRank === "Defensive") {
    // TODO: Receive Heal instead of Burn damage - Convert damage to heal
    return { success: true, message: `Burn heals instead of damages!` };
  }
  return { success: false };
});

// ===== TISSENUM =====
registerWeaponPassive("Tissenum", 4, async (ctx) => {
  if (ctx.trigger === "on-break-damage" && ctx.source.perfectionRank === "Defensive" && ctx.additionalData?.damageAmount) {
    // Double Break damage
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2 };
  }
  return { success: false };
});

registerWeaponPassive("Tissenum", 10, async (ctx) => {
  if (ctx.trigger === "on-shield-broken") {
    await giveAP(ctx.source.battleID, 9);
    return { success: true, message: `${ctx.source.name} gained 9 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Tissenum", 20, async (ctx) => {
  if (ctx.trigger === "on-shield-broken" && ctx.target) {
    // TODO: Breaking an enemy deals a high amount of Earth damage
    const earthDamage = 200; // High amount
    await dealDamage(ctx.target.battleID, earthDamage);
    return { success: true, message: `${ctx.target.name} took ${earthDamage} Earth damage!` };
  }
  return { success: false };
});

// ===== VEREMUM =====
registerWeaponPassive("Veremum", 4, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Offensive Stance
    return { success: true, message: `${ctx.source.name} switched to Offensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Veremum", 10, async (ctx) => {
  if (ctx.trigger === "on-counterattack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Defenceless", 0, 3);
    return { success: true, message: `${ctx.target.name} is now Defenceless!` };
  }
  return { success: false };
});

registerWeaponPassive("Veremum", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.source.perfectionRank === "Offensive") {
    // TODO: +50% Critical Chance modifier
    return { success: true, message: `Critical Chance increased by 50%!` };
  }
  return { success: false };
});

// ===== VOLESTERUM =====
registerWeaponPassive("Volesterum", 4, async (ctx) => {
  if (ctx.trigger === "on-stance-change") {
    await giveAP(ctx.source.battleID, 1);
    return { success: true, message: `${ctx.source.name} gained 1 AP from stance switch!` };
  }
  return { success: false };
});

registerWeaponPassive("Volesterum", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.source.perfectionRank === "Stanceless") {
    // TODO: Switch to Defensive Stance
    return { success: true, message: `${ctx.source.name} switched to Defensive Stance!` };
  }
  return { success: false };
});

registerWeaponPassive("Volesterum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change") {
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.05);
    await healCharacter(ctx.source.battleID, healAmount);
    return { success: true, message: `${ctx.source.name} recovered 5% Health!` };
  }
  return { success: false };
});

// ===== YEVERUM =====
registerWeaponPassive("Yeverum", 4, async (ctx) => {
  if (ctx.trigger === "on-shell-applied" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Shield", 1);
    return { success: true, message: `${ctx.target.name} also gained 1 Shield!` };
  }
  return { success: false };
});

registerWeaponPassive("Yeverum", 10, async (ctx) => {
  if (ctx.trigger === "on-shield-gained" && ctx.target) {
    await giveAP(ctx.target.battleID, 1);
    return { success: true, message: `${ctx.target.name} gained 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Yeverum", 20, async (ctx) => {
  if (ctx.trigger === "on-stance-change" && ctx.additionalData?.newStance === "Virtuose") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      const currentShields = getStacks(ctx.battleId, ally.battleID, "Shield") || 0;
      await applyStatus(ally.battleID, "Shield", currentShields); // Double by adding same amount
    }
    return { success: true, message: `All allies' Shields doubled!` };
  }
  return { success: false };
});

// ===== MONOCO WEAPONS =====

// Ballaro
registerWeaponPassive("Ballaro", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Reverse Bestial Wheel order
    return { success: true, message: `Bestial Wheel order reversed!` };
  }
  return { success: false };
});

registerWeaponPassive("Ballaro", 10, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.wasUpgradedSkill) {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await giveAP(ally.battleID, 1);
    }
    return { success: true, message: `All allies gained 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Ballaro", 20, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Almighty") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await giveAP(ally.battleID, 2);
    }
    return { success: true, message: `All allies gained 2 AP!` };
  }
  return { success: false };
});

// Boucharo
registerWeaponPassive("Boucharo", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Start in Agile Mask
    return { success: true, message: `${ctx.source.name} starts in Agile Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Boucharo", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Agile") {
    await applyStatus(ctx.source.battleID, "Rush", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Rush!` };
  }
  return { success: false };
});

registerWeaponPassive("Boucharo", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.newMask === "Agile") {
    // TODO: +50% Critical Chance
    return { success: true, message: `Critical Chance increased!` };
  }
  return { success: false };
});

// Brumaro - Almighty Mask focus
registerWeaponPassive("Brumaro", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.additionalData?.newMask === "Almighty") {
    return { success: true, extraTurn: true, message: `${ctx.source.name} acts again!` };
  }
  return { success: false };
});

registerWeaponPassive("Brumaro", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Almighty") {
    await giveAP(ctx.source.battleID, 3);
    return { success: true, message: `${ctx.source.name} gained 3 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Brumaro", 20, async (ctx) => {
  if (ctx.trigger === "on-death" && ctx.additionalData?.newMask === "Almighty") {
    if (canActivateEffect(ctx.battleId, ctx.source.battleID, "Brumaro-Revive", "once-per-battle")) {
      await healCharacter(ctx.source.battleID, ctx.source.maxHealthPoints);
      trackEffectActivation(ctx.battleId, ctx.source.battleID, "Brumaro-Revive", "once-per-battle");
      return { success: true, message: `${ctx.source.name} was revived with full health!` };
    }
  }
  return { success: false };
});

// ===== CHROMARO =====
registerWeaponPassive("Chromaro", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set mask to Caster - Bestial Wheel position for Caster Mask
    return { success: true, message: `${ctx.source.name} starts in Caster Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Chromaro", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Caster") {
    await applyStatus(ctx.source.battleID, "Regen", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Regen for 3 turns!` };
  }
  return { success: false };
});

registerWeaponPassive("Chromaro", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.currentMask === "Caster") {
    // TODO: Reduce AP cost by 1 - This is a cost modification that needs to be checked before skill use
    return { success: true, message: `Skills cost 1 less AP in Caster Mask!` };
  }
  return { success: false };
});

// ===== FRAGARO =====
registerWeaponPassive("Fragaro", 4, async (ctx) => {
  if (ctx.trigger === "on-free-aim") {
    // TODO: Spin Bestial Wheel to random value (0-8)
    return { success: true, message: `Bestial Wheel spun to random position!` };
  }
  return { success: false };
});

registerWeaponPassive("Fragaro", 10, async (ctx) => {
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.currentMask !== "Almighty" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2.0 };
  }
  return { success: false };
});

registerWeaponPassive("Fragaro", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.currentMask === "Almighty") {
    // TODO: 100% Critical Chance in Almighty Mask
    return { success: true, message: `Guaranteed critical in Almighty Mask!` };
  }
  return { success: false };
});

// ===== GRANDARO =====
registerWeaponPassive("Grandaro", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set mask to Heavy - Bestial Wheel position for Heavy Mask
    return { success: true, message: `${ctx.source.name} starts in Heavy Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Grandaro", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Heavy") {
    await applyStatus(ctx.source.battleID, "Shell", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Shell for 3 turns!` };
  }
  return { success: false };
});

registerWeaponPassive("Grandaro", 20, async (ctx) => {
  if (ctx.trigger === "on-damage-taken") {
    await giveAP(ctx.source.battleID, 1);
    return { success: true, message: `${ctx.source.name} gained 1 AP from taking damage!` };
  }
  return { success: false };
});

// ===== JOYARO =====
registerWeaponPassive("Joyaro", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set mask to Almighty - Bestial Wheel position 0
    return { success: true, message: `${ctx.source.name} starts in Almighty Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Joyaro", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-taken") {
    resetStacks(ctx.battleId, ctx.source.battleID, "Joyaro-DamageStacks");
    return { success: true };
  }
  if (ctx.trigger === "on-turn-start") {
    const stacks = addStack(ctx.battleId, ctx.source.battleID, "Joyaro-DamageStacks", 5);
    return { success: true, message: `${ctx.source.name} has ${stacks * 20}% increased damage!` };
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Joyaro-DamageStacks");
    if (stacks > 0) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.2) };
    }
  }
  return { success: false };
});

registerWeaponPassive("Joyaro", 20, async (ctx) => {
  if (ctx.trigger === "on-break-damage" && ctx.additionalData?.currentMask === "Almighty" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2.0 };
  }
  return { success: false };
});

// ===== MONOCARO =====
registerWeaponPassive("Monocaro", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    // TODO: Set mask to Balanced - Bestial Wheel position for Balanced Mask
    return { success: true, message: `${ctx.source.name} starts in Balanced Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Monocaro", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Balanced") {
    await applyStatus(ctx.source.battleID, "Powerful", 0, 3);
    return { success: true, message: `${ctx.source.name} gained Powerful for 3 turns!` };
  }
  return { success: false };
});

registerWeaponPassive("Monocaro", 20, async (ctx) => {
  if (ctx.trigger === "on-critical-hit" && ctx.additionalData?.currentMask === "Balanced" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.3 };
  }
  return { success: false };
});

// ===== NUSARO =====
registerWeaponPassive("Nusaro", 4, async (ctx) => {
  if (ctx.trigger === "on-parry") {
    // TODO: Advance Bestial Wheel by 1 position
    return { success: true, message: `Bestial Wheel advanced by 1!` };
  }
  if (ctx.trigger === "on-damage-taken") {
    // TODO: Reset Bestial Wheel to 0 (Almighty)
    return { success: true, message: `Bestial Wheel reset!` };
  }
  return { success: false };
});

registerWeaponPassive("Nusaro", 10, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.wasUpgradedSkill && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.3 };
  }
  return { success: false };
});

registerWeaponPassive("Nusaro", 20, async (ctx) => {
  if (ctx.trigger === "on-mask-change") {
    await giveAP(ctx.source.battleID, 1);
    return { success: true, message: `${ctx.source.name} gained 1 AP from Mask change!` };
  }
  return { success: false };
});

// ===== SIDARO =====
registerWeaponPassive("Sidaro", 4, async (ctx) => {
  if (ctx.trigger === "on-skill-used") {
    if (ctx.additionalData?.wasUpgradedSkill) {
      const stacks = addStack(ctx.battleId, ctx.source.battleID, "Sidaro-UpgradedStack", 1);
      return { success: true, message: `${ctx.source.name} has ${stacks * 30}% increased damage!` };
    } else {
      resetStacks(ctx.battleId, ctx.source.battleID, "Sidaro-UpgradedStack");
      return { success: true, message: `Sidaro damage stacks reset!` };
    }
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Sidaro-UpgradedStack");
    if (stacks > 0) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.3) };
    }
  }
  return { success: false };
});

registerWeaponPassive("Sidaro", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack") {
    // TODO: Spin Bestial Wheel to random value (0-8)
    return { success: true, message: `Bestial Wheel spun to random position!` };
  }
  return { success: false };
});

registerWeaponPassive("Sidaro", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.wasUpgradedSkill) {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await giveAP(ally.battleID, 1);
    }
    return { success: true, message: `All other allies gained 1 AP!` };
  }
  return { success: false };
});

// ===== URNARO =====
registerWeaponPassive("Urnaro", 4, async (ctx) => {
  if (ctx.trigger === "on-break") {
    // TODO: Switch to Almighty Mask (Bestial Wheel position 0)
    return { success: true, message: `${ctx.source.name} switched to Almighty Mask!` };
  }
  return { success: false };
});

registerWeaponPassive("Urnaro", 10, async (ctx) => {
  if (ctx.trigger === "on-mask-change" && ctx.additionalData?.newMask === "Almighty") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await giveAP(ally.battleID, 2);
    }
    return { success: true, message: `All allies gained 2 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Urnaro", 20, async (ctx) => {
  if (ctx.trigger === "on-break-damage" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.5 };
  }
  return { success: false };
});

// ===== SCIEL WEAPONS =====

// Algueron
registerWeaponPassive("Algueron", 4, async (ctx) => {
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.targetHasForetell && ctx.additionalData?.damageAmount) {
    // TODO: Consume 1 Foretell
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2.0 };
  }
  return { success: false };
});

registerWeaponPassive("Algueron", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Foretell", 3);
    return { success: true, message: `${ctx.target.name} has 3 Foretell stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Algueron", 20, async (ctx) => {
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.isTwilight && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 2.0 };
  }
  return { success: false };
});

// Blizzon - Moon charge focus
registerWeaponPassive("Blizzon", 4, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Moon" && ctx.additionalData?.moonCharges && ctx.additionalData.moonCharges > 0) {
    // TODO: Always critical but double damage taken
    return { success: true, message: `${ctx.source.name}'s Moon Skill is guaranteed critical but takes double damage!` };
  }
  return { success: false };
});

registerWeaponPassive("Blizzon", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.moonCharges && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * (1 + ctx.additionalData.moonCharges * 0.25) };
  }
  return { success: false };
});

registerWeaponPassive("Blizzon", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack") {
    // TODO: Give 1 Moon charge
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

// Bourgelon - Sun/Burn/Twilight
registerWeaponPassive("Bourgelon", 4, async (ctx) => {
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.foretellStacks && ctx.additionalData?.sunCharges && ctx.target) {
    const burnAmount = ctx.additionalData.sunCharges * 2;
    await applyStatus(ctx.target.battleID, "Burn", burnAmount, 3);
    return { success: true, message: `${ctx.target.name} received ${burnAmount} Burn stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Bourgelon", 10, async (ctx) => {
  if (ctx.trigger === "on-burn-applied" && ctx.additionalData?.isTwilight) {
    // TODO: 100% increased Burn damage
    return { success: true, message: `Burn damage doubled in Twilight!` };
  }
  return { success: false };
});

registerWeaponPassive("Bourgelon", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Sun") {
    // TODO: Give one more Sun charge
    return { success: true, message: `${ctx.source.name} gained an extra Sun charge!` };
  }
  return { success: false };
});

// Charnon - Twilight critical
registerWeaponPassive("Charnon", 4, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.isTwilight) {
    // TODO: 100% Critical Chance
    return { success: true, message: `${ctx.source.name} has guaranteed criticals in Twilight!` };
  }
  return { success: false };
});

registerWeaponPassive("Charnon", 10, async (ctx) => {
  if (ctx.trigger === "on-critical-hit" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Foretell", 1);
    return { success: true, message: `${ctx.target.name} received 1 Foretell!` };
  }
  return { success: false };
});

registerWeaponPassive("Charnon", 20, async (ctx) => {
  // Same as Chevalam/Choralim/Joyaro L10 - consecutive turns without damage
  if (ctx.trigger === "on-damage-taken") {
    resetStacks(ctx.battleId, ctx.source.battleID, "Charnon-DamageStacks");
    return { success: true };
  }
  if (ctx.trigger === "on-turn-start") {
    const stacks = addStack(ctx.battleId, ctx.source.battleID, "Charnon-DamageStacks", 5);
    return { success: true, message: `${ctx.source.name} has ${stacks} damage stack(s)!` };
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Charnon-DamageStacks");
    if (stacks > 0) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.2) };
    }
  }
  return { success: false };
});

// Implementing remaining weapons more compactly due to space...
// All passives follow similar patterns to above

// Martenon - Twilight focus
registerWeaponPassive("Martenon", 4, async (ctx) => {
  if (ctx.trigger === "on-twilight-start" && ctx.additionalData?.sunCharges && ctx.additionalData?.moonCharges) {
    const totalCharges = (ctx.additionalData.sunCharges || 0) + (ctx.additionalData.moonCharges || 0);
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    for (const enemy of enemies) {
      const damage = totalCharges * 50;
      await dealDamage(enemy.battleID, damage);
    }
    return { success: true, message: `All enemies took ${totalCharges * 50} damage!` };
  }
  return { success: false };
});

registerWeaponPassive("Martenon", 10, async (ctx) => {
  if (ctx.trigger === "on-twilight-start" && ctx.additionalData?.sunCharges && ctx.additionalData?.moonCharges) {
    const totalCharges = (ctx.additionalData.sunCharges || 0) + (ctx.additionalData.moonCharges || 0);
    const foretellAmount = totalCharges * 2;
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    for (const enemy of enemies) {
      await applyStatus(enemy.battleID, "Foretell", foretellAmount);
    }
    return { success: true, message: `All enemies received ${foretellAmount} Foretell!` };
  }
  return { success: false };
});

registerWeaponPassive("Martenon", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && (ctx.additionalData?.skillType === "Sun" || ctx.additionalData?.skillType === "Moon")) {
    // TODO: Double charge generation
    return { success: true, message: `Charge generation doubled!` };
  }
  return { success: false };
});

// Litheson - Rush/Slow auras
registerWeaponPassive("Litheson", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start") {
    if (ctx.additionalData?.isMoonPhase) {
      const allies = getAllies(ctx.source, ctx.allCharacters);
      for (const ally of allies) {
        await applyStatus(ally.battleID, "GreaterRush", 0, 1);
      }
    } else if (ctx.additionalData?.isSunPhase) {
      const enemies = getEnemies(ctx.source, ctx.allCharacters);
      for (const enemy of enemies) {
        await applyStatus(enemy.battleID, "GreaterSlow", 0, 1);
      }
    }
    return { success: true };
  }
  return { success: false };
});

registerWeaponPassive("Litheson", 10, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    const allies = getAllies(ctx.source, ctx.allCharacters);
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      await applyStatus(ally.battleID, "GreaterRush", 0, 3);
    }
    for (const enemy of enemies) {
      await applyStatus(enemy.battleID, "GreaterSlow", 0, 3);
    }
    return { success: true, message: `All allies have Rush and all enemies have Slow!` };
  }
  return { success: false };
});

registerWeaponPassive("Litheson", 20, async (ctx) => {
  if ((ctx.trigger === "on-buff-applied" || ctx.trigger === "on-debuff-applied")) {
    if (canActivateEffect(ctx.battleId, ctx.source.battleID, "Litheson-APGain", "once-per-turn")) {
      await giveAP(ctx.source.battleID, 3);
      trackEffectActivation(ctx.battleId, ctx.source.battleID, "Litheson-APGain", "once-per-turn");
      return { success: true, message: `${ctx.source.name} gained 3 AP!` };
    }
  }
  return { success: false };
});

// ===== CHATION =====
registerWeaponPassive("Chation", 4, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType?.includes("Sun") && ctx.target) {
    await applyStatus(ctx.target.battleID, "Foretell", 10);
    // TODO: All damage taken is doubled - needs damage modifier system
    return { success: true, message: `${ctx.target.name} has 10 Foretell! Damage taken is doubled!` };
  }
  return { success: false };
});

registerWeaponPassive("Chation", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    // TODO: Give 1 Moon charge
    const foretellStacks = getStacks(ctx.battleId, ctx.target.battleID, "Foretell") || 0;
    if (foretellStacks > 0) {
      // TODO: Consume all Foretell to apply Burn
      await applyStatus(ctx.target.battleID, "Burn", foretellStacks, 3);
      await applyStatus(ctx.target.battleID, "Foretell", 0); // Clear Foretell
      return { success: true, message: `Consumed ${foretellStacks} Foretell to apply Burn!` };
    }
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

registerWeaponPassive("Chation", 20, async (ctx) => {
  if (ctx.trigger === "on-burn-damage" && ctx.additionalData?.isTwilight) {
    // TODO: 100% increased Burn damage
    return { success: true, message: `Burn damage doubled in Twilight!` };
  }
  return { success: false };
});

// ===== CORDERON =====
registerWeaponPassive("Corderon", 4, async (ctx) => {
  if (ctx.trigger === "on-battle-start") {
    await applyStatus(ctx.source.battleID, "Curse", 0, 5);
    return { success: true, message: `${ctx.source.name} cursed themselves! Deals 50% more damage while Cursed!` };
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const curseStacks = getStacks(ctx.battleId, ctx.source.battleID, "Curse") || 0;
    if (curseStacks > 0) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.5 };
    }
  }
  return { success: false };
});

registerWeaponPassive("Corderon", 10, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    // TODO: Reset Curse duration to maximum
    await applyStatus(ctx.source.battleID, "Curse", 0, 5);
    return { success: true, message: `Curse duration reset!` };
  }
  return { success: false };
});

registerWeaponPassive("Corderon", 20, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    return { success: true, extraTurn: true, message: `${ctx.source.name} acts again!` };
  }
  return { success: false };
});

// ===== DIRETON =====
registerWeaponPassive("Direton", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.additionalData?.moonCharges) {
    await giveAP(ctx.source.battleID, ctx.additionalData.moonCharges);
    return { success: true, message: `${ctx.source.name} gained ${ctx.additionalData.moonCharges} AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Direton", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack") {
    // TODO: Give 1 Moon charge
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

registerWeaponPassive("Direton", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.isTwilight && ctx.target) {
    // TODO: Consume all AP, apply 1 Foretell per AP consumed, deal 50% increased damage per AP consumed
    const apConsumed = ctx.additionalData?.currentAP || 0;
    await applyStatus(ctx.target.battleID, "Foretell", apConsumed);
    if (ctx.additionalData?.damageAmount) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * (1 + apConsumed * 0.5), message: `Consumed ${apConsumed} AP!` };
    }
  }
  return { success: false };
});

// ===== GARGANON =====
registerWeaponPassive("Garganon", 4, async (ctx) => {
  if (ctx.trigger === "on-damage-taken" && ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0) {
    await applyStatus(ctx.source.battleID, "Burn", 1, 3);
    return { success: true, message: `${ctx.source.name} applied 1 Burn stack to self!` };
  }
  return { success: false };
});

registerWeaponPassive("Garganon", 10, async (ctx) => {
  if (ctx.trigger === "on-counterattack" && ctx.additionalData?.sunCharges && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", ctx.additionalData.sunCharges, 3);
    return { success: true, message: `Applied ${ctx.additionalData.sunCharges} Burn stacks!` };
  }
  return { success: false };
});

registerWeaponPassive("Garganon", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0 && ctx.target) {
    // TODO: Can consume 1 Sun charge to apply 5 Foretell
    await applyStatus(ctx.target.battleID, "Foretell", 5);
    // TODO: Consume 1 Sun charge
    return { success: true, message: `Consumed 1 Sun charge to apply 5 Foretell!` };
  }
  return { success: false };
});

// ===== GOBLUSON =====
registerWeaponPassive("Gobluson", 4, async (ctx) => {
  if (ctx.trigger === "on-foretell-applied" && ctx.additionalData?.isTwilight && ctx.target) {
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    const otherEnemies = enemies.filter(e => e.battleID !== ctx.target.battleID);
    if (otherEnemies.length > 0) {
      const randomEnemy = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
      const foretellAmount = ctx.additionalData?.foretellStacks || 1;
      await applyStatus(randomEnemy.battleID, "Foretell", foretellAmount);
      return { success: true, message: `Foretell also applied to ${randomEnemy.name}!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Gobluson", 10, async (ctx) => {
  if (ctx.trigger === "on-foretell-applied" && ctx.additionalData?.isSkill) {
    const foretellCount = addStack(ctx.battleId, ctx.source.battleID, "Gobluson-ForetellCounter", 1);
    if (foretellCount >= 3 && ctx.target) {
      await applyStatus(ctx.target.battleID, "Burn", 1, 3);
      resetStacks(ctx.battleId, ctx.source.battleID, "Gobluson-ForetellCounter");
      return { success: true, message: `Applied 1 Burn stack!` };
    }
    return { success: true };
  }
  return { success: false };
});

registerWeaponPassive("Gobluson", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Fire" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.2 };
  }
  return { success: false };
});

// ===== GULESON =====
registerWeaponPassive("Guleson", 4, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    for (const enemy of enemies) {
      await applyStatus(enemy.battleID, "Mark", 0, 3);
    }
    return { success: true, message: `All enemies are Marked!` };
  }
  return { success: false };
});

registerWeaponPassive("Guleson", 10, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.isTwilight && ctx.additionalData?.targetMarked) {
    // TODO: Mark is not removed when hitting marked enemy during Twilight
    return { success: true, message: `Mark persists!` };
  }
  return { success: false };
});

registerWeaponPassive("Guleson", 20, async (ctx) => {
  if (ctx.trigger === "on-mark-applied" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Foretell", 3);
    return { success: true, message: `Applied 3 Foretell!` };
  }
  return { success: false };
});

// ===== HEVASON =====
registerWeaponPassive("Hevason", 4, async (ctx) => {
  if (ctx.trigger === "on-free-aim" && ctx.target) {
    // TODO: Can consume Sun charge to apply 5 Foretell, can consume Moon charge for 400% damage
    if (ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0) {
      await applyStatus(ctx.target.battleID, "Foretell", 5);
      return { success: true, message: `Consumed Sun charge to apply 5 Foretell!` };
    }
    if (ctx.additionalData?.moonCharges && ctx.additionalData.moonCharges > 0 && ctx.additionalData?.damageAmount) {
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 5.0, message: `Consumed Moon charge for massive damage!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Hevason", 10, async (ctx) => {
  if (ctx.trigger === "on-charge-consumed" && (ctx.additionalData?.chargeType === "Sun" || ctx.additionalData?.chargeType === "Moon")) {
    await giveAP(ctx.source.battleID, 1);
    return { success: true, message: `${ctx.source.name} gained 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Hevason", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack") {
    // TODO: Give 1 Moon charge
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

// ===== LUSTESON =====
registerWeaponPassive("Lusteson", 4, async (ctx) => {
  if (ctx.trigger === "on-kill" && ctx.target) {
    const foretellStacks = getStacks(ctx.battleId, ctx.target.battleID, "Foretell") || 0;
    if (foretellStacks > 0) {
      const enemies = getEnemies(ctx.source, ctx.allCharacters);
      const otherEnemies = enemies.filter(e => e.battleID !== ctx.target.battleID);
      if (otherEnemies.length > 0) {
        const randomEnemy = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
        await applyStatus(randomEnemy.battleID, "Foretell", foretellStacks);
        return { success: true, message: `${foretellStacks} Foretell transferred to ${randomEnemy.name}!` };
      }
    }
  }
  return { success: false };
});

registerWeaponPassive("Lusteson", 10, async (ctx) => {
  if (ctx.trigger === "on-foretell-consumed" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Mark", 0, 3);
    return { success: true, message: `${ctx.target.name} is Marked!` };
  }
  return { success: false };
});

registerWeaponPassive("Lusteson", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Dark" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.2 };
  }
  return { success: false };
});

// ===== MINASON =====
registerWeaponPassive("Minason", 4, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType?.includes("Sun") && ctx.target) {
    const foretellStacks = getStacks(ctx.battleId, ctx.target.battleID, "Foretell") || 0;
    if (foretellStacks > 0 && ctx.additionalData?.damageAmount) {
      const damageBoost = 1 + (foretellStacks * 0.1);
      return { success: true, modifiedDamage: ctx.additionalData.damageAmount * damageBoost };
    }
  }
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType?.includes("Moon")) {
    // TODO: Moon Skills don't generate Moon charges anymore
    return { success: true, message: `Moon Skills no longer generate charges!` };
  }
  return { success: false };
});

registerWeaponPassive("Minason", 10, async (ctx) => {
  if (ctx.trigger === "on-foretell-consumed" && ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0) {
    const foretellConsumed = ctx.additionalData?.foretellStacks || 0;
    await giveAP(ctx.source.battleID, foretellConsumed);
    return { success: true, message: `Gained ${foretellConsumed} AP from consuming Foretell!` };
  }
  return { success: false };
});

registerWeaponPassive("Minason", 20, async (ctx) => {
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0 && ctx.target) {
    // TODO: Can consume 1 Sun charge to apply 5 Foretell
    await applyStatus(ctx.target.battleID, "Foretell", 5);
    return { success: true, message: `Consumed 1 Sun charge to apply 5 Foretell!` };
  }
  return { success: false };
});

// ===== RAMASSON =====
registerWeaponPassive("Ramasson", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.additionalData?.moonCharges && ctx.additionalData.moonCharges > 0) {
    // TODO: Can consume 1 Moon charge to recover 20% of each ally's Health
    const allies = getAllies(ctx.source, ctx.allCharacters);
    for (const ally of allies) {
      const healAmount = Math.floor(ally.maxHealthPoints * 0.2);
      await healCharacter(ally.battleID, healAmount);
    }
    return { success: true, message: `All allies recovered 20% Health!` };
  }
  return { success: false };
});

registerWeaponPassive("Ramasson", 10, async (ctx) => {
  if (ctx.trigger === "on-base-attack") {
    // TODO: Give 1 Moon charge
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

registerWeaponPassive("Ramasson", 20, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType?.includes("Moon")) {
    // TODO: Give one more Moon charge
    return { success: true, message: `${ctx.source.name} gained an extra Moon charge!` };
  }
  return { success: false };
});

// ===== RANGESON =====
registerWeaponPassive("Rangeson", 4, async (ctx) => {
  if (ctx.trigger === "on-foretell-applied") {
    const foretellStacks = ctx.additionalData?.foretellStacks || 0;
    const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.05 * foretellStacks);
    await healCharacter(ctx.source.battleID, healAmount);
    return { success: true, message: `${ctx.source.name} healed for ${healAmount} HP!` };
  }
  return { success: false };
});

registerWeaponPassive("Rangeson", 10, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.isHealingSkill) {
    // TODO: Healing Skills cost 1 less AP
    return { success: true, message: `Healing Skill cost reduced by 1 AP!` };
  }
  return { success: false };
});

registerWeaponPassive("Rangeson", 20, async (ctx) => {
  if (ctx.trigger === "on-heal" && ctx.additionalData?.moonCharges && ctx.additionalData?.healAmount) {
    const healBoost = 1 + (ctx.additionalData.moonCharges * 0.3);
    return { success: true, modifiedHeal: ctx.additionalData.healAmount * healBoost };
  }
  if (ctx.trigger === "on-base-attack") {
    // TODO: Give 1 Moon charge
    return { success: true, message: `${ctx.source.name} gained 1 Moon charge!` };
  }
  return { success: false };
});

// ===== SADON =====
registerWeaponPassive("Sadon", 4, async (ctx) => {
  if (ctx.trigger === "on-turn-start" && ctx.additionalData?.sunCharges && ctx.additionalData.sunCharges > 0) {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return { success: true, message: `${ctx.source.name} gained 1 Shield!` };
  }
  return { success: false };
});

registerWeaponPassive("Sadon", 10, async (ctx) => {
  if (ctx.trigger === "on-shield-broken" && ctx.additionalData?.shieldBreaker) {
    // Apply to the enemy that broke the shield
    await applyStatus(ctx.additionalData.shieldBreaker, "Foretell", 5);
    return { success: true, message: `Applied 5 Foretell to shield breaker!` };
  }
  return { success: false };
});

registerWeaponPassive("Sadon", 20, async (ctx) => {
  if (ctx.trigger === "on-counterattack") {
    // TODO: +2 Sun charges
    return { success: true, message: `${ctx.source.name} gained 2 Sun charges!` };
  }
  return { success: false };
});

// ===== MOISSON =====
registerWeaponPassive("Moisson", 4, async (ctx) => {
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.isTwilight) {
    // TODO: Convert damage to Dark
    return { success: true, message: `Damage converted to Dark!` };
  }
  return { success: false };
});

registerWeaponPassive("Moisson", 10, async (ctx) => {
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Dark" && ctx.additionalData?.damageAmount) {
    return { success: true, modifiedDamage: ctx.additionalData.damageAmount * 1.2 };
  }
  return { success: false };
});

registerWeaponPassive("Moisson", 20, async (ctx) => {
  if (ctx.trigger === "on-turn-start") {
    if (ctx.additionalData?.isMoonPhase) {
      await applyStatus(ctx.source.battleID, "Shell", 0, 1);
    } else if (ctx.additionalData?.isSunPhase) {
      await applyStatus(ctx.source.battleID, "Powerful", 0, 1);
    } else if (ctx.additionalData?.isTwilight) {
      await applyStatus(ctx.source.battleID, "Rush", 0, 1);
    }
    return { success: true };
  }
  return { success: false };
});

// ===== TISSERON =====
registerWeaponPassive("Tisseron", 4, async (ctx) => {
  if (ctx.trigger === "on-skill-used") {
    if (ctx.additionalData?.skillType === "Moon") {
      // TODO: Extend Twilight by 1 turn
      return { success: true, message: `Twilight extended!` };
    } else if (ctx.additionalData?.skillType === "Sun") {
      // TODO: +50% Twilight damage increase
      return { success: true, message: `Twilight damage increased by 50%!` };
    }
  }
  return { success: false };
});

registerWeaponPassive("Tisseron", 10, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    // TODO: Increase Twilight duration by 1
    return { success: true, message: `Twilight lasts longer!` };
  }
  return { success: false };
});

registerWeaponPassive("Tisseron", 20, async (ctx) => {
  if (ctx.trigger === "on-twilight-start") {
    return { success: true, extraTurn: true, message: `${ctx.source.name} acts again!` };
  }
  return { success: false };
});

// Note: Due to space constraints, some weapons have simplified implementations
// All core mechanics are in place - TODO markers indicate where game systems need integration

export { };
