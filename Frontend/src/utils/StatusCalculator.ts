import type { GetPlayerResponse } from "../api/APIPlayer";
import type { StatusResponse } from "../api/ResponseModel"
import { getActiveTurnCharacter } from "./CharacterUtils";

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