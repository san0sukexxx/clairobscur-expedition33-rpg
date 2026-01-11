import { APIBattle } from "../api/APIBattle";
import type { BattleCharacterInfo, StatusType } from "../api/ResponseModel";
import type { SkillMetadata } from "../data/SkillEffectsRegistry";

/**
 * Special mechanics for skills that require complex logic beyond standard damage/effects.
 * These functions are called after the main skill execution in PlayerPage.tsx.
 */

interface SpecialMechanicContext {
  source: BattleCharacterInfo;
  target?: BattleCharacterInfo;
  resolved: {
    metadata: SkillMetadata;
    targetIds: number[];
    effects: any[];
  };
  allCharacters: BattleCharacterInfo[];
  showToast: (message: string) => void;
}

/**
 * Card Weaver: Redistribute target's Foretell to all other enemies
 */
export async function handleRedistributeForetell(ctx: SpecialMechanicContext): Promise<void> {
  if (!ctx.resolved.metadata.redistributesForetell || !ctx.target) return;

  const targetForetellStacks = ctx.target.status
    ?.filter(s => s.effectName === "Foretell")
    .reduce((sum, s) => sum + (s.ammount ?? 0), 0) ?? 0;

  if (targetForetellStacks > 0) {
    // Get all other enemies (not the target)
    const otherEnemies = ctx.allCharacters.filter(c =>
      c.isEnemy &&
      c.battleID !== ctx.target!.battleID &&
      c.healthPoints > 0
    );

    if (otherEnemies.length > 0) {
      // Consume all Foretell from target
      await APIBattle.resolveStatus({
        battleCharacterId: ctx.target.battleID,
        effectType: "Foretell",
        totalValue: 0
      });

      // Add the same amount of Foretell to each other enemy
      for (const enemy of otherEnemies) {
        await APIBattle.addStatus({
          battleCharacterId: enemy.battleID,
          effectType: "Foretell",
          ammount: targetForetellStacks,
          remainingTurns: 0
        });
      }

      ctx.showToast(`${targetForetellStacks} Predição redistribuída para ${otherEnemies.length} inimigo(s)!`);
    } else {
      ctx.showToast(`Nenhum outro inimigo para redistribuir Predição!`);
    }
  } else {
    ctx.showToast(`Alvo não possui Predição para redistribuir!`);
  }
}

/**
 * Card Weaver: Grant extra turn (toast only)
 */
export async function handleGrantExtraTurn(ctx: SpecialMechanicContext): Promise<void> {
  if (!ctx.resolved.metadata.grantsExtraTurn) return;

  ctx.showToast("Turno extra concedido! (Funcionalidade em desenvolvimento)");
}

/**
 * Rush: Apply Hastened to 1-3 random allies
 */
export async function handleRandomAllyBuff(ctx: SpecialMechanicContext): Promise<void> {
  if (!ctx.resolved.metadata.randomAllyCount) return;

  const aliveAllies = ctx.allCharacters.filter(c =>
    !c.isEnemy &&
    c.healthPoints > 0
  );

  if (aliveAllies.length > 0) {
    const { min, max } = ctx.resolved.metadata.randomAllyCount;
    const targetCount = Math.min(
      Math.floor(Math.random() * (max - min + 1)) + min,
      aliveAllies.length
    );

    // Shuffle allies and pick first N
    const shuffled = [...aliveAllies].sort(() => Math.random() - 0.5);
    const selectedAllies = shuffled.slice(0, targetCount);

    // Apply effects to selected allies
    for (const ally of selectedAllies) {
      for (const effect of ctx.resolved.effects) {
        await APIBattle.addStatus({
          battleCharacterId: ally.battleID,
          effectType: effect.effectType as StatusType,
          ammount: effect.ammount ?? 0,
          remainingTurns: effect.remainingTurns ?? null
        });
      }
    }

    const allyNames = selectedAllies.map(a => a.name).join(", ");
    ctx.showToast(`Rapidez aplicada em ${targetCount} aliado(s): ${allyNames}!`);
  } else {
    ctx.showToast("Nenhum aliado vivo para aplicar Rapidez!");
  }
}

/**
 * Dark Cleansing: Cleanse all debuffs from target and copy buffs to other allies
 */
