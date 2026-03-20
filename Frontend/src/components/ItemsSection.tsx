import { type MutableRefObject, type RefObject, useMemo, useState } from "react";
import { type PlayerItemResponse } from "../api/ResponseModel";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { APIItem } from "../api/APIItem";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { type DiceBoardRef } from "./DiceBoard";
import { rollWithTimeout } from "../utils/RollUtils";
import { dispatchRoll } from "../utils/rollDispatcher";
import { t } from "../i18n";

const ELIXIR_IDS = new Set(["chroma-elixir", "healing-elixir", "energy-elixir", "revive-elixir"]);

interface ItemsSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onItemUsed?: () => void;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl bg-base-100 border border-base-300 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
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
    diceBoardRef,
    timeoutDiceBoardRef,
    onItemUsed,
}: {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onItemUsed?: () => void;
}) {
    const [usingItem, setUsingItem] = useState<string | null>(null);
    const [editQtyModal, setEditQtyModal] = useState<{ elixirId: string; field: "quantity" | "max"; currentValue: number } | null>(null);
    const [editQtyValue, setEditQtyValue] = useState("");
    const [diceModal, setDiceModal] = useState<{ elixirId: string; label: string } | null>(null);
    const [diceCount, setDiceCount] = useState(1);
    const [diceSize, setDiceSize] = useState(6);

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
                        maxQuantity: newMaxQuantity,
                        lastRecoveryPercent: null,
                        diceCount: null,
                        diceSize: null
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
                        maxQuantity,
                        lastRecoveryPercent: null,
                        diceCount: null,
                        diceSize: null
                    };
                    return { ...prev, items: [...(prev.items ?? []), newItem] };
                });
            }
        } catch (e) {
            console.error("Erro ao atualizar max quantity:", e);
        }
    }

    function openDiceModal(elixirId: string, label: string) {
        const item = player?.items?.find(i => i.itemId === elixirId);
        setDiceCount(item?.diceCount ?? 1);
        setDiceSize(item?.diceSize ?? 6);
        setDiceModal({ elixirId, label });
    }

    async function confirmDiceRoll() {
        if (!diceModal || !player) return;
        const { elixirId, label } = diceModal;
        setDiceModal(null);
        setUsingItem(elixirId);

        try {
            const item = player.items?.find(i => i.itemId === elixirId);
            if (!item) return;

            // Salvar config de dados e decrementar quantidade
            const newQty = Math.max(0, item.quantity - 1);
            await APIItem.updatePlayerItem(item.id, { quantity: newQty, diceCount, diceSize });
            setPlayer(prev => {
                if (!prev) return prev;
                const items = (prev.items ?? []).map(i =>
                    i.id === item.id ? { ...i, quantity: newQty, diceCount, diceSize } : i
                );
                return { ...prev, items };
            });

            // Rolar dados
            const command = `${diceCount}d${diceSize}`;
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, command, (result) => {
                const values: number[] = result?.[0]?.rolls?.map((r: any) => r.value) ?? [];
                const total = values.reduce((a: number, b: number) => a + b, 0);
                dispatchRoll({
                    label,
                    diceRolled: total,
                    modifier: 0,
                    total,
                    diceCommand: command,
                    diceValues: values,
                });
            });
            onItemUsed?.();
        } catch (e) {
            console.error("Erro ao usar item:", e);
            alert(t("items.errorUsing"));
        } finally {
            setUsingItem(null);
        }
    }

    function confirmEditQty() {
        if (!editQtyModal) return;
        let num = Math.max(0, Number(editQtyValue) || 0);
        if (editQtyModal.field === "quantity") {
            const item = player?.items?.find(i => i.itemId === editQtyModal.elixirId);
            const max = item?.maxQuantity ?? 0;
            if (max > 0) num = Math.min(num, max);
            updateElixir(editQtyModal.elixirId, num);
        } else {
            updateElixirMaxQuantity(editQtyModal.elixirId, num);
        }
        setEditQtyModal(null);
    }

    return (
        <>
            <Modal
                open={editQtyModal !== null}
                onClose={() => setEditQtyModal(null)}
                title={editQtyModal?.field === "max" ? t("items.editMaxQuantity") : t("items.editQuantity")}
            >
                <div className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm opacity-80 mb-2">
                            {t("items.newValue")}
                        </label>
                        <input
                            type="number"
                            min={0}
                            className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                            value={editQtyValue}
                            onChange={(e) => setEditQtyValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") confirmEditQty();
                            }}
                        />
                    </div>
                    <button
                        className="w-full px-4 py-2 rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300"
                        onClick={confirmEditQty}
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </Modal>

            <Modal
                open={diceModal !== null}
                onClose={() => setDiceModal(null)}
                title={diceModal?.label ?? ""}
            >
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">{t("items.diceCount")}</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                                value={diceCount}
                                onChange={(e) => setDiceCount(Math.max(1, Number(e.target.value) || 1))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">{t("items.diceSize")}</label>
                            <input
                                type="number"
                                min={2}
                                className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                                value={diceSize}
                                onChange={(e) => setDiceSize(Math.max(2, Number(e.target.value) || 2))}
                            />
                        </div>
                    </div>
                    <div className="text-center text-lg opacity-70">{diceCount}d{diceSize}</div>
                    <button
                        className="w-full px-4 py-2 rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300"
                        onClick={confirmDiceRoll}
                    >
                        {t("common.confirm")}
                    </button>
                </div>
            </Modal>

            <div className="rounded-2xl bg-base-100 border border-base-300 overflow-hidden">
                <div className="px-6 py-3 border-b border-base-300 text-lg tracking-widest text-center opacity-90">
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
                            className="flex flex-col items-center gap-2 rounded-xl bg-base-200 border border-base-300 p-3"
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
                                    className="p-1 rounded bg-base-300 hover:bg-base-300/70"
                                    onClick={() => updateElixir(e.id, Math.max(0, qty - 1))}
                                >
                                    <FaChevronLeft size={14} />
                                </button>
                                <div
                                    className="text-lg font-semibold w-10 text-center cursor-pointer hover:text-blue-400 transition-colors"
                                    onClick={() => { setEditQtyModal({ elixirId: e.id, field: "quantity", currentValue: qty }); setEditQtyValue(String(qty)); }}
                                >{qty}</div>
                                <button
                                    className="p-1 rounded bg-base-300 hover:bg-base-300/70"
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
                                <span>{t("common.max")}:</span>
                                <button
                                    className="p-1 rounded bg-base-300 hover:bg-base-300/70"
                                    onClick={() => updateElixirMaxQuantity(e.id, Math.max(0, max - 1))}
                                >
                                    <FaChevronLeft size={12} />
                                </button>
                                <div
                                    className="w-8 text-center cursor-pointer hover:text-blue-400 transition-colors"
                                    onClick={() => { setEditQtyModal({ elixirId: e.id, field: "max", currentValue: max }); setEditQtyValue(String(max)); }}
                                >{max}</div>
                                <button
                                    className="p-1 rounded bg-base-300 hover:bg-base-300/70"
                                    onClick={() => updateElixirMaxQuantity(e.id, max + 1)}
                                >
                                    <FaChevronRight size={12} />
                                </button>
                            </div>

                            <button
                                className="px-3 py-1 text-sm rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                disabled={usingItem === e.id || qty === 0}
                                onClick={() => openDiceModal(e.id, e.label)}
                            >
                                {usingItem === e.id ? t("common.using") : t("common.use")}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
        </>
    );
}


