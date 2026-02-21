import type { GetPlayerResponse } from "../api/APIPlayer";
import { type AttackType, type AttackResponse, type StatusType, type BattleCharacterInfo, type SkillType, type StatusResponse } from "../api/ResponseModel";
import { t } from "../i18n";

/**
 * Calcula o bônus de dano baseado no Rank de Perfeição do Verso
 * D: +0 (sem bônus)
 * C: +2
 * B: +4
 * A: +6
 * S: +8
 */
export function getVersoPerfectionDamageBonus(rank: string | null | undefined): number {
    switch (rank) {
        case "S": return 8;
        case "A": return 6;
        case "B": return 4;
        case "C": return 2;
        case "D": return 0;
        default: return 0;
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
        case "StormCaller": return t("battle.statusEffects.StormCaller");
        case "Typhoon": return t("battle.statusEffects.Typhoon");
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
        case "FortunesFury": return t("battle.statusEffects.FortunesFury");
        case "Regen": return t("battle.statusEffects.Regen");
        case "Curse": return t("battle.statusEffects.Curse");
        case "Earthquake": return t("battle.statusEffects.Earthquake");
        case "free-shot": return t("battle.statusEffects.freeShot");
        case "jump": return t("battle.statusEffects.jump");
        case "gradient": return t("battle.statusEffects.gradient");
        case "invisible-barrier": return t("battle.statusEffects.invisibleBarrier");
        case "DamageEscalation": return t("battle.statusEffects.DamageEscalation");
        case "Charging": return t("battle.statusEffects.Charging");
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
        "FireVulnerability",
        "Guardian",
        "Vulnerable",
        "FortunesFury",
        "Charging"
    ];

    return !skillsWithoutAmmount.includes(type);
}

export function getStatusDescription(status: StatusType): string {
    switch (status) {
        case "Frozen": return t("battle.statusDescriptions.Frozen");
        case "Shielded": return t("battle.statusDescriptions.Shielded");
        case "Burning": return t("battle.statusDescriptions.Burning");
        case "IntenseFlames": return t("battle.statusDescriptions.IntenseFlames");
        case "StormCaller": return t("battle.statusDescriptions.StormCaller");
        case "Typhoon": return t("battle.statusDescriptions.Typhoon");
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
        case "FortunesFury": return t("battle.statusDescriptions.FortunesFury");
        case "Regen": return t("battle.statusDescriptions.Regen");
        case "Curse": return t("battle.statusDescriptions.Curse");
        case "Earthquake": return t("battle.statusDescriptions.Earthquake");
        case "free-shot": return t("battle.statusDescriptions.freeShot");
        case "jump": return t("battle.statusDescriptions.jump");
        case "gradient": return t("battle.statusDescriptions.gradient");
        case "invisible-barrier": return t("battle.statusDescriptions.invisibleBarrier");
        case "DamageEscalation": return t("battle.statusDescriptions.DamageEscalation");
        case "Charging": return t("battle.statusDescriptions.Charging");
        default: return t("battle.statusDescriptions.default");
    }
}

export function getResolveButtonLabel(status: StatusType): string {
    switch (status) {
        case "Frozen":
        case "Burning":
        case "IntenseFlames":
        case "Earthquake":
        case "StormCaller":
        case "Typhoon":
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
        case "Earthquake":
        case "StormCaller":
        case "Typhoon":
        case "Confused":
            return true;
        default:
            return false;
    }
}