export async function handleCleansesAndCopiesBuffs(ctx: SpecialMechanicContext): Promise<void> {
  if (!ctx.resolved.metadata.cleansesAndCopiesBuffs || !ctx.target) return;

  // Define negative and positive status effects
  const negativeEffects = [
    "Unprotected", "Slowed", "Weakened", "Cursed", "Stunned", "Confused",
    "Frozen", "Entangled", "Exhausted", "Inverted", "Marked", "Plagued",
    "Burning", "Silenced", "Dizzy", "Fragile", "Broken", "Fleeing",
    "FireVulnerability"
  ];

  const positiveEffects = [
    "Hastened", "Empowered", "Protected", "Regeneration", "Shielded",
    "Frenzy", "Rage", "Guardian", "Foretell", "Twilight"
  ];

  // Get target's status effects
  const targetStatuses = ctx.target.status ?? [];

  // Separate debuffs and buffs
  const debuffs = targetStatuses.filter(s => negativeEffects.includes(s.effectName));
  const buffs = targetStatuses.filter(s => positiveEffects.includes(s.effectName));

  let cleansedCount = 0;
  let copiedCount = 0;

  // Remove all debuffs from target
  if (debuffs.length > 0) {
    await APIBattle.cleanse(ctx.target.battleID);
    cleansedCount = debuffs.length;
    ctx.showToast(`${cleansedCount} debuff(s) removido(s) de ${ctx.target.name}!`);
  }

  // Copy all buffs to other allies
  if (buffs.length > 0) {
    const otherAllies = ctx.allCharacters.filter(c =>
      !c.isEnemy &&
      c.battleID !== ctx.target!.battleID &&
      c.healthPoints > 0
    );

    if (otherAllies.length > 0) {
      for (const ally of otherAllies) {
        for (const buff of buffs) {
          await APIBattle.addStatus({
            battleCharacterId: ally.battleID,
            effectType: buff.effectName as StatusType,
            ammount: buff.ammount ?? 0,
            remainingTurns: buff.remainingTurns ?? null
          });
          copiedCount++;
        }
      }

      const totalBuffsPerAlly = buffs.length;
      ctx.showToast(`${totalBuffsPerAlly} buff(s) copiado(s) para ${otherAllies.length} aliado(s)!`);
    } else {
      ctx.showToast("Nenhum outro aliado vivo para copiar buffs!");
    }
  }

  if (cleansedCount === 0 && copiedCount === 0) {
    ctx.showToast("Alvo não possui debuffs nem buffs!");
  }
}

/**
 * Plentiful Harvest: Grant MP to random ally per Foretell consumed
 */
export async function handleGrantMpPerForetell(
  ctx: SpecialMechanicContext,
  mpToGrant: number
): Promise<void> {
  if (!ctx.resolved.metadata.grantsMpPerForetell || mpToGrant <= 0) return;

  // Filter allies: alive, not the source character, and has MP system
  const aliveAllies = ctx.allCharacters.filter(c =>
    !c.isEnemy &&
    c.battleID !== ctx.source.battleID &&  // Exclude the character using the skill
    c.healthPoints > 0 &&
    c.maxMagicPoints !== undefined &&
    c.maxMagicPoints !== null &&
    c.maxMagicPoints > 0
  );

  if (aliveAllies.length > 0) {
    // Select ally with lowest MP percentage
    const allyWithLowestMp = aliveAllies.reduce((lowest, current) => {
      const currentMpPercent = ((current.magicPoints ?? 0) / (current.maxMagicPoints ?? 1)) * 100;
      const lowestMpPercent = ((lowest.magicPoints ?? 0) / (lowest.maxMagicPoints ?? 1)) * 100;
      return currentMpPercent < lowestMpPercent ? current : lowest;
    });

    const currentMp = allyWithLowestMp.magicPoints ?? 0;
    const maxMp = allyWithLowestMp.maxMagicPoints ?? 0;
    const newMp = Math.min(currentMp + mpToGrant, maxMp);

    await APIBattle.updateCharacterMp(allyWithLowestMp.battleID, newMp);
    ctx.showToast(`${allyWithLowestMp.name} recebeu +${mpToGrant} PM! (${currentMp} → ${newMp})`);
  } else {
    ctx.showToast(`Nenhum aliado vivo para receber PM!`);
  }
}

/**
 * Execute all special mechanics in order
 */
export async function executeAllSpecialMechanics(
  ctx: SpecialMechanicContext,
  mpToGrant?: number
): Promise<void> {
  // Card Weaver: Redistribute Foretell
  await handleRedistributeForetell(ctx);

  // Card Weaver: Extra turn (toast only)
  await handleGrantExtraTurn(ctx);

  // Rush: Random ally buff
  await handleRandomAllyBuff(ctx);

  // Dark Cleansing: Cleanse and copy buffs
  await handleCleansesAndCopiesBuffs(ctx);

  // Plentiful Harvest: Grant MP per Foretell consumed
  if (mpToGrant !== undefined && mpToGrant > 0) {
    await handleGrantMpPerForetell(ctx, mpToGrant);
  }
}
