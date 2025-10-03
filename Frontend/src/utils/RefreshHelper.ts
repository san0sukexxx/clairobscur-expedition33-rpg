import { APIRefresh, type GetRefreshResponse, type ActionResponse } from "../api/APIRefresh";
import { type PlayerResponse } from "../api/APIPlayer";

type ToastOptions = { duration?: number };
type ShowToastFn = (msg: string, opts?: ToastOptions) => void;
type SetPlayer = React.Dispatch<React.SetStateAction<PlayerResponse | null>>;

export class RefreshHelper {
    private character?: string;
    private player?: PlayerResponse | null;
    private setPlayer?: SetPlayer;
    private showToast?: ShowToastFn;

    // Mock
    private firstCall = true;

    init(character: string, player: PlayerResponse | null, setPlayer: SetPlayer, showToast: ShowToastFn) {
        this.character = character;
        this.player = player;
        this.setPlayer = setPlayer;
        this.showToast = showToast;
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
        if (this.showToast == undefined) { return }

        for (const action of response.actions) {
            switch (action.type) {
                case "character-joined-battle":
                    this.showToast("Um jogador se juntou a batalha");
                    this.handleCharacterJoinedBattle(action);
                    break;
                case "battle-started":
                    this.showToast("A batalha começou!");
                    this.handleBattleStarted();
                    break;
                case "attack":
                    this.handleAttack(action);
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

    private handleAttack(action: ActionResponse) {
        const attack = action.attack;
        if (attack == undefined || attack.damage == undefined) { return; }

        attack.targetBattleIds.forEach((battleID) => {
            this.updateCharacterHP(battleID, attack.damage);
        });
    }

    private updateCharacterHP(battleID: number, damage: number) {
        if (!this.player?.fightInfo?.characters || !this.setPlayer) return;

        const character = this.player.fightInfo.characters.find(ch => ch.battleID === battleID);
        if (!character) return;

        character.healthPoints = Math.max(0, Math.min(character.healthPoints - damage, character.maxHealthPoints));

        this.setPlayer({ ...this.player });
    }

}