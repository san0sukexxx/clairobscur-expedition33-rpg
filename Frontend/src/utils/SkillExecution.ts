import { APIBattle, type CreateAttackRequest } from "../api/APIBattle";
import type { BattleCharacterInfo, WeaponInfo, StatusType } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { DiceBoardRef } from "../components/DiceBoard";
import { SkillEffectsRegistry } from "../data/SkillEffectsRegistry";
import { getEnrichedCharacterSkills, getSkillById } from "./SkillUtils";
import { resolveSkill, calculateSkillHitDamage, getStatusEffectsForTarget } from "./BattleSkillUtils";
import { calculateRawWeaponPower } from "./PlayerCalculator";
import { executeAllSpecialMechanics } from "./SkillSpecialMechanics";

/**
 * Context for skill execution
 */
export interface SkillExecutionContext {
  player: GetPlayerResponse;
  target: BattleCharacterInfo;
  skillId: string;
  weaponInfo: WeaponInfo;
  diceBoardRef: React.RefObject<DiceBoardRef>;
  timeoutDiceBoardRef: React.RefObject<NodeJS.Timeout | null>;
  rollWithTimeout: (
    diceBoardRef: React.RefObject<DiceBoardRef>,
    timeoutRef: React.RefObject<NodeJS.Timeout | null>,
    command: string,
    callback: (result: number) => void | Promise<void>
  ) => void;
  rollCommandForAttack: (weaponInfo: WeaponInfo, attackType: string) => string;
  showToast: (message: string) => void;
}

/**
 * Validation result for skill execution
 */
export interface SkillValidationResult {
  valid: boolean;
  error?: string;
  source?: BattleCharacterInfo;
  skillCost?: number;
  isGradientSkill?: boolean;
}

/**
 * Validate if a skill can be executed
 */
export function validateSkillExecution(
  player: GetPlayerResponse,
  skillId: string
): SkillValidationResult {
  if (!player?.fightInfo) {
    return { valid: false, error: "Informações de batalha não encontradas" };
  }

  const source = player.fightInfo?.characters?.find(
    c => c.battleID === player.fightInfo?.playerBattleID
  );

  if (!source) {
    return { valid: false, error: "Personagem não encontrado na batalha" };
  }

  const skillMetadata = SkillEffectsRegistry[skillId];
  if (!skillMetadata) {
    return { valid: false, error: "Habilidade não encontrada" };
  }

  const skillInfo = player.skills?.find(s => s.skillId === skillId);
  if (!skillInfo) {
    return { valid: false, error: "Você não possui esta habilidade" };
  }

  const enrichedSkills = getEnrichedCharacterSkills(player);
  const fullSkill = enrichedSkills.find(s => s.id === skillId);
  const skillCost = fullSkill?.cost ?? 0;
  const isGradientSkill = fullSkill?.isGradient ?? false;

  // Validate resources
  if (isGradientSkill) {
    const currentGradientCharges = Math.floor((source.gradientPoints ?? 0) / 12);
    if (currentGradientCharges < skillCost) {
      return {
        valid: false,
        error: `Cargas de Gradiente insuficientes! Necessário: ${skillCost}, Disponível: ${currentGradientCharges}`
      };
    }
  } else {
    const currentMp = source.magicPoints ?? 0;
    if (currentMp < skillCost) {
      return {
        valid: false,
        error: `MP insuficiente! Necessário: ${skillCost}, Disponível: ${currentMp}`
      };
    }
  }

  return {
    valid: true,
    source,
    skillCost,
    isGradientSkill
  };
}

/**
 * Calculate bonus damage from various sources
 */
export function calculateBonusDamage(
  source: BattleCharacterInfo,
  target: BattleCharacterInfo,
  resolved: any,
  allCharacters: BattleCharacterInfo[]
): {
  chargeBonus: number;
  hpDrained: number;
  allEnemiesForetellConsumed: number;
} {
  let chargeBonus = 0;
  let hpDrained = 0;
  let allEnemiesForetellConsumed = 0;

  // Charge bonus (Overcharge, etc)
  if (resolved.metadata.damageScalesWithCharge) {
    const currentCharge = source.chargePoints ?? 0;
    chargeBonus = currentCharge;
  }

  // Our Sacrifice: Drain allies HP and consume all enemies Foretell
  if (resolved.metadata.drainsAlliesHp || resolved.metadata.consumesAllEnemiesForetell) {
    if (resolved.metadata.drainsAlliesHp) {
      const aliveAllies = allCharacters.filter(c =>
        !c.isEnemy &&
        c.battleID !== source.battleID &&
        c.healthPoints > 1
      );

      for (const ally of aliveAllies) {
        hpDrained += ally.healthPoints - 1;
      }
    }

    if (resolved.metadata.consumesAllEnemiesForetell) {
      const allEnemies = allCharacters.filter(c => c.isEnemy);

      for (const enemy of allEnemies) {
        const enemyForetell = enemy.status
          ?.filter(s => s.effectName === "Foretell")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0) ?? 0;

        if (enemyForetell > 0) {
          allEnemiesForetellConsumed += enemyForetell;
        }
      }
    }
  }

  return { chargeBonus, hpDrained, allEnemiesForetellConsumed };
}

/**
 * Execute HP drain for Our Sacrifice
 */
export async function executeDrainAlliesHp(
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  hpDrained: number,
  showToast: (msg: string) => void
): Promise<void> {
  if (hpDrained <= 0) return;

  const aliveAllies = allCharacters.filter(c =>
    !c.isEnemy &&
    c.battleID !== source.battleID &&
    c.healthPoints > 1
  );

  for (const ally of aliveAllies) {
    await APIBattle.updateCharacterHp(ally.battleID, 1);
  }

  showToast(`HP drenado de aliados: ${hpDrained} (Dano +${hpDrained})`);
}

