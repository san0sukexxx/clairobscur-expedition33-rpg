import type { GetPlayerResponse } from "../api/APIPlayer";
import { type AttackType, type AttackResponse, type StatusType, type BattleCharacterInfo, type SkillType, type StatusResponse } from "../api/ResponseModel";
import { t } from "../i18n";

/**
 * Calcula o multiplicador de dano baseado no Rank de Perfeição do Verso
 * D: 1.0 (sem bônus)
 * C: 1.2 (+20%)
 * B: 1.4 (+40%)
 * A: 1.5 (+50%)
 * S: 2.0 (+100%)
 */
export function getVersoPerfectionDamageMultiplier(rank: string | null | undefined): number {
    switch (rank) {
        case "S": return 2.0;   // +100%
        case "A": return 1.5;   // +50%
        case "B": return 1.4;   // +40%
        case "C": return 1.2;   // +20%
        case "D": return 1.0;   // sem bônus
        default: return 1.0;
    }
}

export function getBattleStatusLabel(status: string): string {
    switch (status) {
        case "starting":
            return t("battle.status.starting");
        case "started":
            return t("battle.status.started");
        case "finished":
            return t("battle.status.finished");
        default:
            return status;
    }
}

export function getAttackType(attack: AttackResponse): AttackType {
    const effects = attack.effects ?? [];

    if (effects.some(e => e.effectType === "jump")) {
        return "jump";
    }

    if (effects.some(e => e.effectType === "gradient")) {
        return "gradient";
    }

    return "basic";
}

export function getAttackTypeLabel(type: AttackType): string {
    switch (type) {
        case "basic":
            return t("battle.attackType.basic");
        case "jump":
            return t("battle.attackType.jump");
        case "jump-all":
            return t("battle.attackType.jumpAll");
        case "gradient":
            return t("battle.attackType.gradient");
        default:
            return type;
    }
}

export function getSkillLabel(skill: SkillType): string {
    switch (skill) {
        case "give-status":
            return t("battle.skillType.giveStatus");
        default:
            return skill;
    }
}

export function getStatusLabel(status: StatusType): string {
    switch (status) {
        case "Hastened": return t("battle.statusEffects.Hastened");
        case "Empowered": return t("battle.statusEffects.Empowered");
        case "Protected": return t("battle.statusEffects.Protected");
        case "Regeneration": return t("battle.statusEffects.Regeneration");
        case "Unprotected": return t("battle.statusEffects.Unprotected");
        case "Slowed": return t("battle.statusEffects.Slowed");
        case "Weakened": return t("battle.statusEffects.Weakened");
        case "Cursed": return t("battle.statusEffects.Cursed");
        case "Stunned": return t("battle.statusEffects.Stunned");
        case "Confused": return t("battle.statusEffects.Confused");
        case "Frozen": return t("battle.statusEffects.Frozen");
        case "Entangled": return t("battle.statusEffects.Entangled");
        case "Shielded": return t("battle.statusEffects.Shielded");
        case "Exhausted": return t("battle.statusEffects.Exhausted");
        case "Frenzy": return t("battle.statusEffects.Frenzy");
        case "Rage": return t("battle.statusEffects.Rage");
        case "Inverted": return t("battle.statusEffects.Inverted");
        case "Marked": return t("battle.statusEffects.Marked");
        case "Plagued": return t("battle.statusEffects.Plagued");
        case "Burning": return t("battle.statusEffects.Burning");
        case "IntenseFlames": return t("battle.statusEffects.IntenseFlames");
        case "Silenced": return t("battle.statusEffects.Silenced");
        case "Dizzy": return t("battle.statusEffects.Dizzy");
        case "Fragile": return t("battle.statusEffects.Fragile");
        case "Broken": return t("battle.statusEffects.Broken");
        case "Fleeing": return t("battle.statusEffects.Fleeing");
        case "FireVulnerability": return t("battle.statusEffects.FireVulnerability");
        case "Guardian": return t("battle.statusEffects.Guardian");
        case "Foretell": return t("battle.statusEffects.Foretell");
        case "Twilight": return t("battle.statusEffects.Twilight");
        case "Powerless": return t("battle.statusEffects.Powerless");
        case "Rush": return t("battle.statusEffects.Rush");
        case "Burn": return t("battle.statusEffects.Burn");
        case "Shield": return t("battle.statusEffects.Shield");
        case "Powerful": return t("battle.statusEffects.Powerful");
        case "Mark": return t("battle.statusEffects.Mark");
        case "Shell": return t("battle.statusEffects.Shell");
        case "Slow": return t("battle.statusEffects.Slow");
        case "Freeze": return t("battle.statusEffects.Freeze");
        case "GreaterRush": return t("battle.statusEffects.GreaterRush");
        case "GreaterSlow": return t("battle.statusEffects.GreaterSlow");
        case "EnfeeblingMark": return t("battle.statusEffects.EnfeeblingMark");
        case "DamageReduction": return t("battle.statusEffects.DamageReduction");
        case "SuccessiveParry": return t("battle.statusEffects.SuccessiveParry");
        case "Aureole": return t("battle.statusEffects.Aureole");
        case "Vulnerable": return t("battle.statusEffects.Vulnerable");
        case "DoubleDamage": return t("battle.statusEffects.DoubleDamage");
        case "Defenceless": return t("battle.statusEffects.Defenceless");
        case "Regen": return t("battle.statusEffects.Regen");
        case "Curse": return t("battle.statusEffects.Curse");
        case "free-shot": return t("battle.statusEffects.freeShot");
        case "jump": return t("battle.statusEffects.jump");
        case "gradient": return t("battle.statusEffects.gradient");
        case "invisible-barrier": return t("battle.statusEffects.invisibleBarrier");
        default: return status;
    }
}

