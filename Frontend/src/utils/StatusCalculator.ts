import type { GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo, StatusResponse } from "../api/ResponseModel"
import { getNpcById } from "../utils/NpcUtils";
import { getActiveTurnCharacter } from "./CharacterUtils";
import { rollD6 } from "./RollUtils";

export function rollCommandForResolveStatus(status: StatusResponse) {
    var dices = 1

    switch (status.effectName) {
        case "Burning":
            dices = status.ammount
            break
        default:
            break
    }

    return dices + "d6";
}

export function calculateNpcStatusResolvedTotalValue(battleCharacterInfo: BattleCharacterInfo | undefined, status: StatusResponse): number {
    const npcInfo = getNpcById(battleCharacterInfo?.id ?? "")

    switch (status.effectName) {
        case "Burning":
            return rollD6(status.ammount).total
        case "Regeneration":
            return Math.floor((battleCharacterInfo?.maxHealthPoints ?? 0) / status.ammount / 10);
        case "Confused":
            return rollD6(status.ammount).total + (npcInfo?.resistance ?? 0)
        default:
            return rollD6(1).total;
    }
}

export function getCurrentPlayerPendingStatus(player: GetPlayerResponse | null): StatusResponse[] {
    return getCurrentPlayerStatus(player).filter(st => !st.isResolved) ?? [];
}

export function getCurrentPlayerStatus(player: GetPlayerResponse | null): StatusResponse[] {
    if (!player?.fightInfo) return [];

    const characters = player.fightInfo.characters ?? [];
    const playerBattleID = player.fightInfo.playerBattleID;
    const currentCharacter = getActiveTurnCharacter(player);

    if (!playerBattleID || currentCharacter?.battleID !== playerBattleID) return [];

    const ch = characters.find(c => c.battleID === playerBattleID);
    if (!ch) return [];

    return ch.status ?? [];
}