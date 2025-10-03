import { APIRefresh, type GetRefreshResponse, type ActionResponse } from "../api/APIRefresh";
import { type PlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
import { type AttackResponse } from "../api/APIRefresh";

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
        if (this.showToast == undefined) { return }

        const attack = action.attack;
        if (attack == undefined || attack.damage == undefined || this.player == undefined) { return; }


        attack.targetBattleIds.forEach((battleID) => {
            this.updateCharacterHP(battleID, attack.damage);
        });

        this.showToast(
            describeAttackPT(this.player, attack)
        );
    }

    private updateCharacterHP(battleID: number, damage: number) {
        if (!this.player?.fightInfo?.characters || !this.setPlayer) return;

        const character = this.player.fightInfo.characters.find(ch => ch.battleID === battleID);
        if (!character) return;

        character.healthPoints = Math.max(0, Math.min(character.healthPoints - damage, character.maxHealthPoints));

        this.setPlayer({ ...this.player });
    }
}


function buildIdToNameMap(chars: BattleCharacterInfo[]): Map<number, string> {
    const map = new Map<number, string>();
    for (const c of chars) map.set(c.battleID, c.name);
    return map;
}

function uniqueInOrder<T>(arr: T[]): T[] {
    const seen = new Set<T>();
    const out: T[] = [];
    for (const x of arr) {
        if (!seen.has(x)) {
            seen.add(x);
            out.push(x);
        }
    }
    return out;
}

/** Junta nomes em PT-BR: "A", "A e B", "A, B e C" */
function joinNamesPtBR(names: string[]): string {
    if (names.length === 0) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function namesFromIds(ids: number[], idToName: Map<number, string>): string[] {
    return ids
        .map(id => idToName.get(id))
        .filter((n): n is string => !!n);
}

function describeAttackPT(
    player: PlayerResponse,
    attack: AttackResponse
): string {
    const chars = player.fightInfo?.characters ?? [];
    const idToName = buildIdToNameMap(chars);

    const originNames = uniqueInOrder(namesFromIds(attack.originBattleIds, idToName));
    const targetNames = uniqueInOrder(namesFromIds(attack.targetBattleIds, idToName));

    const sujeito = joinNamesPtBR(originNames);
    const objetos = joinNamesPtBR(targetNames);

    // Ajuste aqui se quiser incluir dano/elemento:
    // ex.: `${sujeito} atacou ${objetos} (${attack.element}, ${attack.damage} de dano)`
    return `${sujeito} atacou ${objetos}`;
}