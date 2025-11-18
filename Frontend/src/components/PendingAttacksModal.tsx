import React from "react";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { type AttackResponse, type DefenseOption } from "../api/ResponseModel";

interface PendingAttacksModalProps {
    player: GetPlayerResponse | null;
    onSelectDefense: (attack: AttackResponse, defense: DefenseOption) => void;
}

export default function PendingAttacksModal({
    player,
    onSelectDefense,
}: PendingAttacksModalProps) {
    const pendingAttacks = player?.fightInfo?.pendingAttacks ?? [];

    if (!player || pendingAttacks.length === 0) return null;

    const characters = player.fightInfo?.characters ?? [];

    const getCharacterNameByBattleId = (battleId: number) => {
        const c = characters.find((x) => x.battleID === battleId);
        return c?.name ?? `Personagem #${battleId}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-[80%] h-[80%] mx-auto rounded-xl bg-base-100 shadow-lg flex flex-col">
                <div className="flex justify-center px-4 py-3 border-b border-base-300">
                    <h2 className="text-lg font-semibold text-center">
                        Você está sendo atacado
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 flex flex-col items-center">
                    {pendingAttacks.map((attack) => {
                        const attacker = getCharacterNameByBattleId(attack.sourceBattleId);

                        return (
                            <div
                                key={attack.id}
                                className="relative rounded-lg border border-base-300 p-3 flex flex-col gap-2 w-full max-w-xs"
                            >
                                <button
                                    className="btn btn-xs btn-ghost absolute top-2 right-2"
                                    onClick={() => onSelectDefense(attack, "take")}
                                >
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
                                </div>

                                <div className="mt-1 text-xs font-medium opacity-80 text-center">
                                    Como você quer se defender?
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center mt-1">
                                    <button
                                        className="btn btn-xs btn-outline"
                                        onClick={() => onSelectDefense(attack, "block")}
                                    >
                                        Aparar
                                    </button>

                                    <button
                                        className="btn btn-xs btn-outline"
                                        onClick={() => onSelectDefense(attack, "dodge")}
                                    >
                                        Desviar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
