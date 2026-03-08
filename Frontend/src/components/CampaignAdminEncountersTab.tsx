import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { FaDragon, FaPlus, FaTrash, FaEdit, FaArrowLeft, FaMinus, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { APIEncounter, type EncounterResponse, type EncounterNpcDto, type EncounterRewardDto } from "../api/APIEncounter";
import { type Campaign } from "../api/APICampaign";
import { getAllNPCsSorted, getNpcById, handleNpcImgError } from "../utils/NpcUtils";
import { CHARACTERS_LIST } from "../utils/CharacterUtils";
import { t, getWeaponName, getPictoName, getAllWeaponIds, getAllPictoIds, getLocationName } from "../i18n";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import { getAllLocationsSorted, getMainStoryLocations } from "../utils/LocationUtils";
import { StoryEncountersList } from "../data/StoryEncountersList";

interface CampaignAdminEncountersTabProps {
    campaignInfo: Campaign;
}

function getNpcCR(npcId: string): number {
    const npc = getNpcById(npcId);
    return npc?.challengeRating ? parseFloat(npc.challengeRating) : 0;
}

function calculateEncounterCR(npcs: EncounterNpcDto[]): number {
    return npcs.reduce((total, npc) => total + getNpcCR(npc.npcId) * npc.quantity, 0);
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
    const [editLocationId, setEditLocationId] = useState<string>("");
    const [editNpcs, setEditNpcs] = useState<EncounterNpcDto[]>([]);
    const [editRewards, setEditRewards] = useState<EncounterRewardDto[]>([]);
    const [editBonusXp, setEditBonusXp] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);

    // NPC search
    const [npcSearch, setNpcSearch] = useState("");
    const [npcDropdownOpen, setNpcDropdownOpen] = useState(false);
    const [npcLocationFilter, setNpcLocationFilter] = useState<string>("");

    // Location story mode
    const [locationStoryMode, setLocationStoryMode] = useState(() => localStorage.getItem("encounters.locationStoryMode") === "true");

    // List filters
    const [showStoryMode, setShowStoryMode] = useState(() => localStorage.getItem("encounters.showStoryMode") === "true");
    const [currentLocationOnly, setCurrentLocationOnly] = useState(() => localStorage.getItem("encounters.currentLocationOnly") === "true");
    const [listLocationFilter, setListLocationFilter] = useState(() => localStorage.getItem("encounters.listLocationFilter") ?? "");

    // Reward form
    const [newRewardType, setNewRewardType] = useState<string>("weapon");
    const [rewardSearch, setRewardSearch] = useState("");
    const [rewardDropdownOpen, setRewardDropdownOpen] = useState(false);
    const [rewardCharFilter, setRewardCharFilter] = useState("");

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
                locationId: campaignInfo.currentLocationId || null,
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

    async function handleMoveEncounter(index: number, direction: "up" | "down") {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= encounters.length) return;
        const newOrder = [...encounters];
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
        setEncounters(newOrder);
        try {
            await APIEncounter.reorder(newOrder.map((e) => e.id));
        } catch {
            console.error("Error reordering encounters");
            await loadEncounters();
        }
    }

    function startEditing(encounter: EncounterResponse) {
        setEditingEncounter(encounter);
        setEditLocationId(encounter.locationId ?? "");
        setEditName(encounter.name ?? "");
        setEditNpcs([...encounter.npcs]);
        setEditRewards([...encounter.rewards]);
        setEditBonusXp(encounter.bonusXp || null);
        setNpcSearch("");
        setNpcDropdownOpen(false);
        setNpcLocationFilter(encounter.locationId ?? "");
    }

    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstEdit = useRef(true);

    const autoSave = useCallback(async (encounterId: number, locationId: string, name: string, npcs: EncounterNpcDto[], rewards: EncounterRewardDto[], bonusXp: number | null) => {
        try {
            setSaving(true);
            await APIEncounter.update(encounterId, {
                locationId: locationId || null,
                name: name || null,
                npcs,
                rewards,
                bonusXp: bonusXp ?? 0,
            });
            await loadEncounters();
        } catch {
            console.error("Error saving encounter");
        } finally {
            setSaving(false);
        }
    }, []);

    useEffect(() => {
        if (!editingEncounter) {
            isFirstEdit.current = true;
            return;
        }
        if (isFirstEdit.current) {
            isFirstEdit.current = false;
            return;
        }
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            autoSave(editingEncounter.id, editLocationId, editName, editNpcs, editRewards, editBonusXp);
        }, 500);
        return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    }, [editLocationId, editName, editNpcs, editRewards, editBonusXp]);

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
            level: 1,
        }]);
        setRewardSearch("");
        setRewardDropdownOpen(false);
    }

    function removeReward(index: number) {
        setEditRewards(editRewards.filter((_, i) => i !== index));
    }

    const filteredNpcs = useMemo(() => {
        let pool = getAllNPCsSorted();
        if (npcLocationFilter) {
            const loc = getAllLocationsSorted().find(l => l.id === npcLocationFilter);
            const ids = new Set(loc?.residentNpcIds ?? []);
            pool = pool.filter(npc => ids.has(npc.id));
        }
        if (!npcSearch.trim()) return pool;
        const search = npcSearch.toLowerCase();
        return pool.filter((npc) => {
            const matchesName = npc.name.toLowerCase().includes(search);
            const cr = formatCR(getNpcCR(npc.id));
            return matchesName || cr.includes(search);
        });
    }, [npcSearch, npcLocationFilter]);

    const filteredRewardItems = useMemo(() => {
        let ids: string[];
        if (newRewardType === "weapon" && rewardCharFilter) {
            const file = WeaponsDataLoader.fileForCharacter(rewardCharFilter);
            let weapons = WeaponsDataLoader.getByFile(file);
            if (rewardCharFilter === "gustave") {
                weapons = weapons.filter(w => !WeaponsDataLoader.VERSO_EXCLUSIVE_WEAPONS.has(w.name));
            }
            ids = weapons.map(w => w.name.toLowerCase());
        } else {
            ids = newRewardType === "weapon" ? getAllWeaponIds() : getAllPictoIds();
        }
        const getName = newRewardType === "weapon" ? getWeaponName : getPictoName;
        const items = ids.map((id) => ({ id, name: getName(id) }));
        const search = rewardSearch.toLowerCase();
        const filtered = search
            ? items.filter((item) => item.name.toLowerCase().includes(search))
            : items;
        return filtered.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }, [newRewardType, rewardSearch, rewardCharFilter]);

    function getRewardDisplayName(reward: EncounterRewardDto): string {
        if (reward.rewardType === "weapon") {
            return getWeaponName(reward.itemId) || reward.itemId;
        }
        return getPictoName(reward.itemId) || reward.itemId;
    }

    // Difficulty totalizer
    const editTotalCR = useMemo(() => calculateEncounterCR(editNpcs), [editNpcs]);

    // Resolve effective location filter: checkbox takes priority over dropdown
    const effectiveLocationFilter = currentLocationOnly
        ? (campaignInfo.currentLocationId ?? "")
        : listLocationFilter;

    // Filtered encounters for list view
    const filteredEncounters = useMemo(() => {
        if (!effectiveLocationFilter) return encounters;
        return encounters.filter(enc => enc.locationId === effectiveLocationFilter);
    }, [encounters, effectiveLocationFilter]);

    // Filtered story encounters
    const filteredStoryEncounters = useMemo(() => {
        if (!showStoryMode) return [];
        let list = StoryEncountersList;
        if (effectiveLocationFilter) {
            list = list.filter(enc => enc.locationId === effectiveLocationFilter);
        }
        return list;
    }, [showStoryMode, effectiveLocationFilter]);

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

                    {/* Name */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text font-semibold">{t("encounters.name")}</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            placeholder={t("encounters.namePlaceholder")}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>

                    {/* Location */}
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text font-semibold">{t("encounters.location")}</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={editLocationId}
                            onChange={(e) => { setEditLocationId(e.target.value); setNpcLocationFilter(e.target.value); }}
                        >
                            <option value="">{t("encounters.noLocation")}</option>
                            {(locationStoryMode ? getMainStoryLocations() : getAllLocationsSorted()).map(loc => (
                                <option key={loc.id} value={loc.id}>{getLocationName(loc.id)}</option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={locationStoryMode}
                                onChange={(e) => { setLocationStoryMode(e.target.checked); localStorage.setItem("encounters.locationStoryMode", String(e.target.checked)); }}
                            />
                            <span className="text-sm">{t("locations.mainStoryOnly")}</span>
                        </label>
                    </div>

                    {/* NPCs Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{t("encounters.npcs")}</h3>
                            {editNpcs.length > 0 && (
                                <span className="badge badge-ghost font-mono">
                                    {t("encounters.challengeRating")} {formatCR(editTotalCR)}
                                </span>
                            )}
                        </div>

                        {editNpcs.length === 0 && (
                            <p className="text-sm opacity-60 mb-2">{t("encounters.noNpcsAdded")}</p>
                        )}

                        <div className="flex flex-col gap-2 mb-3">
                            {editNpcs.map((npcEntry) => {
                                const npc = getNpcById(npcEntry.npcId);
                                const npcCr = getNpcCR(npcEntry.npcId);
                                return (
                                    <div key={npcEntry.npcId} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-base-200 rounded-lg p-2">
                                        <div className="w-10 h-10 rounded-full bg-base-300 shrink-0 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={`/enemies/${npcEntry.npcId}.png`}
                                                alt={npc?.name ?? npcEntry.npcId}
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleNpcImgError(e, npcEntry.npcId)}
                                            />
                                            <FaDragon className="hidden text-base-content opacity-40 text-lg" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 basis-32">
                                            <span className="font-semibold text-sm">{npc?.name ?? npcEntry.npcId}</span>
                                            <span className="text-xs opacity-60">
                                                {t("encounters.challengeRating")} {formatCR(npcCr)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 ml-auto shrink-0">
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
                                            <button
                                                className="btn btn-xs btn-error btn-ghost"
                                                onClick={() => removeNpc(npcEntry.npcId)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* NPC Location Filter + Search */}
                        <select
                            className="select select-bordered select-sm w-full mb-2"
                            value={npcLocationFilter}
                            onChange={(e) => setNpcLocationFilter(e.target.value)}
                        >
                            <option value="">{t("encounters.allLocations")}</option>
                            {getAllLocationsSorted()
                                .filter(loc => loc.residentNpcIds && loc.residentNpcIds.length > 0)
                                .map(loc => (
                                    <option key={loc.id} value={loc.id}>{getLocationName(loc.id)}</option>
                                ))}
                        </select>
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
                                            <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden flex items-center justify-center">
                                                <img
                                                    src={`/enemies/${npc.id}.png`}
                                                    alt={npc.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => handleNpcImgError(e, npc.id)}
                                                />
                                                <FaDragon className="hidden text-base-content opacity-40 text-sm" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-medium truncate">{npc.name}</span>
                                                <span className="text-xs opacity-60">{t("encounters.challengeRating")} {formatCR(getNpcCR(npc.id))}</span>
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
                                        <select
                                            className="select select-bordered select-xs w-14"
                                            value={reward.level || 1}
                                            onChange={(e) => {
                                                setEditRewards(editRewards.map((r, i) => i === idx ? { ...r, level: Number(e.target.value) } : r));
                                            }}
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                        </select>
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
                                    onChange={(e) => { setNewRewardType(e.target.value); setRewardSearch(""); setRewardDropdownOpen(false); setRewardCharFilter(""); }}
                                >
                                    <option value="weapon">{t("rewards.weapon")}</option>
                                    <option value="picto">{t("rewards.picto")}</option>
                                </select>
                            </div>
                            {newRewardType === "weapon" && (
                                <div className="form-control">
                                    <label className="label py-0">
                                        <span className="label-text text-xs">{t("combatAdmin.labels.character")}</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-sm"
                                        value={rewardCharFilter}
                                        onChange={(e) => { setRewardCharFilter(e.target.value); setRewardSearch(""); }}
                                    >
                                        <option value="">{t("common.all")}</option>
                                        {CHARACTERS_LIST.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
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

                    {/* Bonus XP */}
                    <div className="flex flex-col mb-4">
                        <span className="label-text font-semibold mb-1">{t("encounters.bonusXp")}</span>
                        <input
                            type="number"
                            className="input input-bordered input-sm w-24"
                            min={0}
                            placeholder="0"
                            value={editBonusXp ?? ""}
                            onChange={(e) => setEditBonusXp(e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0))}
                        />
                    </div>

                    {saving && (
                        <div className="flex justify-end">
                            <span className="text-sm opacity-60">{t("encounters.saving")}</span>
                        </div>
                    )}
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="card-title flex items-center gap-2">
                            <FaDragon className="opacity-60" />
                            {t("encounters.title")}
                        </h2>
                        {!showStoryMode && (
                            <button
                                className="btn btn-sm btn-primary gap-2"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                <FaPlus />
                                {creating ? t("encounters.creating") : t("encounters.create")}
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-2 mt-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary"
                                    checked={showStoryMode}
                                    onChange={(e) => { setShowStoryMode(e.target.checked); localStorage.setItem("encounters.showStoryMode", String(e.target.checked)); }}
                                />
                                <span className="text-sm">{t("encounters.showStoryMode")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary"
                                    checked={currentLocationOnly}
                                    onChange={(e) => { setCurrentLocationOnly(e.target.checked); localStorage.setItem("encounters.currentLocationOnly", String(e.target.checked)); }}
                                />
                                <span className="text-sm">{t("encounters.currentLocationOnly")}</span>
                            </label>
                        </div>
                        {!currentLocationOnly && (
                            <select
                                className="select select-bordered select-sm w-full"
                                value={listLocationFilter}
                                onChange={(e) => { setListLocationFilter(e.target.value); localStorage.setItem("encounters.listLocationFilter", e.target.value); }}
                            >
                                <option value="">{t("encounters.allLocations")}</option>
                                {getAllLocationsSorted().map(loc => (
                                    <option key={loc.id} value={loc.id}>{getLocationName(loc.id)}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {loading && (
                        <div className="mt-4 text-sm opacity-70">{t("encounters.loading")}</div>
                    )}

                    {/* Story mode encounters */}
                    {!loading && filteredStoryEncounters.length > 0 && (
                        <div className="mt-4 flex flex-col divide-y divide-base-300">
                            {filteredStoryEncounters.map((enc) => {
                                const encCR = calculateEncounterCR(enc.npcs);
                                return (
                                    <div key={enc.id} className="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-200 p-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                            <span className="font-semibold text-sm min-w-0 break-words">
                                                {t(enc.name) || enc.id}
                                                {enc.locationId && (
                                                    <span className="ml-2 text-xs font-normal opacity-60">
                                                        {getLocationName(enc.locationId)}
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5 shrink-0">
                                                {enc.bonusXp > 0 && (
                                                    <span className="badge badge-sm badge-ghost">
                                                        {enc.bonusXp} {t("encounters.bonusXpReward")}
                                                    </span>
                                                )}
                                                {encCR > 0 && (
                                                    <span className="badge badge-sm badge-ghost font-mono">
                                                        {t("encounters.challengeRating")} {formatCR(encCR)}
                                                    </span>
                                                )}
                                                {enc.rewards.map((r, ri) => (
                                                    <span key={ri} className={`badge badge-sm ${r.rewardType === "weapon" ? "badge-warning" : "badge-success"}`}>
                                                        {r.rewardType === "weapon" ? `⚔️ ${getWeaponName(r.itemId)}` : `🎴 ${getPictoName(r.itemId)}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {enc.npcs.map(n => {
                                                const npc = getNpcById(n.npcId);
                                                const name = npc?.name ?? n.npcId;
                                                return (
                                                    <div key={n.npcId} className="flex items-center gap-1.5 bg-base-100 rounded-full px-2 py-0.5 border border-base-300">
                                                        <div className="w-5 h-5 rounded-full bg-base-300 overflow-hidden shrink-0">
                                                            <img
                                                                src={`/enemies/${n.npcId}.png`}
                                                                alt={name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => handleNpcImgError(e, n.npcId)}
                                                            />
                                                        </div>
                                                        <span className="text-xs">{n.quantity > 1 ? `${name} x${n.quantity}` : name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !showStoryMode && filteredEncounters.length === 0 && (
                        <div className="alert alert-info mt-4 text-sm leading-relaxed">
                            {t("encounters.noEncountersFound")}
                        </div>
                    )}

                    {!loading && showStoryMode && filteredStoryEncounters.length === 0 && (
                        <div className="alert alert-info mt-4 text-sm leading-relaxed">
                            {t("encounters.noEncountersFound")}
                        </div>
                    )}

                    {!loading && !showStoryMode && filteredEncounters.length > 0 && (
                        <div className="mt-4 flex flex-col divide-y divide-base-300">
                            {filteredEncounters.map((enc, index) => {
                                const encCR = calculateEncounterCR(enc.npcs);
                                return (
                                    <div key={enc.id} className="flex items-start sm:items-center gap-3 py-3 px-1">
                                        {/* Order controls */}
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                className="btn btn-xs btn-ghost px-1"
                                                onClick={() => handleMoveEncounter(index, "up")}
                                                disabled={index === 0}
                                            >
                                                <FaArrowUp className="text-xs" />
                                            </button>
                                            <span className="text-xs font-mono text-center opacity-50">{index + 1}</span>
                                            <button
                                                className="btn btn-xs btn-ghost px-1"
                                                onClick={() => handleMoveEncounter(index, "down")}
                                                disabled={index === encounters.length - 1}
                                            >
                                                <FaArrowDown className="text-xs" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-semibold text-sm">
                                                {enc.name ? (
                                                    <>
                                                        {enc.name}
                                                        {enc.locationId && (
                                                            <span className="ml-2 text-xs font-normal opacity-60">
                                                                {getLocationName(enc.locationId)}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (enc.locationId ? getLocationName(enc.locationId) : `${t("encounters.title")} #${enc.id}`)}
                                            </span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {enc.rewards.length > 0 ? (
                                                    <span className="badge badge-sm badge-ghost">
                                                        {enc.rewards.length} {enc.rewards.length === 1 ? t("encounters.rewardCountSingular") : t("encounters.rewardCount")}
                                                    </span>
                                                ) : enc.bonusXp > 0 ? (
                                                    <span className="badge badge-sm badge-ghost">
                                                        {enc.bonusXp} {t("encounters.bonusXpReward")}
                                                    </span>
                                                ) : null}
                                                {encCR > 0 && (
                                                    <span className="badge badge-sm badge-ghost font-mono">
                                                        {t("encounters.challengeRating")} {formatCR(encCR)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                {enc.npcs.map(n => {
                                                    const npc = getNpcById(n.npcId);
                                                    const name = npc?.name ?? n.npcId;
                                                    return (
                                                        <div key={n.npcId} className="flex items-center gap-1.5 bg-base-200 rounded-full px-2 py-0.5 border border-base-300">
                                                            <div className="w-5 h-5 rounded-full bg-base-300 overflow-hidden shrink-0">
                                                                <img
                                                                    src={`/enemies/${n.npcId}.png`}
                                                                    alt={name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => handleNpcImgError(e, n.npcId)}
                                                                />
                                                            </div>
                                                            <span className="text-xs">{n.quantity > 1 ? `${name} x${n.quantity}` : name}</span>
                                                        </div>
                                                    );
                                                })}
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
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