export function shouldShowStatusAmmount(type: StatusType): boolean {
    const skillsWithoutAmmount: StatusType[] = [
        "Hastened",
        "Slowed",
        "Empowered",
        "Weakened",
        "Protected",
        "Unprotected",
        "Cursed",
        "Stunned",
        "Entangled",
        "Exhausted",
        "Inverted",
        "Marked",
        "Silenced",
        "Dizzy",
        "Fragile",
        "Broken",
        "Fleeing",
        "Twilight",
        "FireVulnerability",
        "Guardian",
        "Vulnerable"
    ];

    return !skillsWithoutAmmount.includes(type);
}

export function getStatusDescription(status: StatusType): string {
    switch (status) {
        case "Frozen": return t("battle.statusDescriptions.Frozen");
        case "Shielded": return t("battle.statusDescriptions.Shielded");
        case "Burning": return t("battle.statusDescriptions.Burning");
        case "IntenseFlames": return t("battle.statusDescriptions.IntenseFlames");
        case "Hastened": return t("battle.statusDescriptions.Hastened");
        case "Slowed": return t("battle.statusDescriptions.Slowed");
        case "Empowered": return t("battle.statusDescriptions.Empowered");
        case "Weakened": return t("battle.statusDescriptions.Weakened");
        case "Protected": return t("battle.statusDescriptions.Protected");
        case "Unprotected": return t("battle.statusDescriptions.Unprotected");
        case "Regeneration": return t("battle.statusDescriptions.Regeneration");
        case "Cursed": return t("battle.statusDescriptions.Cursed");
        case "Stunned": return t("battle.statusDescriptions.Stunned");
        case "Confused": return t("battle.statusDescriptions.Confused");
        case "Entangled": return t("battle.statusDescriptions.Entangled");
        case "Exhausted": return t("battle.statusDescriptions.Exhausted");
        case "Frenzy": return t("battle.statusDescriptions.Frenzy");
        case "Rage": return t("battle.statusDescriptions.Rage");
        case "Inverted": return t("battle.statusDescriptions.Inverted");
        case "Marked": return t("battle.statusDescriptions.Marked");
        case "Plagued": return t("battle.statusDescriptions.Plagued");
        case "Silenced": return t("battle.statusDescriptions.Silenced");
        case "Dizzy": return t("battle.statusDescriptions.Dizzy");
        case "Fragile": return t("battle.statusDescriptions.Fragile");
        case "Broken": return t("battle.statusDescriptions.Broken");
        case "Fleeing": return t("battle.statusDescriptions.Fleeing");
        case "FireVulnerability": return t("battle.statusDescriptions.FireVulnerability");
        case "Guardian": return t("battle.statusDescriptions.Guardian");
        case "Foretell": return t("battle.statusDescriptions.Foretell");
        case "Twilight": return t("battle.statusDescriptions.Twilight");
        case "Powerless": return t("battle.statusDescriptions.Powerless");
        case "Rush": return t("battle.statusDescriptions.Rush");
        case "Burn": return t("battle.statusDescriptions.Burn");
        case "Shield": return t("battle.statusDescriptions.Shield");
        case "Powerful": return t("battle.statusDescriptions.Powerful");
        case "Mark": return t("battle.statusDescriptions.Mark");
        case "Shell": return t("battle.statusDescriptions.Shell");
        case "Slow": return t("battle.statusDescriptions.Slow");
        case "Freeze": return t("battle.statusDescriptions.Freeze");
        case "GreaterRush": return t("battle.statusDescriptions.GreaterRush");
        case "GreaterSlow": return t("battle.statusDescriptions.GreaterSlow");
        case "EnfeeblingMark": return t("battle.statusDescriptions.EnfeeblingMark");
        case "DamageReduction": return t("battle.statusDescriptions.DamageReduction");
        case "SuccessiveParry": return t("battle.statusDescriptions.SuccessiveParry");
        case "Aureole": return t("battle.statusDescriptions.Aureole");
        case "Vulnerable": return t("battle.statusDescriptions.Vulnerable");
        case "DoubleDamage": return t("battle.statusDescriptions.DoubleDamage");
        case "Defenceless": return t("battle.statusDescriptions.Defenceless");
        case "Regen": return t("battle.statusDescriptions.Regen");
        case "Curse": return t("battle.statusDescriptions.Curse");
        case "free-shot": return t("battle.statusDescriptions.freeShot");
        case "jump": return t("battle.statusDescriptions.jump");
        case "gradient": return t("battle.statusDescriptions.gradient");
        case "invisible-barrier": return t("battle.statusDescriptions.invisibleBarrier");
        default: return t("battle.statusDescriptions.default");
    }
}

export function getResolveButtonLabel(status: StatusType): string {
    switch (status) {
        case "Frozen":
        case "Burning":
        case "IntenseFlames":
        case "Confused":
            return t("battle.resolveButton.resolve");
        default:
            return t("battle.resolveButton.ok");
    }
}

export function statusNeedsResolveRoll(status: StatusResponse): boolean {
    switch (status.effectName) {
        case "Frozen":
        case "Burning":
        case "IntenseFlames":
        case "Confused":
            return true;
        default:
            return false;
    }
}