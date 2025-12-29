import { useMemo, useState } from "react";
import { type PlayerItemResponse } from "../api/ResponseModel";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { APIItem } from "../api/APIItem";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { type WeaponInfo } from "../api/ResponseModel";
import { calculateMaxHP, calculateMaxMP } from "../utils/PlayerCalculator";
import { t } from "../i18n";

const ELIXIR_IDS = new Set(["chroma-elixir", "healing-elixir", "energy-elixir", "revive-elixir"]);

interface ItemsSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    isInventoryActiveInCombat?: boolean;
    weaponInfo: WeaponInfo;
    onReviveRequested?: (percent: number) => void;
    onPotionUsed?: () => void;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl bg-[#121212] border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="text-lg tracking-wide">{title}</div>
                        <button onClick={onClose} className="text-2xl leading-none px-2">×</button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

function buildVisible(items?: PlayerItemResponse[]) {
    const result: PlayerItemResponse[] = [];
    const map: number[] = [];
    (items ?? []).forEach((it, idx) => {
        if (!ELIXIR_IDS.has(it.itemId)) {
            result.push(it);
            map.push(idx);
        }
    });
    return { result, map };
}

function ElixirsCard({
    player,
    setPlayer,
    inCombat = false,
    canUsePotion = false,
    weaponInfo,
    onReviveRequested,
    onPotionUsed
}: {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    inCombat?: boolean;
    canUsePotion?: boolean;
    weaponInfo: WeaponInfo;
    onReviveRequested?: (percent: number) => void;
    onPotionUsed?: () => void;
}) {
    const [usingItem, setUsingItem] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [recoveryPercent, setRecoveryPercent] = useState(30);

    const hasDeadTeammate = useMemo(() => {
        if (!player?.fightInfo?.characters) return false;
        return player.fightInfo.characters.some(char =>
            !char.isEnemy && char.healthPoints === 0
        );
    }, [player?.fightInfo?.characters]);

    const isHpFull = useMemo(() => {
        if (inCombat && player?.fightInfo) {
            const currentChar = player.fightInfo.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
            );
            if (currentChar) {
                return currentChar.healthPoints >= currentChar.maxHealthPoints;
            }
        }
        if (!player?.playerSheet) return true;
        const currentHp = player.playerSheet.hpCurrent ?? 0;
        const maxHp = calculateMaxHP(player, weaponInfo);
        return currentHp >= maxHp;
    }, [player, weaponInfo, inCombat]);

    const isMpFull = useMemo(() => {
        if (inCombat && player?.fightInfo) {
            const currentChar = player.fightInfo.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
            );
            if (currentChar && currentChar.magicPoints !== undefined && currentChar.maxMagicPoints !== undefined) {
                return currentChar.magicPoints >= currentChar.maxMagicPoints;
            }
        }
        if (!player?.playerSheet) return true;
        const currentMp = player.playerSheet.mpCurrent ?? 0;
        const maxMp = calculateMaxMP(player);
        return currentMp >= maxMp;
    }, [player, inCombat]);

    const ELIXIRS = [
        { id: "chroma-elixir", label: t("items.chroma"), src: "/items/Chroma Elixir.png" },
        { id: "healing-elixir", label: t("items.healing"), src: "/items/Healing Tints.png" },
        { id: "energy-elixir", label: t("items.energy"), src: "/items/Energy Tint.png" },
        { id: "revive-elixir", label: t("items.revive"), src: "/items/Revive Tints.png" },
    ] as const;

    async function updateElixir(itemId: string, quantity: number, maxQuantity?: number) {
        if (!player) return;

        try {
            const existing = player.items?.find(i => i.itemId === itemId);

            if (existing) {
                // Atualizar quantidade
                await APIItem.updatePlayerItem(existing.id, { quantity });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const items = (prev.items ?? []).map(item =>
                        item.id === existing.id ? { ...item, quantity } : item
                    );
                    return { ...prev, items };
                });
            } else {
                // Criar novo - primeira vez sempre com max=1
                const newMaxQuantity = maxQuantity ?? 1;
                const newId = await APIItem.createPlayerItem({
                    playerId: player.id,
                    itemId,
                    quantity,
                    maxQuantity: newMaxQuantity
                });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const newItem: PlayerItemResponse = {
                        id: newId,
                        playerId: player.id,
                        itemId,
                        quantity,
                        maxQuantity: newMaxQuantity
                    };
                    return { ...prev, items: [...(prev.items ?? []), newItem] };
                });
            }
        } catch (e) {
            console.error("Erro ao atualizar elixir:", e);
        }
    }

    async function updateElixirMaxQuantity(itemId: string, maxQuantity: number) {
        if (!player) return;

        try {
            const existing = player.items?.find(i => i.itemId === itemId);

            if (existing) {
                // Atualizar maxQuantity usando PUT
                await APIItem.updatePlayerItem(existing.id, { maxQuantity });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const items = (prev.items ?? []).map(item =>
                        item.id === existing.id ? { ...item, maxQuantity } : item
                    );
                    return { ...prev, items };
                });
            } else {
                const newId = await APIItem.createPlayerItem({
                    playerId: player.id,
                    itemId,
                    quantity: 0,
                    maxQuantity
                });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const newItem: PlayerItemResponse = {
                        id: newId,
                        playerId: player.id,
                        itemId,
                        quantity: 0,
                        maxQuantity
                    };
                    return { ...prev, items: [...(prev.items ?? []), newItem] };
                });
            }
        } catch (e) {
            console.error("Erro ao atualizar max quantity:", e);
        }
    }

    function openRecoveryModal(itemId: string) {
        setSelectedItemId(itemId);
        setRecoveryPercent(30);
        setModalOpen(true);
    }

    function closeRecoveryModal() {
        setModalOpen(false);
        setSelectedItemId(null);
        setRecoveryPercent(30);
    }

    async function useItem(itemId: string, percent?: number) {
        if (!player || !player.playerSheet) return;

        setUsingItem(itemId);

        try {
            const maxHp = calculateMaxHP(player, weaponInfo);
            const maxMp = calculateMaxMP(player);

            await APIItem.useItem({
                playerId: player.id,
                itemId,
                maxHp,
                maxMp,
                recoveryPercent: percent
            });

            const item = player.items?.find(i => i.itemId === itemId);
            if (item) {
                setPlayer(prev => {
                    if (!prev || !prev.playerSheet) return prev;
                    const items = (prev.items ?? []).map(i =>
                        i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
                    );

                    let updatedSheet = { ...prev.playerSheet };

                    if (itemId === "chroma-elixir") {
                        updatedSheet.hpCurrent = maxHp;
                    } else if (itemId === "healing-elixir") {
                        const recoveryAmount = Math.floor((maxHp * (percent ?? 30)) / 100);
                        updatedSheet.hpCurrent = Math.min((prev.playerSheet?.hpCurrent ?? 0) + recoveryAmount, maxHp);
                    } else if (itemId === "energy-elixir") {
                        const recoveryAmount = Math.floor((maxMp * (percent ?? 30)) / 100);
                        updatedSheet.mpCurrent = Math.min((prev.playerSheet?.mpCurrent ?? 0) + recoveryAmount, maxMp);
                    }

                    return {
                        ...prev,
                        items,
                        playerSheet: updatedSheet
                    };
                });
            }

            if (itemId === "healing-elixir" || itemId === "energy-elixir") {
                onPotionUsed?.();
            }
        } catch (e) {
            console.error("Erro ao usar item:", e);
            alert("Erro ao usar o item");
        } finally {
            setUsingItem(null);
        }
    }

    async function confirmUseItem() {
        if (!selectedItemId) return;
        closeRecoveryModal();

        if (selectedItemId === "revive-elixir") {
            if (onReviveRequested) {
                onReviveRequested(recoveryPercent);
            }
        } else {
            await useItem(selectedItemId, recoveryPercent);
        }
    }

    return (
        <>
            <Modal open={modalOpen} onClose={closeRecoveryModal} title={t("items.recovery")}>
                <div className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm opacity-80 mb-2">
                            {t("items.recoveryPercent")}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                            value={recoveryPercent}
                            onChange={(e) => setRecoveryPercent(Number(e.target.value))}
                        />
                    </div>
                    <button
                        className="w-full px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                        onClick={confirmUseItem}
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </Modal>

            <div className="rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
                <div className="px-6 py-3 border-b border-white/10 text-lg tracking-widest text-center opacity-90">
                    {t("items.elixirs").toUpperCase()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
                {ELIXIRS.map((e) => {
                    const item = player?.items?.find(i => i.itemId === e.id);
                    const qty = item?.quantity ?? 0;
                    const max = item?.maxQuantity ?? 0;

                    return (
                        <div
                            key={e.id}
                            className="flex flex-col items-center gap-2 rounded-xl bg-black/20 border border-white/10 p-3"
                        >
                            <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={encodeURI(e.src)}
                                    alt={`${e.label} Elixir`}
                                    className="w-16 h-16 object-contain pointer-events-none select-none"
                                    draggable={false}
                                />
                            </div>

                            <div className="text-sm opacity-80">{e.label}</div>

                            <div className="flex items-center gap-2">
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateElixir(e.id, Math.max(0, qty - 1))}
                                >
                                    <FaChevronLeft size={14} />
                                </button>
                                <div className="text-lg font-semibold w-10 text-center">{qty}</div>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => {
                                        // Se item não existe (max=0), criar com qty=1
                                        const newQty = max === 0 ? 1 : Math.min(max, qty + 1);
                                        updateElixir(e.id, newQty);
                                    }}
                                >
                                    <FaChevronRight size={14} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm opacity-80">
                                <span>Max:</span>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateElixirMaxQuantity(e.id, Math.max(0, max - 1))}
                                >
                                    <FaChevronLeft size={12} />
                                </button>
                                <div className="w-8 text-center">{max}</div>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateElixirMaxQuantity(e.id, max + 1)}
                                >
                                    <FaChevronRight size={12} />
                                </button>
                            </div>

                            {(e.id === "chroma-elixir" || inCombat) && (
                                <button
                                    className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                    disabled={
                                        usingItem === e.id ||
                                        (e.id === "chroma-elixir"
                                            ? (inCombat || qty === 0 || (player?.playerSheet?.hpCurrent ?? 0) <= 0)
                                            : e.id === "revive-elixir"
                                            ? (!canUsePotion || qty === 0 || !hasDeadTeammate)
                                            : e.id === "healing-elixir"
                                            ? (!canUsePotion || qty === 0 || isHpFull)
                                            : e.id === "energy-elixir"
                                            ? (!canUsePotion || qty === 0 || isMpFull)
                                            : (!canUsePotion || qty === 0))
                                    }
                                    onClick={() => {
                                        if (e.id === "healing-elixir" || e.id === "energy-elixir" || e.id === "revive-elixir") {
                                            openRecoveryModal(e.id);
                                        } else {
                                            useItem(e.id);
                                        }
                                    }}
                                >
                                    {usingItem === e.id ? "Usando..." : "Usar"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        </>
    );
}


export default function ItemsSection({ player, setPlayer, isInventoryActiveInCombat = false, weaponInfo, onReviveRequested, onPotionUsed }: ItemsSectionProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<PlayerItemResponse | null>(null);

    const [itemId, setItemId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [maxQuantity, setMaxQuantity] = useState<number>(99);

    const inCombat = player?.fightInfo != null;

    const isYourTurn = useMemo(() => {
        const firstTurn = player?.fightInfo?.turns?.[0];
        if (!firstTurn) return false;
        return firstTurn.battleCharacterId === player?.fightInfo?.playerBattleID;
    }, [player?.fightInfo]);

    const canUsePotion = isYourTurn && isInventoryActiveInCombat;

    const { result: visibleItems } = useMemo(
        () => buildVisible(player?.items),
        [player?.items]
    );

    const slots: (PlayerItemResponse | null)[] = useMemo(
        () => [...visibleItems, null],
        [visibleItems]
    );

    function openEditModal(item: PlayerItemResponse) {
        setEditingItem(item);
        setItemId(item.itemId);
        setQuantity(item.quantity);
        setMaxQuantity(item.maxQuantity);
    }

    function closeModal() {
        setOpenSlot(null);
        setEditingItem(null);
        setItemId("");
        setQuantity(1);
        setMaxQuantity(99);
    }

    async function createItem() {
        if (!player || !itemId.trim()) return;

        const itemExists = player.items?.some(item => item.itemId === itemId.trim());
        if (itemExists) {
            alert("Já existe um item com este nome.");
            return;
        }

        try {
            const newId = await APIItem.createPlayerItem({
                playerId: player.id,
                itemId: itemId.trim(),
                quantity,
                maxQuantity
            });

            const newItem: PlayerItemResponse = {
                id: newId,
                playerId: player.id,
                itemId: itemId.trim(),
                quantity,
                maxQuantity
            };

            setPlayer(prev => {
                if (!prev) return prev;
                return { ...prev, items: [...(prev.items ?? []), newItem] };
            });

            closeModal();
        } catch (e) {
            console.error("Erro ao criar item:", e);
        }
    }

    async function updateItem() {
        if (!player || !editingItem || !itemId.trim()) return;

        const itemExists = player.items?.some(
            item => item.itemId === itemId.trim() && item.id !== editingItem.id
        );
        if (itemExists) {
            alert("Já existe um item com este nome.");
            return;
        }

        try {
            const itemIdChanged = itemId.trim() !== editingItem.itemId;

            if (itemIdChanged) {
                await APIItem.deletePlayerItem(editingItem.id);

                const newId = await APIItem.createPlayerItem({
                    playerId: player.id,
                    itemId: itemId.trim(),
                    quantity,
                    maxQuantity
                });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const items = (prev.items ?? []).map(item =>
                        item.id === editingItem.id
                            ? { ...item, id: newId, itemId: itemId.trim(), quantity, maxQuantity }
                            : item
                    );
                    return { ...prev, items };
                });
            } else {
                await APIItem.updatePlayerItem(editingItem.id, {
                    quantity,
                    maxQuantity
                });

                setPlayer(prev => {
                    if (!prev) return prev;
                    const items = (prev.items ?? []).map(item =>
                        item.id === editingItem.id
                            ? { ...item, quantity, maxQuantity }
                            : item
                    );
                    return { ...prev, items };
                });
            }

            closeModal();
        } catch (e) {
            console.error("Erro ao atualizar item:", e);
        }
    }

    async function deleteItem(item: PlayerItemResponse) {
        try {
            await APIItem.deletePlayerItem(item.id);

            setPlayer(prev => {
                if (!prev) return prev;
                const items = (prev.items ?? []).filter(i => i.id !== item.id);
                return { ...prev, items };
            });
        } catch (e) {
            console.error("Erro ao deletar item:", e);
        }
    }

    return (
        <div className="text-white">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">ITENS</div>

            <div className="mb-4">
                <ElixirsCard player={player} setPlayer={setPlayer} inCombat={inCombat} canUsePotion={canUsePotion} weaponInfo={weaponInfo} onReviveRequested={onReviveRequested} onPotionUsed={onPotionUsed} />
            </div>

            <div className="flex flex-col gap-4">
                {slots.map((selected, idx) => {
                    const isAddSlot = selected === null;

                    return (
                        <div
                            key={selected ? `${selected.itemId}-${idx}` : `empty-${idx}`}
                            className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden"
                        >
                            <div
                                role="button"
                                onClick={() => !selected && setOpenSlot(idx)}
                                className={`w-full text-left py-4 px-6 rounded-2xl transition-colors ${
                                    isAddSlot
                                        ? "h-28 grid place-items-center hover:bg-white/5 cursor-pointer"
                                        : "hover:bg-white/5"
                                }`}
                            >
                                {selected ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-start justify-between">
                                            <div className="text-lg font-semibold leading-tight mr-2">
                                                {selected.itemId}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(selected);
                                                    }}
                                                    aria-label={`Editar ${selected.itemId}`}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteItem(selected);
                                                    }}
                                                    aria-label={`Remover ${selected.itemId}`}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                        <div className="opacity-80 text-sm">
                                            {selected.quantity}/{selected.maxQuantity}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center w-full opacity-60 tracking-wide text-lg">
                                        Adicionar Item
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                open={openSlot !== null || editingItem !== null}
                onClose={closeModal}
                title={editingItem ? t("items.editItem") : t("items.newItem")}
            >
                <div className="p-4 flex flex-col gap-4">
                    <input
                        className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                        placeholder={t("items.itemId")}
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">{t("common.quantity")}</label>
                            <input
                                type="number"
                                min={0}
                                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">{t("common.maxQuantity")}</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                                value={maxQuantity}
                                onChange={(e) => setMaxQuantity(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <button
                        className="w-full px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!itemId.trim()}
                        onClick={editingItem ? updateItem : createItem}
                    >
                        {editingItem ? t("common.save") : t("common.add")}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