/**
 * Execute Foretell consumption from all enemies for Our Sacrifice
 */
export async function executeConsumeAllEnemiesForetell(
  allCharacters: BattleCharacterInfo[],
  allEnemiesForetellConsumed: number,
  showToast: (msg: string) => void
): Promise<void> {
  if (allEnemiesForetellConsumed <= 0) return;

  const allEnemies = allCharacters.filter(c => c.isEnemy);

  for (const enemy of allEnemies) {
    const enemyForetell = enemy.status
      ?.filter(s => s.effectName === "Foretell")
      .reduce((sum, s) => sum + (s.ammount ?? 0), 0) ?? 0;

    if (enemyForetell > 0) {
      await APIBattle.resolveStatus({
        battleCharacterId: enemy.battleID,
        effectType: "Foretell",
        totalValue: 0
      });
    }
  }

  showToast(`Predição total de inimigos: ${allEnemiesForetellConsumed} (Dano +${allEnemiesForetellConsumed})`);
}

/**
 * Handle pre-hit Foretell consumption (Sealed Fate, Firing Shadow)
 */
export async function handlePerHitForetellConsumption(
  resolved: any,
  allCharacters: BattleCharacterInfo[],
  showToast: (msg: string) => void
): Promise<Map<number, boolean>> {
  const foretellConsumedPerTarget = new Map<number, boolean>();

  if (!resolved.metadata.consumesForetellPerHit) {
    return foretellConsumedPerTarget;
  }

  for (const targetId of resolved.targetIds) {
    const consumed = await APIBattle.consumeOneForetell(targetId);
    foretellConsumedPerTarget.set(targetId, consumed);

    if (consumed) {
      const targetChar = allCharacters.find(c => c.battleID === targetId);
      showToast(
        `${targetChar?.name ?? 'Alvo'}: Predição consumida! Dano x${resolved.metadata.foretellPerHitMultiplier ?? 3.0}`
      );
    }
  }

  return foretellConsumedPerTarget;
}

/**
 * Apply conditional Foretell on critical hits (Spectral Sweep)
 */
export function applyConditionalForetellOnCrit(
  resolved: any,
  critMulti: number,
  finalEffects: any[],
  hitIndex: number,
  showToast: (msg: string) => void
): any[] {
  if (!resolved.metadata.appliesForetellOnCrit || critMulti <= 1) {
    return finalEffects;
  }

  const bonusForetell = resolved.metadata.appliesForetellOnCrit;
  const existingForetell = finalEffects.find(e => e.effectType === "Foretell");

  if (existingForetell) {
    return finalEffects.map(effect => {
      if (effect.effectType === "Foretell") {
        const newAmount = (effect.ammount ?? 0) + bonusForetell;
        if (hitIndex === 0) {
          showToast(`Crítico! +${bonusForetell} Predição adicional`);
        }
        return { ...effect, ammount: newAmount };
      }
      return effect;
    });
  } else {
    const newEffects = [...finalEffects, {
      effectType: "Foretell" as StatusType,
      ammount: bonusForetell,
      remainingTurns: 0
    }];
    if (hitIndex === 0) {
      showToast(`Crítico! +${bonusForetell} Predição`);
    }
    return newEffects;
  }
}

/**
 * Handle Searing Bond propagation
 */
export async function handleSearingBondPropagation(
  resolved: any,
  hitIndex: number,
  primaryTargetDamage: number,
  source: BattleCharacterInfo,
  allCharacters: BattleCharacterInfo[],
  showToast: (msg: string) => void
): Promise<void> {
  if (hitIndex !== resolved.hitCount - 1 || !resolved.metadata.propagatesBurnDamage) {
    return;
  }

  const primaryTargetId = resolved.targetIds[0];
  const allEnemies = allCharacters.filter(c => c.isEnemy);

  const otherBurningEnemies = allEnemies.filter(enemy =>
    enemy.battleID !== primaryTargetId &&
    enemy.status?.some(s => s.effectName === "Burning")
  );

  if (otherBurningEnemies.length > 0) {
    const propagatedDamage = Math.floor(primaryTargetDamage / 2);

    for (const enemy of otherBurningEnemies) {
      const isNpc = enemy.type === "npc";

      const propagationRequest: CreateAttackRequest = isNpc
        ? {
            sourceBattleId: source.battleID,
            targetBattleId: enemy.battleID,
            totalDamage: propagatedDamage,
            attackType: "skill",
            effects: [{
              effectType: "Foretell",
              ammount: 1,
              remainingTurns: 0
            }],
            skillCost: 0
          }
        : {
            sourceBattleId: source.battleID,
            targetBattleId: enemy.battleID,
            totalPower: propagatedDamage,
            attackType: "skill",
            effects: [{
              effectType: "Foretell",
              ammount: 1,
              remainingTurns: 0
            }],
            skillCost: 0
          };

      await APIBattle.attack(propagationRequest);
    }

    showToast(`Vínculo Ardente: ${otherBurningEnemies.length} inimigo(s) afetado(s)!`);
  }
}

/**
 * Handle turn delay (Delaying Slash)
 */
export async function handleTurnDelay(
  resolved: any,
  showToast: (msg: string) => void
): Promise<void> {
  if (!resolved.metadata.delaysTurn) return;

  for (const targetId of resolved.targetIds) {
    await APIBattle.delayTurn(targetId, resolved.metadata.delaysTurn);
    showToast(`Turno atrasado em ${resolved.metadata.delaysTurn} posições!`);
  }
}
