import React from "react"
import { type GetAttacksResponse, type BattleWithDetailsResponse } from "../api/APIBattle"
import { t } from "../i18n"

interface AttacksModalProps {
    isOpen: boolean
    attacks: GetAttacksResponse[]
    onClose: () => void
    onRollDefense: (attack: GetAttacksResponse) => void
    battleDetails: BattleWithDetailsResponse | null
}

export function AttacksModal({ isOpen, attacks, onClose, onRollDefense, battleDetails }: AttacksModalProps) {
    if (!isOpen) return null

    const getCharacterName = (battleCharacterId: number): string => {
        const ch = battleDetails?.characters.find(c => c.battleID === battleCharacterId)
        return ch?.name ?? `#${battleCharacterId}`
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
                    <h2 className="text-lg font-semibold">{t("combat.pendingAttacks")}</h2>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onClose}
                    >
                        {t("common.close")}
                    </button>
                </div>

                <div className="p-4 overflow-auto">
                    {attacks.length === 0 ? (
                        <div className="text-sm text-neutral-400 text-center py-6">
                            Nenhum ataque pendente.
                        </div>
                    ) : (
                        <table className="table table-sm w-full">
                            <thead>
                                <tr>
                                    <th>Poder total</th>
                                    <th>Atacante</th>
                                    <th>Alvo</th>
                                    <th>Efeitos</th>
                                    <th className="text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attacks.map(attack => {
                                    const attackerName = getCharacterName(attack.sourceBattleId)
                                    const targetName = getCharacterName(attack.targetBattleId)

                                    return (
                                        <tr key={attack.id}>
                                            <td>{attack.totalPower}</td>
                                            <td>{attackerName}</td>
                                            <td>{targetName}</td>
                                            <td>
                                                {attack.effects.length === 0
                                                    ? "—"
                                                    : attack.effects
                                                        .map(e => `${e.effectType} (${e.ammount})`)
                                                        .join(", ")}
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-xs"
                                                    onClick={() => onRollDefense(attack)}
                                                >
                                                    Rolar defesa
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-base-300 flex justify-end">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}
