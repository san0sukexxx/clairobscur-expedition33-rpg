import { APIRefresh, type GetRefreshResponse, type ActionResponse } from "../api/APIRefresh";
import { type PlayerResponse } from "../api/APIPlayer";

type SetPlayer = React.Dispatch<React.SetStateAction<PlayerResponse | null>>;

export class RefreshHelper {
    private character?: string;
    private player?: PlayerResponse | null;
    private setPlayer?: SetPlayer;

    // Mock
    private firstCall = true;

    init(character: string, player: PlayerResponse | null, setPlayer: SetPlayer) {
        this.character = character;
        this.player = player;
        this.setPlayer = setPlayer;
    }

    async refreshInfoLoop() {
        // Mock
        if (!this.firstCall) {
            return;
        }
        this.firstCall = false;

        if (this.character == undefined) { return; }

        try {
            const response = await APIRefresh.getInfo(this.character);
            this.handleRefreshInfo(response);

            setTimeout(() => {
                this.refreshInfoLoop();
            }, 1000);
        } catch (e: any) {
            console.error("Erro ao fazer refreshInfo:", e);

            setTimeout(() => {
                this.refreshInfoLoop();
            }, 1000);
        }
    }

    private handleRefreshInfo(response: GetRefreshResponse) {
        if (!response.actions || !this.player || !this.setPlayer) return;

        for (const action of response.actions) {
            switch (action.type) {
                case "character-joined-battle":
                    this.handleCharacterJoinedBattle(action);
                    break;
                case "battle-started":
                    this.handleBattleStarted();
                    break;
                default:
                    break;
            }
        }

        this.setPlayer({ ...this.player! });
    }

    private handleCharacterJoinedBattle(action: ActionResponse) {
        const characterInfo = action.characterJoinedBattle;

        if (characterInfo?.initiative !== undefined) {
            this.player?.fightInfo?.initiatives?.push(characterInfo.initiative);
        }

        if (characterInfo?.character !== undefined) {
            this.player?.fightInfo?.characters?.push(characterInfo.character);
        }
    }

    private handleBattleStarted() {
        if (this.player?.fightInfo) {
            this.player.fightInfo.battleStatus = "started";
        }

    }
}