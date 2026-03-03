import { useEffect, useState, useMemo } from "react";
import { FaDragon, FaPlus, FaTrash, FaEdit, FaArrowLeft, FaMinus } from "react-icons/fa";
import { APIEncounter, type EncounterResponse, type EncounterNpcDto, type EncounterRewardDto } from "../api/APIEncounter";
import { type Campaign } from "../api/APICampaign";
import { getAllNPCsSorted, getNpcById } from "../utils/NpcUtils";
import { t, getWeaponName, getPictoName, getAllWeaponIds, getAllPictoIds } from "../i18n";

interface CampaignAdminEncountersTabProps {
    campaignInfo: Campaign;
}

function calculateNPCDifficulty(npcId: string): number {
    const npc = getNpcById(npcId);
    if (!npc) return 0;

    const strMod = Math.floor((npc.strength - 10) / 2);
    const dexMod = Math.floor((npc.dexterity - 10) / 2);
    const conMod = Math.floor((npc.constitution - 10) / 2);
    let score = strMod + dexMod + conMod;

    if (npc.weakTo) score -= 1;
    if (npc.resistentTo) score += 1;
    if (npc.imuneTo) score += 1;
    if (npc.absorbElement) score += 1;
    if (npc.freeShotWeakPoints) score -= 1;
    if (npc.attackList && npc.attackList.length > 0) score += 1;
    if (npc.isFlying) score += 1;
    if (npc.maxLifeBonus) score += 1;

    if (score <= 1) return 0.25;
    if (score <= 3) return 0.5;
    if (score <= 5) return 1;
    if (score <= 7) return 2;
    if (score <= 9) return 3;
    if (score <= 11) return 4;
    if (score <= 13) return 5;
    return Math.min(30, 6 + Math.floor((score - 14) / 2));
}

function formatCR(cr: number): string {
    if (cr === 0.125) return "1/8";
    if (cr === 0.25) return "1/4";
    if (cr === 0.5) return "1/2";
    return String(cr);
}