export default function ItemsSection({ player, setPlayer, diceBoardRef, timeoutDiceBoardRef, onItemUsed }: ItemsSectionProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<PlayerItemResponse | null>(null);

    const [itemId, setItemId] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [maxQuantity, setMaxQuantity] = useState<number>(99);

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
            alert(t("items.itemExists"));
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
                maxQuantity,
                lastRecoveryPercent: null
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
            alert(t("items.itemExists"));
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
        <div className="text-base-content">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">{t("items.title").toUpperCase()}</div>

            <div className="mb-4">
                <ElixirsCard player={player} setPlayer={setPlayer} diceBoardRef={diceBoardRef} timeoutDiceBoardRef={timeoutDiceBoardRef} onItemUsed={onItemUsed} />
            </div>

            <div className="flex flex-col gap-4">
                {slots.map((selected, idx) => {
                    const isAddSlot = selected === null;

                    return (
                        <div
                            key={selected ? `${selected.itemId}-${idx}` : `empty-${idx}`}
                            className="relative rounded-2xl bg-base-100 border border-base-300 overflow-hidden"
                        >
                            <div
                                role="button"
                                onClick={() => !selected && setOpenSlot(idx)}
                                className={`w-full text-left py-4 px-6 rounded-2xl transition-colors ${
                                    isAddSlot
                                        ? "h-28 grid place-items-center hover:bg-base-300/30 cursor-pointer"
                                        : "hover:bg-base-300/30"
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
                                                    className="px-3 py-1 text-sm rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(selected);
                                                    }}
                                                    aria-label={`${t("common.edit")} ${selected.itemId}`}
                                                >
                                                    {t("common.edit")}
                                                </button>
                                                <button
                                                    className="px-3 py-1 text-sm rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300"
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
                                        {t("items.addItem")}
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
                        className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
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
                                className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">{t("common.maxQuantity")}</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                                value={maxQuantity}
                                onChange={(e) => setMaxQuantity(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <button
                        className="w-full px-4 py-2 rounded-md bg-base-300 hover:bg-base-300/70 border border-base-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
