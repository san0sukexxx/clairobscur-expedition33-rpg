import { type GetPlayerResponse } from "../api/APIPlayer";
import { ignoreEffects, type AttackResponse, type DefenseOption } from "../api/ResponseModel";
import {
    calculateMaxCounterDamage
} from "../utils/PlayerCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { getAttackType, getAttackTypeLabel, getStatusLabel } from "../utils/BattleUtils";
import {
    FaArrowUp,
    FaFireAlt,
    FaShieldAlt,
    FaRunning,
    FaTimes,
    FaHeartBroken
} from "react-icons/fa";

interface PendingAttacksModalProps {
    player: GetPlayerResponse | null;
    weaponList: WeaponDTO[];
    onSelectDefense: (attack: AttackResponse, defense: DefenseOption) => void;
}

export default function PendingAttacksModal({
    player,
    weaponList,
    onSelectDefense,
}: PendingAttacksModalProps) {
    const pendingAttacks = player?.fightInfo?.pendingAttacks ?? [];

    if (!player || pendingAttacks.length === 0 || player.playerSheet?.hpCurrent == 0) return null;

    const characters = player.fightInfo?.characters ?? [];

    const getCharacterNameByBattleId = (battleId: number) => {
        const c = characters.find((x) => x.battleID === battleId);
        return c?.name ?? `Personagem #${battleId}`;
    };

    const isCounterAttack = (attack: AttackResponse) =>
        attack.isResolved === true &&
        attack.allowCounter === true &&
        attack.isCounterResolved === false;

    const counterAttacks = pendingAttacks.filter(isCounterAttack);
    const hasCounter = counterAttacks.length > 0;
    const totalDefendedSum = Math.abs(
        counterAttacks.reduce(
            (sum, attack) => sum + (attack.totalDefended ?? 0),
            0
        )
    );
    const firstCounterAttack = counterAttacks[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-[80%] h-[80%] mx-auto rounded-xl bg-base-100 shadow-lg flex flex-col">
                <div className="flex justify-center px-4 py-3 border-b border-base-300">
                    <h2 className="text-lg font-semibold text-center">
                        {!hasCounter && (
                            "Você está sendo atacado"
                        )}
                        {hasCounter && (
                            "É hora do contra-ataque"
                        )}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 flex flex-col items-center">
                    {hasCounter && firstCounterAttack && (
                        <div className="relative rounded-lg border border-base-300 p-3 flex flex-col gap-2 w-full max-w-xs">
                            <div className="text-sm text-left">
                                <div>
                                    <span className="font-medium">Poder do contra-ataque: </span>
                                    <span>{Math.min(totalDefendedSum, calculateMaxCounterDamage(player, weaponList))}</span>
                                </div>
                            </div>

                            <div className="mt-2 text-xs font-medium opacity-80 text-center">
                                O que você quer fazer?
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                                <button
                                    className="btn btn-xs btn-outline gap-2"
                                    onClick={() => onSelectDefense(firstCounterAttack, "cancel-counter")}
                                >
                                    <FaTimes />
                                    Cancelar
                                </button>

                                <button
                                    className="btn btn-xs btn-primary gap-2"
                                    onClick={() => onSelectDefense(firstCounterAttack, "counter")}
                                >
                                    <FaShieldAlt />
                                    Counter!
                                </button>
                            </div>
                        </div>
                    )}

                    {pendingAttacks
                        .filter((attack) => !isCounterAttack(attack))
                        .map((attack) => {
                            const attacker = getCharacterNameByBattleId(attack.sourceBattleId);
                            const attackType = getAttackType(attack);

                            return (
                                <div
                                    key={attack.id}
                                    className="relative rounded-lg border border-base-300 p-3 flex flex-col gap-2 w-full max-w-xs"
                                >
                                    <button
                                        className="btn btn-xs btn-ghost absolute top-2 right-2 gap-1"
                                        onClick={() => onSelectDefense(attack, "take")}
                                    >
                                        <FaHeartBroken />
                                        Aceitar dano
                                    </button>

                                    <div className="text-sm text-left pr-14">
                                        <div>
                                            <span className="font-medium">Atacante: </span>
                                            <span>{attacker}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Poder total: </span>
                                            <span>{attack.totalPower}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Tipo do ataque: </span>
                                            <span>{getAttackTypeLabel(attackType)}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Efeitos se acertar: </span>
                                            <span>
                                                {attack.effects
                                                    ?.filter(e => !ignoreEffects.includes(e.effectType))
                                                    ?.map(e =>
                                                        `${getStatusLabel(e.effectType)} ${e.ammount ?? ""}${e.remainingTurns ? ` (por ${e.remainingTurns} turno${e.remainingTurns > 1 ? "s" : ""})` : ""
                                                        }`
                                                    )
                                                    .join("; ")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-1 text-xs font-medium opacity-80 text-center">
                                        Como você quer se defender?
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                                        {(attackType === "jump" || attackType === "jump-all") && (
                                            <button
                                                className="btn btn-xs btn-outline gap-2"
                                                onClick={() => onSelectDefense(attack, "jump")}
                                            >
                                                <FaArrowUp />
                                                Pular
                                            </button>
                                        )}

                                        {attackType === "gradient" && (
                                            <button
                                                className="btn btn-xs btn-outline gap-2"
                                                onClick={() => onSelectDefense(attack, "gradient-block")}
                                            >
                                                <FaFireAlt />
                                                Aparar Gradiente
                                            </button>
                                        )}

                                        {attackType === "basic" && (
                                            <>
                                                <button
                                                    className="btn btn-xs btn-outline gap-2"
                                                    onClick={() => onSelectDefense(attack, "block")}
                                                >
                                                    <FaShieldAlt />
                                                    Aparar
                                                </button>

                                                <button
                                                    className="btn btn-xs btn-outline gap-2"
                                                    onClick={() => onSelectDefense(attack, "dodge")}
                                                >
                                                    <FaRunning />
                                                    Desviar
                                                </button>
                                            </>
                                        )}

                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
