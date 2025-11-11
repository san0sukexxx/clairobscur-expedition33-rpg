import { useEffect, useRef, useState } from "react";
import { FaUserFriends, FaTrash, FaArrowRight } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaignPlayer } from "../api/APICampaignPlayer";
import { getCharacterLabelById } from "../utils/CharacterUtils";

interface CampaignAdminSheetsProps {
    campaignId: number | null;
    campaignName: string;
    items: GetPlayerResponse[];
    loading: boolean;
    reload: () => void;
    navigateToDetails: (playerId: number) => void;
}

export default function CampaignAdminSheets({
    campaignId,
    campaignName,
    items,
    loading,
    reload,
    navigateToDetails,
}: CampaignAdminSheetsProps) {
    const [visibleItems, setVisibleItems] = useState<GetPlayerResponse[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    const confirmDialogRef = useRef<HTMLDialogElement | null>(null);

    useEffect(() => {
        setVisibleItems(items);
    }, [items]);

    function openConfirmDialog(playerId: number) {
        setConfirmingId(playerId);
        confirmDialogRef.current?.showModal();
    }

    function closeConfirmDialog() {
        confirmDialogRef.current?.close();
        setConfirmingId(null);
    }

    async function deletePlayerFromCampaign(playerId: number) {
        if (campaignId == null) return;
        setDeletingId(playerId);
        try {
            setVisibleItems(prev => prev.filter(p => p.id !== playerId));
            await APICampaignPlayer.delete(campaignId, playerId);
            await reload();
        } catch (e) {
            console.error("Erro ao deletar jogador", e);
            await reload();
        } finally {
            setDeletingId(null);
            closeConfirmDialog();
        }
    }

    return (
        <>
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="card-title">
                            <FaUserFriends className="opacity-60" /> Jogadores ({items.length})
                        </h2>
                    </div>

                    {loading && (
                        <div className="text-center py-4 text-sm opacity-70">
                            Carregando...
                        </div>
                    )}

                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nome</th>
                                        <th>Personagem</th>
                                        <th className="text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleItems.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{p.playerSheet?.name || "-"}</td>
                                            <td className="opacity-80">
                                                {getCharacterLabelById(p.playerSheet?.characterId) || "-"}
                                            </td>
                                            <td className="text-right flex justify-end gap-2">
                                                <button
                                                    className="btn btn-error btn-xs gap-1"
                                                    onClick={() => openConfirmDialog(p.id)}
                                                    disabled={deletingId === p.id}
                                                >
                                                    {deletingId === p.id ? "Carregando..." : (
                                                        <>
                                                            <FaTrash /> Remover
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    className="btn btn-primary btn-xs gap-1"
                                                    onClick={() => navigateToDetails(p.id)}
                                                >
                                                    <FaArrowRight />
                                                    {p.isMasterEditing ? "Editando" : "Detalhes"}
                                                </button>

                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="text-center opacity-60">
                                                Nenhum jogador ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <dialog ref={confirmDialogRef} className="modal items-start pt-7">
                <div
                    className="fixed inset-0 bg-black/70 z-10"
                    onClick={closeConfirmDialog}
                />

                <div className="modal-box max-w-md w-[92vw] bg-base-100 text-base-content shadow-xl p-0 overflow-hidden relative z-20">
                    <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between bg-base-200">
                        <h3 className="font-bold text-lg text-base-content">
                            Remover jogador
                        </h3>
                        <form method="dialog">
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={closeConfirmDialog}
                            >
                                X
                            </button>
                        </form>
                    </div>

                    <div className="px-6 py-6 space-y-4">
                        <p className="text-sm leading-relaxed">
                            Tem certeza que deseja remover este jogador da campanha?
                            Esta ação não pode ser desfeita.
                        </p>

                        <div className="bg-base-300 rounded-lg p-3 text-xs">
                            <div className="font-semibold">
                                ID do jogador: {confirmingId ?? "-"}
                            </div>
                            <div className="opacity-70">
                                Campanha: {campaignName}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                className="btn flex-1 !min-h-[2.5rem] text-sm"
                                onClick={closeConfirmDialog}
                                disabled={deletingId !== null}
                            >
                                Cancelar
                            </button>

                            <button
                                className="btn btn-error flex-1 !min-h-[2.5rem] text-sm"
                                onClick={() => {
                                    if (confirmingId != null) {
                                        deletePlayerFromCampaign(confirmingId);
                                    }
                                }}
                                disabled={deletingId !== null}
                            >
                                {deletingId !== null ? "Removendo..." : "Remover jogador"}
                            </button>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}
