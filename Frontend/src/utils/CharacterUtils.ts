import type { BattleWithDetailsResponse } from "../api/APIBattle";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo } from "../api/ResponseModel";

export const CHARACTERS_LIST = [
    { id: "gustave", label: "Gustave" },
    { id: "maelle", label: "Maelle" },
    { id: "sciel", label: "Sciel" },
    { id: "lune", label: "Lune" },
    { id: "verso", label: "Verso" },
    { id: "monoco", label: "Monoco" },
];

export function getCharacterLabelById(id?: string | null): string | null {
    if (!id) return null;
    const found = CHARACTERS_LIST.find(c => c.id === id);
    return found ? found.label : null;
}

export function getActiveTurnCharacter(player: GetPlayerResponse | null): BattleCharacterInfo | undefined {
    if (player?.fightInfo?.turns == undefined || player?.fightInfo?.turns.length == 0) {
        return undefined;
    }

    const turn = player.fightInfo.turns.find(t => t.playOrder == 1);
    return player.fightInfo.characters?.find(c => c.battleID == turn?.battleCharacterId);
}

export function getPlayerCharacter(player: GetPlayerResponse | null): BattleCharacterInfo | undefined {
    if (!player?.fightInfo) return undefined;

    const playerBattleId = player.fightInfo.playerBattleID;
    if (playerBattleId == null) return undefined;

    return player.fightInfo.characters?.find(c => c.battleID === playerBattleId);
}

export function getActiveTurnCharacterFromBattle(battleDetails: BattleWithDetailsResponse): BattleCharacterInfo | undefined {
    if (battleDetails?.turns == undefined || battleDetails?.turns.length == 0) {
        return undefined;
    }

    const turn = battleDetails.turns.find(t => t.playOrder == 1);
    return battleDetails.characters.find(c => c.battleID == turn?.battleCharacterId)
}