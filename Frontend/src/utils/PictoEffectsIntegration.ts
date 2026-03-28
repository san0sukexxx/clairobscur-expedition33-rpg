import type { BattleCharacterInfo, PictoResponse, LuminaResponse } from "../api/ResponseModel";

export async function triggerOnHealAlly(
    _healer: BattleCharacterInfo,
    _healedTarget: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[],
    _healAmount?: number
) {
    return [];
}

export async function triggerOnFreeAim(
    _shooter: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnBattleStart(
    _character: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnTurnStart(
    _character: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnRevived(
    _revivedCharacter: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnHealingTint(
    _user: BattleCharacterInfo,
    _target: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnKill(
    _killer: BattleCharacterInfo,
    _killedEnemy: BattleCharacterInfo,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export async function triggerOnDodge(
    _dodger: BattleCharacterInfo,
    _attacker: BattleCharacterInfo | undefined,
    _allCharacters: BattleCharacterInfo[],
    _battleId: number,
    _pictos?: PictoResponse[],
    _luminas?: LuminaResponse[]
) {
    return [];
}

export function showPictoEffectMessage(message: string, toast: any) {
    toast.showToast(message, "info");
}
