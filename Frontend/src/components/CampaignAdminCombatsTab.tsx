import { useEffect, useState } from "react";
import { FaShieldAlt, FaPlus } from "react-icons/fa";
import { APIBattle, type Battle } from "../api/APIBattle";
import CombatAdmin from "./CombatAdmin";
import { getBattleStatusLabel } from "../utils/BattleUtils";
import { type GetPlayerResponse } from "../api/APIPlayer";

interface CampaignAdminCombatsTabProps {
    campaignId: number;
    players: GetPlayerResponse[];
}

export default function CampaignAdminCombatsTab({ campaignId, players }: CampaignAdminCombatsTabProps) {
    const [battles, setBattles] = useState<Battle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const [selectedBattleId, setSelectedBattleId] = useState<number | null>(null);

    async function loadBattles() {
        setLoading(true);
        setError(null);

        try {
            const data = await APIBattle.listByCampaign(campaignId);
            setBattles(data);
        } catch {
            setError("Não foi possível carregar os combates desta campanha.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateBattle() {
        try {
            setCreating(true);

            const newId = await APIBattle.create({
                campaignId,
                battleStatus: "starting",
            });

            await loadBattles();
            setSelectedBattleId(newId);
        } catch {
            setError("Erro ao criar o combate.");
        } finally {
            setCreating(false);
        }
    }

    async function handleOpenBattle(battleId: number) {
        try {
            setSelectedBattleId(battleId)
            await APIBattle.useBattle(battleId, campaignId)
        } catch (error) {
            console.error("Erro ao ativar batalha:", error)
            alert("Não foi possível ativar a batalha.")
        }
    }

    function handleBattleStatusChanged(newStatus: string) {
        if (selectedBattleId == null) return;

        setBattles((oldBattles) =>
            oldBattles.map((b) =>
                b.id === selectedBattleId
                    ? { ...b, battleStatus: newStatus }
                    : b
            )
        );
    }

    async function handleConfirmDelete() {
        if (!confirmId) return;
        try {
            setDeletingId(confirmId);
            await APIBattle.delete(confirmId);
            setConfirmId(null);

            await loadBattles();

            if (selectedBattleId === confirmId) {
                setSelectedBattleId(null);
            }
        } catch {
            setError("Erro ao apagar o combate.");
        } finally {
            setDeletingId(null);
        }
    }

    useEffect(() => {
        loadBattles();
    }, [campaignId]);

    const selectedBattle =
        selectedBattleId != null
            ? battles.find((b) => b.id === selectedBattleId) ?? null
            : null;

    return (
        <>
            {confirmId !== null && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Apagar combate</h3>
                        <p className="py-3">
                            Tem certeza que deseja apagar o combate{" "}
                            <b>#{confirmId}</b>? Esta ação não poderá ser desfeita.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => setConfirmId(null)}
                                disabled={deletingId === confirmId}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleConfirmDelete}
                                disabled={deletingId === confirmId}
                            >
                                {deletingId === confirmId
                                    ? "Encerrando..."
                                    : "Apagar"}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <h2 className="card-title flex items-center gap-2">
                            <FaShieldAlt className="opacity-60" />
                            Combates
                        </h2>

                        <button
                            className="btn btn-sm btn-primary gap-2"
                            onClick={handleCreateBattle}
                            disabled={creating}
                        >
                            <FaPlus />
                            {creating ? "Criando..." : "Criar combate"}
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-4 text-sm opacity-70">
                            Carregando combates...
                        </div>
                    )}

                    {!loading && error && (
                        <div className="alert alert-error mt-4 text-sm leading-relaxed">
                            {error}
                        </div>
                    )}

                    {!loading && !error && battles.length === 0 && (
                        <div className="alert alert-info mt-4 text-sm leading-relaxed">
                            Nenhum combate encontrado para esta campanha.
                        </div>
                    )}

                    {!loading && !error && battles.length > 0 && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left">Combate</th>
                                        <th className="text-left">Status</th>
                                        <th className="text-left w-1/6">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {battles.map((battle) => (
                                        <tr key={battle.id}>
                                            <td>#{battle.id}</td>
                                            <td>{getBattleStatusLabel(battle.battleStatus)}</td>
                                            <td className="flex gap-2">
                                                {battle.id !== selectedBattleId ? (
                                                    <button
                                                        className="btn btn-xs btn-outline"
                                                        onClick={() => handleOpenBattle(battle.id)}
                                                    >
                                                        Usar
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-xs btn-warning"
                                                        onClick={async () => {
                                                            try {
                                                                await APIBattle.clearBattle(campaignId)
                                                                setSelectedBattleId(null)
                                                            } catch (error) {
                                                                console.error("Erro ao pausar batalha:", error)
                                                                alert("Não foi possível pausar a batalha.")
                                                            }
                                                        }}
                                                    >
                                                        Pausar
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() => setConfirmId(battle.id)}
                                                    disabled={deletingId === battle.id}
                                                >
                                                    Apagar
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedBattle && (
                        <div className="mt-8">
                            <CombatAdmin
                                players={players}
                                battleId={selectedBattle.id}
                                initialStatus={selectedBattle.battleStatus}
                                onStatusChanged={handleBattleStatusChanged}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
