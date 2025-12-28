// ==================== LUNE WEAPON PASSIVES ====================
// This file contains passive implementations for Lune's weapons
// Import and register these passives in WeaponPassiveEffects.ts

import { registerWeaponPassive } from "./WeaponPassiveEffects";
import type { WeaponPassiveContext } from "./WeaponPassiveEffects";
import {
  applyStatus,
  healCharacter,
  dealDamage,
  giveAP,
  rollChance,
  getAllies,
  getEnemies,
  canActivateEffect,
  trackEffectActivation,
  getStacks,
  addStack,
  resetStacks,
  setStacks
} from "./WeaponPassiveEffects";

// Angerim
registerWeaponPassive("Angerim", 4, async (ctx) => {
  // "Base Attack applies 2 Burn per Fire Stain."
  if (ctx.trigger === "on-base-attack" && ctx.target) {
    // TODO: Count Fire Stains
    const fireStains = ctx.additionalData?.stainsGenerated?.filter(s => s === "Fire").length || 0;
    if (fireStains > 0) {
      const burnAmount = fireStains * 2;
      await applyStatus(ctx.target.battleID, "Burn", burnAmount, 3);
      return {
        success: true,
        message: `${ctx.source.name} applied ${burnAmount} Burn stacks!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Angerim", 10, async (ctx) => {
  // "Generate one Fire Stain at the beginning of each turn."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Generate Fire Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a Fire Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Angerim", 20, async (ctx) => {
  // "30% increased Burn damage per Fire Stain."
  // TODO: This requires modifying Burn damage calculation based on Fire Stains
  if (ctx.trigger === "on-burn-applied") {
    const fireStains = 0; // Placeholder - need to count active Fire Stains
    if (fireStains > 0) {
      return {
        success: true,
        message: `Burn damage increased by ${fireStains * 30}%!`
      };
    }
  }
  return { success: false };
});

// Benisim
registerWeaponPassive("Benisim", 4, async (ctx) => {
  // "Healing Skills cost 1 less AP."
  // TODO: This requires modifying AP cost calculation
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Healing") {
    return {
      success: true,
      message: `Healing Skill cost reduced!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Benisim", 10, async (ctx) => {
  // "Generate one Earth Stain at the beginning of each turn."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Generate Earth Stain
    return {
      success: true,
      message: `${ctx.source.name} generated an Earth Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Benisim", 20, async (ctx) => {
  // "Replay instantly on consuming Stains with a Healing Skill."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.skillType === "Healing") {
    return {
      success: true,
      extraTurn: true,
      message: `${ctx.source.name} acts again!`
    };
  }
  return { success: false };
});

// Betelim
registerWeaponPassive("Betelim", 4, async (ctx) => {
  // "Using a Skill that consumes Stains increases damage by 20%. Can stack up to 5 times. Resets on using a Skill without consuming Stains."
  if (ctx.trigger === "on-skill-used") {
    if (ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
      const stacks = addStack(ctx.battleId, ctx.source.battleID, "Betelim-DamageStacks", 5);
      return {
        success: true,
        message: `${ctx.source.name} has ${stacks} damage stack(s) (+${stacks * 20}% damage)!`
      };
    } else {
      resetStacks(ctx.battleId, ctx.source.battleID, "Betelim-DamageStacks");
      return {
        success: true,
        message: `${ctx.source.name}'s damage stacks reset!`
      };
    }
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Betelim-DamageStacks");
    if (stacks > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.2)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Betelim", 10, async (ctx) => {
  // "On turn start, if no Stains, 2 random Stains are generated."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Check if no stains and generate 2 random stains
    return {
      success: true,
      message: `${ctx.source.name} generated 2 random Stains!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Betelim", 20, async (ctx) => {
  // "+1 AP when Stains are consumed."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    await giveAP(ctx.source.battleID, 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 AP!`
    };
  }
  return { success: false };
});

// Braselim
registerWeaponPassive("Braselim", 4, async (ctx) => {
  // "30% increased Critical Chance per Ice Stain."
  // TODO: This requires modifying critical chance calculation based on Ice Stains
  if (ctx.trigger === "on-damage-dealt") {
    const iceStains = 0; // Placeholder - need to count active Ice Stains
    if (iceStains > 0) {
      return {
        success: true,
        message: `Critical Chance increased by ${iceStains * 30}%!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Braselim", 10, async (ctx) => {
  // "+5% of a Gradient Charge on Critical hit."
  if (ctx.trigger === "on-critical-hit") {
    // TODO: Add 5% to gradient charge
    return {
      success: true,
      message: `${ctx.source.name} gained 5% Gradient Charge!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Braselim", 20, async (ctx) => {
  // "20% increased Fire damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Fire" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

// Chapelim
registerWeaponPassive("Chapelim", 4, async (ctx) => {
  // "30% increased Break damage per Earth Stain."
  // TODO: This requires modifying Break damage calculation based on Earth Stains
  if (ctx.trigger === "on-break") {
    const earthStains = 0; // Placeholder - need to count active Earth Stains
    if (earthStains > 0) {
      return {
        success: true,
        message: `Break damage increased by ${earthStains * 30}%!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Chapelim", 10, async (ctx) => {
  // "Gain 9 AP on Breaking an enemy."
  if (ctx.trigger === "on-break") {
    await giveAP(ctx.source.battleID, 9);
    return {
      success: true,
      message: `${ctx.source.name} gained 9 AP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Chapelim", 20, async (ctx) => {
  // "Generate one Earth Stain at the beginning of each turn."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Generate Earth Stain
    return {
      success: true,
      message: `${ctx.source.name} generated an Earth Stain!`
    };
  }
  return { success: false };
});

// Choralim
registerWeaponPassive("Choralim", 4, async (ctx) => {
  // "100% Critical Chance when 4 Stains are simultaneously active."
  // TODO: This requires checking total active stains and modifying critical chance
  if (ctx.trigger === "on-damage-dealt") {
    const totalStains = 0; // Placeholder - need to count all active Stains
    if (totalStains >= 4) {
      return {
        success: true,
        message: `${ctx.source.name} has guaranteed critical hits!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Choralim", 10, async (ctx) => {
  // "20% increased damage for each consecutive turn without taking damage. Can stack up to 5 times."
  // Same as Chevalam L10
  if (ctx.trigger === "on-damage-taken") {
    resetStacks(ctx.battleId, ctx.source.battleID, "Choralim-DamageStacks");
    return { success: true, message: `${ctx.source.name}'s damage stacks reset!` };
  }
  if (ctx.trigger === "on-turn-start") {
    const stacks = addStack(ctx.battleId, ctx.source.battleID, "Choralim-DamageStacks", 5);
    return {
      success: true,
      message: `${ctx.source.name} has ${stacks} damage stack(s) (+${stacks * 20}% damage)!`
    };
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const stacks = getStacks(ctx.battleId, ctx.source.battleID, "Choralim-DamageStacks");
    if (stacks > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + stacks * 0.2)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Choralim", 20, async (ctx) => {
  // "Critical hits apply Burn."
  if (ctx.trigger === "on-critical-hit" && ctx.target) {
    await applyStatus(ctx.target.battleID, "Burn", 1, 3);
    return {
      success: true,
      message: `${ctx.target.name} was burned!`
    };
  }
  return { success: false };
});

// Colim
registerWeaponPassive("Colim", 4, async (ctx) => {
  // "50% chance to generate a Light Stain when consuming Stains."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    if (rollChance(50)) {
      // TODO: Generate Light Stain
      return {
        success: true,
        message: `${ctx.source.name} generated a Light Stain!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Colim", 10, async (ctx) => {
  // "+1 AP on consuming a Light Stain."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed?.includes("Light")) {
    await giveAP(ctx.source.battleID, 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 AP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Colim", 20, async (ctx) => {
  // "20% increased damage with Skills per active Light Stain."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.damageAmount) {
    const lightStains = 0; // Placeholder - need to count active Light Stains
    if (lightStains > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + lightStains * 0.2),
        message: `Damage increased by ${lightStains * 20}%!`
      };
    }
  }
  return { success: false };
});

// Coralim
registerWeaponPassive("Coralim", 4, async (ctx) => {
  // "Ice Skills cost 1 less AP."
  // TODO: This requires modifying AP cost calculation
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Ice") {
    return {
      success: true,
      message: `Ice Skill cost reduced!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Coralim", 10, async (ctx) => {
  // "20% increased Ice damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Ice" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Coralim", 20, async (ctx) => {
  // "Start battle with 1 Earth Stain."
  if (ctx.trigger === "on-battle-start") {
    // TODO: Generate Earth Stain
    return {
      success: true,
      message: `${ctx.source.name} starts with an Earth Stain!`
    };
  }
  return { success: false };
});

// Deminerim
registerWeaponPassive("Deminerim", 4, async (ctx) => {
  // "Lightning Skills cost 1 less AP."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Lightning") {
    return {
      success: true,
      message: `Lightning Skill cost reduced!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Deminerim", 10, async (ctx) => {
  // "20% increased Lightning damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Lightning" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Deminerim", 20, async (ctx) => {
  // "Start battle with 1 Fire Stain."
  if (ctx.trigger === "on-battle-start") {
    // TODO: Generate Fire Stain
    return {
      success: true,
      message: `${ctx.source.name} starts with a Fire Stain!`
    };
  }
  return { success: false };
});

// Elerim
registerWeaponPassive("Elerim", 4, async (ctx) => {
  // "Consuming an Earth Stain applies 1 Shield to self."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed?.includes("Earth")) {
    await applyStatus(ctx.source.battleID, "Shield", 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 Shield!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Elerim", 10, async (ctx) => {
  // "20% increased Earth damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Earth" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Elerim", 20, async (ctx) => {
  // "Base Attack generates an Earth Stain."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Generate Earth Stain
    return {
      success: true,
      message: `${ctx.source.name} generated an Earth Stain!`
    };
  }
  return { success: false };
});

// Kralim
registerWeaponPassive("Kralim", 4, async (ctx) => {
  // "Casting a Skill increases the Skill damage of all other elements by 20%. Resets when casting a Skill of a previous element."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement) {
    const lastElement = getStacks(ctx.battleId, ctx.source.battleID, "Kralim-LastElement");
    const elements = ["Physical", "Fire", "Ice", "Lightning", "Earth", "Light", "Dark"];
    const currentElementIndex = elements.indexOf(ctx.additionalData.skillElement);

    if (lastElement > 0 && currentElementIndex <= lastElement - 1) {
      resetStacks(ctx.battleId, ctx.source.battleID, "Kralim-ElementBoost");
      return {
        success: true,
        message: `${ctx.source.name}'s element chain was broken!`
      };
    } else {
      const boostStacks = addStack(ctx.battleId, ctx.source.battleID, "Kralim-ElementBoost", 7);
      setStacks(ctx.battleId, ctx.source.battleID, "Kralim-LastElement", currentElementIndex + 1);
      return {
        success: true,
        message: `${ctx.source.name} has ${boostStacks} element boost(s) (+${boostStacks * 20}% damage)!`
      };
    }
  }
  if (ctx.trigger === "on-damage-dealt" && ctx.additionalData?.damageAmount) {
    const boostStacks = getStacks(ctx.battleId, ctx.source.battleID, "Kralim-ElementBoost");
    if (boostStacks > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + boostStacks * 0.2)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Kralim", 10, async (ctx) => {
  // "On turn start, if no Stains, 2 random Stains are generated."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Check if no stains and generate 2 random stains
    return {
      success: true,
      message: `${ctx.source.name} generated 2 random Stains!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Kralim", 20, async (ctx) => {
  // "+1 AP when Stains are consumed."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    await giveAP(ctx.source.battleID, 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 AP!`
    };
  }
  return { success: false };
});

// Lighterim
registerWeaponPassive("Lighterim", 4, async (ctx) => {
  // "Fire Skills cost 1 less AP."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Fire") {
    return {
      success: true,
      message: `Fire Skill cost reduced!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Lighterim", 10, async (ctx) => {
  // "20% increased Fire damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Fire" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Lighterim", 20, async (ctx) => {
  // "Start battle with 1 Ice Stain."
  if (ctx.trigger === "on-battle-start") {
    // TODO: Generate Ice Stain
    return {
      success: true,
      message: `${ctx.source.name} starts with an Ice Stain!`
    };
  }
  return { success: false };
});

// Lithelim
registerWeaponPassive("Lithelim", 4, async (ctx) => {
  // "50% chance to generate a Dark or Light Stain when consuming Stains. Deal 50% more damage with Skills per active Dark Stain."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    if (rollChance(50)) {
      const stainType = rollChance(50) ? "Dark" : "Light";
      // TODO: Generate Dark or Light Stain
      return {
        success: true,
        message: `${ctx.source.name} generated a ${stainType} Stain!`
      };
    }
  }
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.damageAmount) {
    const darkStains = 0; // Placeholder - need to count active Dark Stains
    if (darkStains > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + darkStains * 0.5)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Lithelim", 10, async (ctx) => {
  // "+1 AP on consuming a Light Stain."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed?.includes("Light")) {
    await giveAP(ctx.source.battleID, 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 AP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Lithelim", 20, async (ctx) => {
  // "Base Attacks can consume one Dark Stain to deal 200% more damage."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    const darkStains = 0; // Placeholder - need to check for Dark Stains
    if (darkStains > 0) {
      // TODO: Consume 1 Dark Stain
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * 3.0,
        message: `${ctx.source.name} consumed a Dark Stain for massive damage!`
      };
    }
  }
  return { success: false };
});

// Painerim
registerWeaponPassive("Painerim", 4, async (ctx) => {
  // "Earth Skills cost 1 less AP."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Earth") {
    return {
      success: true,
      message: `Earth Skill cost reduced!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Painerim", 10, async (ctx) => {
  // "20% increased Earth damage with Skills."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillElement === "Earth" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.2
    };
  }
  return { success: false };
});

registerWeaponPassive("Painerim", 20, async (ctx) => {
  // "Start battle with 1 Lightning Stain."
  if (ctx.trigger === "on-battle-start") {
    // TODO: Generate Lightning Stain
    return {
      success: true,
      message: `${ctx.source.name} starts with a Lightning Stain!`
    };
  }
  return { success: false };
});

// Potierim
registerWeaponPassive("Potierim", 4, async (ctx) => {
  // "Healing Skills generate one additional Light Stain."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Healing") {
    // TODO: Generate Light Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a Light Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Potierim", 10, async (ctx) => {
  // "Consuming a Light Stain applies Slow to a random enemy."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed?.includes("Light")) {
    const enemies = getEnemies(ctx.source, ctx.allCharacters);
    if (enemies.length > 0) {
      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
      await applyStatus(randomEnemy.battleID, "Slow", 0, 2);
      return {
        success: true,
        message: `${randomEnemy.name} was slowed!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Potierim", 20, async (ctx) => {
  // "Base Attack generates a Light Stain."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Generate Light Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a Light Stain!`
    };
  }
  return { success: false };
});

// Redalim
registerWeaponPassive("Redalim", 4, async (ctx) => {
  // "Healing Skills generate one additional Light Stain."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.skillType === "Healing") {
    // TODO: Generate Light Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a Light Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Redalim", 10, async (ctx) => {
  // "Generate one Ice Stain at the beginning of each turn."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Generate Ice Stain
    return {
      success: true,
      message: `${ctx.source.name} generated an Ice Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Redalim", 20, async (ctx) => {
  // "Replay instantly on consuming Stains with a Healing Skill."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.skillType === "Healing") {
    return {
      success: true,
      extraTurn: true,
      message: `${ctx.source.name} acts again!`
    };
  }
  return { success: false };
});

// Saperim
registerWeaponPassive("Saperim", 4, async (ctx) => {
  // "Using a Gradient Attack generates 1 additional Light Stain."
  if (ctx.trigger === "on-gradient-use") {
    // TODO: Generate Light Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a Light Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Saperim", 10, async (ctx) => {
  // "When a Fire Stain is generated, a Lightning Stain is also generated. Once per turn."
  if (ctx.trigger === "on-stain-generated" && ctx.additionalData?.stainsGenerated?.includes("Fire")) {
    if (canActivateEffect(ctx.battleId, ctx.source.battleID, "Saperim-LightningGen", "once-per-turn")) {
      // TODO: Generate Lightning Stain
      trackEffectActivation(ctx.battleId, ctx.source.battleID, "Saperim-LightningGen", "once-per-turn");
      return {
        success: true,
        message: `${ctx.source.name} also generated a Lightning Stain!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Saperim", 20, async (ctx) => {
  // "Gradient Attacks and Gradient Counters deal 50% more damage."
  if (ctx.trigger === "on-gradient-use" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

// Scaverim
registerWeaponPassive("Scaverim", 4, async (ctx) => {
  // "50% chance to generate a Dark Stain when consuming Stains. Deal 50% more damage with Skills per active Dark Stain."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    if (rollChance(50)) {
      // TODO: Generate Dark Stain
      return {
        success: true,
        message: `${ctx.source.name} generated a Dark Stain!`
      };
    }
  }
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.damageAmount) {
    const darkStains = 0; // Placeholder - need to count active Dark Stains
    if (darkStains > 0) {
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * (1 + darkStains * 0.5)
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Scaverim", 10, async (ctx) => {
  // "Base Attacks can consume one Dark Stain to deal 200% more damage."
  if (ctx.trigger === "on-base-attack" && ctx.additionalData?.damageAmount) {
    const darkStains = 0; // Placeholder - need to check for Dark Stains
    if (darkStains > 0) {
      // TODO: Consume 1 Dark Stain
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * 3.0,
        message: `${ctx.source.name} consumed a Dark Stain for massive damage!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Scaverim", 20, async (ctx) => {
  // "With 4 active Dark Stains, any Skill can consume them to deal 300% more damage."
  if (ctx.trigger === "on-skill-used" && ctx.additionalData?.damageAmount) {
    const darkStains = 0; // Placeholder - need to count active Dark Stains
    if (darkStains >= 4) {
      // TODO: Consume all Dark Stains
      return {
        success: true,
        modifiedDamage: ctx.additionalData.damageAmount * 4.0,
        message: `${ctx.source.name} consumed 4 Dark Stains for devastating damage!`
      };
    }
  }
  return { success: false };
});

// Snowim
registerWeaponPassive("Snowim", 4, async (ctx) => {
  // "Freeze self when falling below 30% health. Prevent the next instance of damage while Frozen."
  if (ctx.trigger === "on-damage-taken") {
    const healthPercent = (ctx.source.healthPoints / ctx.source.maxHealthPoints) * 100;
    if (healthPercent < 30) {
      await applyStatus(ctx.source.battleID, "Freeze", 0, 1);
      return {
        success: true,
        message: `${ctx.source.name} froze themselves!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Snowim", 10, async (ctx) => {
  // "On turn start, if Frozen, remove Freeze and recover 60% Health."
  if (ctx.trigger === "on-turn-start") {
    // TODO: Check if Frozen
    const isFrozen = false; // Placeholder
    if (isFrozen) {
      const healAmount = Math.floor(ctx.source.maxHealthPoints * 0.6);
      await healCharacter(ctx.source.battleID, healAmount);
      // TODO: Remove Freeze status
      return {
        success: true,
        message: `${ctx.source.name} recovered ${healAmount} HP and unfroze!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Snowim", 20, async (ctx) => {
  // "Gain 2 Ice Stains and 3 AP when Frozen."
  // TODO: Trigger when Freeze is applied
  if (ctx.trigger === "on-buff-applied") {
    // TODO: Check if Freeze was applied
    // TODO: Generate 2 Ice Stains
    await giveAP(ctx.source.battleID, 3);
    return {
      success: true,
      message: `${ctx.source.name} gained 2 Ice Stains and 3 AP!`
    };
  }
  return { success: false };
});

// Trebuchim
registerWeaponPassive("Trebuchim", 4, async (ctx) => {
  // "Generate a random Stain on Free Aim shot."
  if (ctx.trigger === "on-free-aim") {
    // TODO: Generate random Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a random Stain!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Trebuchim", 10, async (ctx) => {
  // "+1 AP when Stains are consumed."
  if (ctx.trigger === "on-stain-consumed" && ctx.additionalData?.stainsConsumed && ctx.additionalData.stainsConsumed.length > 0) {
    await giveAP(ctx.source.battleID, 1);
    return {
      success: true,
      message: `${ctx.source.name} gained 1 AP!`
    };
  }
  return { success: false };
});

registerWeaponPassive("Trebuchim", 20, async (ctx) => {
  // "Base Attack generates 2 random Stains."
  if (ctx.trigger === "on-base-attack") {
    // TODO: Generate 2 random Stains
    return {
      success: true,
      message: `${ctx.source.name} generated 2 random Stains!`
    };
  }
  return { success: false };
});

// Troubadim
registerWeaponPassive("Troubadim", 4, async (ctx) => {
  // "Free Aim Shots deal damage to an additional random target."
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.damageAmount) {
    const enemies = getEnemies(ctx.source, ctx.allCharacters).filter(e => e.battleID !== ctx.target?.battleID);
    if (enemies.length > 0) {
      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
      await dealDamage(randomEnemy.battleID, ctx.additionalData.damageAmount);
      return {
        success: true,
        message: `${randomEnemy.name} also took ${ctx.additionalData.damageAmount} damage!`
      };
    }
  }
  return { success: false };
});

registerWeaponPassive("Troubadim", 10, async (ctx) => {
  // "50% increased Free Aim damage."
  if (ctx.trigger === "on-free-aim" && ctx.additionalData?.damageAmount) {
    return {
      success: true,
      modifiedDamage: ctx.additionalData.damageAmount * 1.5
    };
  }
  return { success: false };
});

registerWeaponPassive("Troubadim", 20, async (ctx) => {
  // "Generate a random Stain on Free Aim shot."
  if (ctx.trigger === "on-free-aim") {
    // TODO: Generate random Stain
    return {
      success: true,
      message: `${ctx.source.name} generated a random Stain!`
    };
  }
  return { success: false };
});

// Note: Lunerim has no passives (empty array)

export { };
