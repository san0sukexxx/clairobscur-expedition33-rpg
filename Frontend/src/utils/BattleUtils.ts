import type { StatusType, SkillType } from "../api/ResponseModel";
import { t } from "../i18n";

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

export function getAttackTypeLabel(type: string): string {
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