export default function CampaignAdminEncountersTab({ campaignInfo }: CampaignAdminEncountersTabProps) {
    const [encounters, setEncounters] = useState<EncounterResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Edit state
    const [editingEncounter, setEditingEncounter] = useState<EncounterResponse | null>(null);
    const [editName, setEditName] = useState("");
    const [editNpcs, setEditNpcs] = useState<EncounterNpcDto[]>([]);
    const [editRewards, setEditRewards] = useState<EncounterRewardDto[]>([]);
    const [saving, setSaving] = useState(false);

    // NPC search
    const [npcSearch, setNpcSearch] = useState("");
    const [npcDropdownOpen, setNpcDropdownOpen] = useState(false);

    // Reward form
    const [newRewardType, setNewRewardType] = useState<string>("weapon");
    const [rewardSearch, setRewardSearch] = useState("");
    const [rewardDropdownOpen, setRewardDropdownOpen] = useState(false);
    const [newRewardLevel, setNewRewardLevel] = useState(1);

    async function loadEncounters() {
        setLoading(true);
        try {
            const data = await APIEncounter.listByCampaign(campaignInfo.id);
            setEncounters(data);
        } catch {
            console.error("Error loading encounters");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEncounters();
    }, [campaignInfo.id]);

    async function handleCreate() {
        try {
            setCreating(true);
            const created = await APIEncounter.create({
                campaignId: campaignInfo.id,
                name: t("encounters.title") + " " + (encounters.length + 1),
            });
            await loadEncounters();
            startEditing(created);
        } catch {
            console.error("Error creating encounter");
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete() {
        if (!confirmDeleteId) return;
        try {
            setDeletingId(confirmDeleteId);
            await APIEncounter.delete(confirmDeleteId);
            setConfirmDeleteId(null);
            if (editingEncounter?.id === confirmDeleteId) {
                setEditingEncounter(null);
            }
            await loadEncounters();
        } catch {
            console.error("Error deleting encounter");
        } finally {
            setDeletingId(null);
        }
    }

    function startEditing(encounter: EncounterResponse) {
        setEditingEncounter(encounter);
        setEditName(encounter.name);
        setEditNpcs([...encounter.npcs]);
        setEditRewards([...encounter.rewards]);
        setNpcSearch("");
        setNpcDropdownOpen(false);
    }

    async function handleSave() {
        if (!editingEncounter) return;
        try {
            setSaving(true);
            await APIEncounter.update(editingEncounter.id, {
                name: editName,
                npcs: editNpcs,
                rewards: editRewards,
            });
            await loadEncounters();
            setEditingEncounter(null);
        } catch {
            console.error("Error saving encounter");
        } finally {
            setSaving(false);
        }
    }

    // NPC management
    function addNpc(npcId: string) {
        const existing = editNpcs.find((n) => n.npcId === npcId);
        if (existing) {
            setEditNpcs(editNpcs.map((n) => n.npcId === npcId ? { ...n, quantity: n.quantity + 1 } : n));
        } else {
            setEditNpcs([...editNpcs, { npcId, quantity: 1 }]);
        }
        setNpcSearch("");
        setNpcDropdownOpen(false);
    }

    function removeNpc(npcId: string) {
        setEditNpcs(editNpcs.filter((n) => n.npcId !== npcId));
    }

    function updateNpcQuantity(npcId: string, delta: number) {
        setEditNpcs(editNpcs.map((n) => {
            if (n.npcId !== npcId) return n;
            const newQty = Math.max(1, n.quantity + delta);
            return { ...n, quantity: newQty };
        }));
    }

    // Reward management
    function addReward(itemId: string) {
        setEditRewards([...editRewards, {
            rewardType: newRewardType,
            itemId,
            level: newRewardLevel,
        }]);
        setRewardSearch("");
        setRewardDropdownOpen(false);
        setNewRewardLevel(1);
    }

    function removeReward(index: number) {
        setEditRewards(editRewards.filter((_, i) => i !== index));
    }

    const filteredNpcs = useMemo(() => {
        const all = getAllNPCsSorted();
        if (!npcSearch.trim()) return all;
        const search = npcSearch.toLowerCase();
        return all.filter((npc) => {
            const matchesName = npc.name.toLowerCase().includes(search);
            const cr = formatCR(calculateNPCDifficulty(npc.id));
            return matchesName || cr.includes(search);
        });
    }, [npcSearch]);

    const filteredRewardItems = useMemo(() => {
        const ids = newRewardType === "weapon" ? getAllWeaponIds() : getAllPictoIds();
        const getName = newRewardType === "weapon" ? getWeaponName : getPictoName;
        const items = ids.map((id) => ({ id, name: getName(id) }));
        const search = rewardSearch.toLowerCase();
        const filtered = search
            ? items.filter((item) => item.name.toLowerCase().includes(search))
            : items;
        return filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }, [newRewardType, rewardSearch]);

    function getRewardDisplayName(reward: EncounterRewardDto): string {
        if (reward.rewardType === "weapon") {
            return getWeaponName(reward.itemId) || reward.itemId;
        }
        return getPictoName(reward.itemId) || reward.itemId;
    }

    // ─── EDITING VIEW ──────────────────────────────────────────────
    if (editingEncounter) {
        return (
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setEditingEncounter(null)}
                        >
                            <FaArrowLeft />
                            {t("encounters.back")}
                        </button>
                        <h2 className="card-title flex-1">
                            <FaDragon className="opacity-60" />
                            {t("encounters.edit")}
                        </h2>
                    </div>

                    {/* Encounter name */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text font-semibold">{t("encounters.encounterName")}</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t("encounters.namePlaceholder")}
                        />
                    </div>

                    {/* NPCs Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">{t("encounters.npcs")}</h3>

                        {editNpcs.length === 0 && (
                            <p className="text-sm opacity-60 mb-2">{t("encounters.noNpcsAdded")}</p>
                        )}

                        <div className="flex flex-col gap-2 mb-3">
                            {editNpcs.map((npcEntry) => {
                                const npc = getNpcById(npcEntry.npcId);
                                return (
                                    <div key={npcEntry.npcId} className="flex items-center gap-3 bg-base-200 rounded-lg p-2">
                                        <img
                                            src={`/enemies/${npcEntry.npcId}.png`}
                                            alt={npc?.name ?? npcEntry.npcId}
                                            className="w-10 h-10 rounded-full object-cover bg-base-300"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-semibold text-sm truncate">{npc?.name ?? npcEntry.npcId}</span>
                                            <span className="text-xs opacity-60">
                                                {t("encounters.challengeRating")} {formatCR(calculateNPCDifficulty(npcEntry.npcId))}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="btn btn-xs btn-ghost"
                                                onClick={() => updateNpcQuantity(npcEntry.npcId, -1)}
                                            >
                                                <FaMinus />
                                            </button>
                                            <span className="font-mono text-sm w-6 text-center">{npcEntry.quantity}</span>
                                            <button
                                                className="btn btn-xs btn-ghost"
                                                onClick={() => updateNpcQuantity(npcEntry.npcId, 1)}
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                        <button
                                            className="btn btn-xs btn-error btn-ghost"
                                            onClick={() => removeNpc(npcEntry.npcId)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* NPC Search */}
                        <div className="relative">
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                placeholder={t("encounters.searchNpc")}
                                value={npcSearch}
                                onChange={(e) => { setNpcSearch(e.target.value); setNpcDropdownOpen(true); }}
                                onFocus={() => setNpcDropdownOpen(true)}
                            />
                            {npcDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredNpcs.map((npc) => (
                                        <button
                                            key={npc.id}
                                            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-base-200 text-left"
                                            onClick={() => addNpc(npc.id)}
                                        >
                                            <img
                                                src={`/enemies/${npc.id}.png`}
                                                alt={npc.name}
                                                className="w-8 h-8 rounded-full object-cover bg-base-300"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-medium truncate">{npc.name}</span>
                                                <span className="text-xs opacity-60">{t("encounters.challengeRating")} {formatCR(calculateNPCDifficulty(npc.id))}</span>
                                            </div>
                                            <FaPlus className="opacity-40" />
                                        </button>
                                    ))}
                                    {filteredNpcs.length === 0 && (
                                        <div className="px-3 py-2 text-sm opacity-60">
                                            {t("encounters.noNpcsAdded")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {npcDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setNpcDropdownOpen(false)} />
                        )}
                    </div>

                    {/* Rewards Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">{t("encounters.rewards")}</h3>

                        {editRewards.length === 0 && (
                            <p className="text-sm opacity-60 mb-2">{t("encounters.noRewards")}</p>
                        )}

                        <div className="flex flex-col gap-2 mb-3">
                            {editRewards.map((reward, idx) => (
                                <div key={idx} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-base-200 rounded-lg p-2">
                                    <span className="badge badge-sm badge-outline shrink-0">
                                        {reward.rewardType === "weapon" ? t("rewards.weapon") : t("rewards.picto")}
                                    </span>
                                    <span className="text-sm flex-1 basis-0 min-w-[100px] break-words">{getRewardDisplayName(reward)}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs opacity-60">{t("rewards.level")}</span>
                                        <input
                                            type="number"
                                            className="input input-bordered input-xs w-14 text-center"
                                            value={reward.level || ""}
                                            min={1}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                const level = raw === "" ? 0 : parseInt(raw);
                                                if (!isNaN(level)) {
                                                    setEditRewards(editRewards.map((r, i) => i === idx ? { ...r, level } : r));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (!reward.level) {
                                                    setEditRewards(editRewards.map((r, i) => i === idx ? { ...r, level: 1 } : r));
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-xs btn-error btn-ghost"
                                        onClick={() => removeReward(idx)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add reward form */}
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="form-control">
                                <label className="label py-0">
                                    <span className="label-text text-xs">{t("encounters.rewardType")}</span>
                                </label>
                                <select
                                    className="select select-bordered select-sm"
                                    value={newRewardType}
                                    onChange={(e) => { setNewRewardType(e.target.value); setRewardSearch(""); setRewardDropdownOpen(false); }}
                                >
                                    <option value="weapon">{t("rewards.weapon")}</option>
                                    <option value="picto">{t("rewards.picto")}</option>
                                </select>
                            </div>
                            <div className="form-control w-20">
                                <label className="label py-0">
                                    <span className="label-text text-xs">{t("encounters.rewardLevel")}</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered input-sm"
                                    value={newRewardLevel || ""}
                                    min={1}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const level = raw === "" ? 0 : parseInt(raw);
                                        if (!isNaN(level)) setNewRewardLevel(level);
                                    }}
                                    onBlur={() => { if (!newRewardLevel) setNewRewardLevel(1); }}
                                />
                            </div>
                        </div>
                        <div className="relative mt-2">
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                placeholder={t("encounters.rewardItem")}
                                value={rewardSearch}
                                onChange={(e) => { setRewardSearch(e.target.value); setRewardDropdownOpen(true); }}
                                onFocus={() => setRewardDropdownOpen(true)}
                            />
                            {rewardDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredRewardItems.map((item) => (
                                        <button
                                            key={item.id}
                                            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-base-200 text-left"
                                            onClick={() => addReward(item.id)}
                                        >
                                            <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                                            <FaPlus className="opacity-40" />
                                        </button>
                                    ))}
                                    {filteredRewardItems.length === 0 && (
                                        <div className="px-3 py-2 text-sm opacity-60">
                                            {t("encounters.noRewards")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {rewardDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setRewardDropdownOpen(false)} />
                        )}
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end">
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving || !editName.trim()}
                        >
                            {saving ? t("encounters.saving") : t("encounters.save")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── LIST VIEW ──────────────────────────────────────────────────
    return (
        <>
            {confirmDeleteId !== null && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">{t("encounters.delete")}</h3>
                        <p className="py-3">{t("encounters.deleteConfirm")}</p>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === confirmDeleteId}
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleDelete}
                                disabled={deletingId === confirmDeleteId}
                            >
                                {deletingId === confirmDeleteId ? t("encounters.deleting") : t("encounters.delete")}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <h2 className="card-title flex items-center gap-2">
                            <FaDragon className="opacity-60" />
                            {t("encounters.title")}
                        </h2>
                        <button
                            className="btn btn-sm btn-primary gap-2"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            <FaPlus />
                            {creating ? t("encounters.creating") : t("encounters.create")}
                        </button>
                    </div>

                    {loading && (
                        <div className="mt-4 text-sm opacity-70">{t("encounters.loading")}</div>
                    )}

                    {!loading && encounters.length === 0 && (
                        <div className="alert alert-info mt-4 text-sm leading-relaxed">
                            {t("encounters.noEncountersFound")}
                        </div>
                    )}

                    {!loading && encounters.length > 0 && (
                        <div className="mt-4 flex flex-col divide-y divide-base-300">
                            {encounters.map((enc) => (
                                <div key={enc.id} className="flex items-center gap-3 py-3 px-1">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-sm">{enc.name}</span>
                                        <div className="flex gap-2 mt-1">
                                            <span className="badge badge-sm badge-ghost">
                                                {enc.npcs.reduce((sum, n) => sum + n.quantity, 0)} {t("encounters.npcCount")}
                                            </span>
                                            <span className="badge badge-sm badge-ghost">
                                                {enc.rewards.length} {t("encounters.rewardCount")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            className="btn btn-xs btn-outline"
                                            onClick={() => startEditing(enc)}
                                        >
                                            <FaEdit />
                                            {t("encounters.edit")}
                                        </button>
                                        <button
                                            className="btn btn-xs btn-error"
                                            onClick={() => setConfirmDeleteId(enc.id)}
                                            disabled={deletingId === enc.id}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
