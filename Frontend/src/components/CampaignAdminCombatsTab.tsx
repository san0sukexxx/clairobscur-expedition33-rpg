import { useEffect, useState } from "react";
import { FaShieldAlt, FaPlus } from "react-icons/fa";
import { APIBattle, type Battle } from "../api/APIBattle";
import CombatAdmin from "./CombatAdmin";
import { type Campaign } from "../api/APICampaign";
import { getBattleStatusLabel } from "../utils/BattleUtils";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { t } from "../i18n";

interface CampaignAdminCombatsTabProps {
    campaignInfo: Campaign;
    players: GetPlayerResponse[];
}

export default function CampaignAdminCombatsTab({ campaignInfo, players }: CampaignAdminCombatsTabProps) {
    const [battles, setBattles] = useState<Battle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBattleId, setSelectedBattleId] = useState<number | null>(null);

    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    async function loadBattles() {
        setLoading(true);
        setError(null);

        try {
            const data = await APIBattle.listByCampaign(campaignInfo.id);
            setBattles(data);
            if (data.length === 1) {
                setSelectedBattleId(data[0].id);
            }
        } catch {
            setError(t("combatAdmin.errorLoadingCombats"));
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateBattle() {
        try {
            setCreating(true);

            const newId = await APIBattle.create({
                campaignId: campaignInfo.id,
                battleStatus: "starting",
            });

            await loadBattles();
            setSelectedBattleId(newId);
        } catch {
            setError(t("combatAdmin.errorCreating"));
        } finally {
            setCreating(false);
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
            setError(t("combatAdmin.errorDeleting"));
        } finally {
            setDeletingId(null);
        }
    }

    useEffect(() => {
        loadBattles();
    }, [campaignInfo.id]);

    const selectedBattle =
        selectedBattleId != null
            ? battles.find((b) => b.id === selectedBattleId) ?? null
            : null;

    return (
        <>
            {confirmId !== null && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{t("combatAdmin.deleteCombat")}</h3>
                        <p className="py-3">
                            {t("combatAdmin.deleteConfirm")}{" "}
                            <b>#{confirmId}</b>? {t("combatAdmin.actionUndone")}
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => setConfirmId(null)}
                                disabled={deletingId === confirmId}
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleConfirmDelete}
                                disabled={deletingId === confirmId}
                            >
                                {deletingId === confirmId
                                    ? t("combatAdmin.deleting")
                                    : t("combatAdmin.delete")}
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
                            {t("combatAdmin.combatsTitle")}
                        </h2>

                        <button
                            className="btn btn-sm btn-primary gap-2"
                            onClick={handleCreateBattle}
                            disabled={creating}
                        >
                            <FaPlus />
                            {creating ? t("combatAdmin.creating") : t("combatAdmin.createCombat")}
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-4 text-sm opacity-70">
                            {t("combatAdmin.loadingCombats")}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="alert alert-error mt-4 text-sm leading-relaxed">
                            {error}
                        </div>
                    )}

                    {!loading && !error && battles.length === 0 && (
                        <div className="alert alert-info mt-4 text-sm leading-relaxed">
                            {t("combatAdmin.noCombatsFound")}
                        </div>
                    )}

                    {!loading && !error && battles.length > 0 && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left">{t("combatAdmin.combat")}</th>
                                        <th className="text-left">{t("combatAdmin.status")}</th>
                                        <th className="text-left w-1/6">{t("common.actions")}</th>
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
                                                        onClick={() => setSelectedBattleId(battle.id)}
                                                    >
                                                        {t("combatAdmin.use")}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-xs btn-warning"
                                                        onClick={() => setSelectedBattleId(null)}
                                                    >
                                                        {t("combatAdmin.pause")}
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() => setConfirmId(battle.id)}
                                                    disabled={deletingId === battle.id}
                                                >
                                                    {t("combatAdmin.delete")}
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
                                key={selectedBattle.id}
                                players={players}
                                campaignInfo={campaignInfo}
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
