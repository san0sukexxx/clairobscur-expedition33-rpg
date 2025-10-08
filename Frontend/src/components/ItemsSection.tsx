import { useMemo, useState } from "react";
import { type PlayerResponse, type ItemResponse } from "../api/APIPlayer";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ELIXIR_IDS = new Set(["chroma-elixir", "healing-elixir", "energy-elixir", "revive-elixir"]);

interface ItemsSectionProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl bg-[#121212] border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="text-lg tracking-wide">Novo Item</div>
                        <button onClick={onClose} className="text-2xl leading-none px-2">×</button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

function buildVisible(items?: ItemResponse[]) {
    const result: ItemResponse[] = [];
    const map: number[] = [];
    (items ?? []).forEach((it, idx) => {
        if (!it.id || !ELIXIR_IDS.has(it.id)) {
            result.push(it);
            map.push(idx);
        }
    });
    return { result, map };
}

function ElixirsCard({ player, setPlayer }: { player: PlayerResponse | null, setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>> }) {
    const ELIXIRS = [
        { id: "chroma-elixir", label: "Chroma", src: "/items/Chroma Elixir.png" },
        { id: "healing-elixir", label: "Healing", src: "/items/Healing Tints.png" },
        { id: "energy-elixir", label: "Energy", src: "/items/Energy Tint.png" },
        { id: "revive-elixir", label: "Revive", src: "/items/Revive Tints.png" },
    ] as const;

    function updateItem(id: string, changes: Partial<ItemResponse>) {
        setPlayer(prev => {
            if (!prev) return prev;
            const items = [...(prev.items ?? [])];
            const idx = items.findIndex(i => i.id === id);

            if (idx !== -1) {
                // Já existe → atualiza normalmente
                items[idx] = { ...items[idx], ...changes };
            } else {
                // Ainda não existe → cria com defaults
                const newItem: ItemResponse = {
                    id,
                    description: id, // você pode trocar para um label mais bonito se quiser
                    quantity: changes.quantity ?? 0,
                    maxQuantity: changes.maxQuantity ?? 0,
                };
                items.push(newItem);
            }

            return { ...prev, items };
        });
    }

    return (
        <div className="rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
            <div className="px-6 py-3 border-b border-white/10 text-lg tracking-widest text-center opacity-90">
                ELIXIRES
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
                {ELIXIRS.map((e) => {
                    const item = player?.items?.find(i => i.id === e.id);
                    const qty = item?.quantity ?? 0;
                    const max = item?.maxQuantity ?? 0;

                    return (
                        <div
                            key={e.id}
                            className="flex flex-col items-center gap-2 rounded-xl bg-black/20 border border-white/10 p-3"
                        >
                            {/* imagem circular */}
                            <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={encodeURI(e.src)}
                                    alt={`${e.label} Elixir`}
                                    className="w-16 h-16 object-contain pointer-events-none select-none"
                                    draggable={false}
                                />
                            </div>

                            <div className="text-sm opacity-80">{e.label}</div>

                            {/* Quantidade atual */}
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateItem(e.id, { quantity: Math.max(0, qty - 1) })}
                                >
                                    <FaChevronLeft size={14} />
                                </button>
                                <div className="text-lg font-semibold w-10 text-center">{qty}</div>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateItem(e.id, { quantity: qty + 1 })}
                                >
                                    <FaChevronRight size={14} />
                                </button>
                            </div>

                            {/* Quantidade máxima */}
                            <div className="flex items-center gap-2 text-sm opacity-80">
                                <span>Max:</span>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateItem(e.id, { maxQuantity: Math.max(0, max - 1) })}
                                >
                                    <FaChevronLeft size={12} />
                                </button>
                                <div className="w-8 text-center">{max}</div>
                                <button
                                    className="p-1 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => updateItem(e.id, { maxQuantity: max + 1 })}
                                >
                                    <FaChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export default function ItemsSection({ player, setPlayer }: ItemsSectionProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);

    // campos do formulário
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [maxQuantity, setMaxQuantity] = useState<number>(99);

    const { result: visibleItems, map: visibleToGlobal } = useMemo(
        () => buildVisible(player?.items),
        [player?.items]
    );

    // Slots infinitos: todos os escolhidos + 1 slot vazio
    const slots: (ItemResponse | null)[] = useMemo(
        () => [...visibleItems, null],
        [visibleItems]
    );

    function upsertItemAt(slotIndex: number, item: ItemResponse) {
        setPlayer((prev) => {
            if (!prev) return prev;
            const items = [...(prev.items ?? [])];
            const { result: vItems, map: v2g } = buildVisible(items);

            // calcula índice global alvo
            const isAddSlot = slotIndex >= vItems.length;
            let targetGlobal = isAddSlot ? items.length : v2g[slotIndex];

            // evitar duplicado por descrição
            const descLc = item.description.toLowerCase();
            const existingIdx = items.findIndex(
                (p) => (p.description ?? "").toLowerCase() === descLc
            );
            if (existingIdx !== -1 && existingIdx !== targetGlobal) {
                items.splice(existingIdx, 1);
                if (existingIdx < targetGlobal) targetGlobal -= 1; // ajusta deslocamento
            }

            const chosen: ItemResponse = {
                ...item,
                quantity: item.quantity ?? 1,
                maxQuantity: item.maxQuantity ?? 99,
            };

            if (targetGlobal >= items.length) items.push(chosen);
            else items[targetGlobal] = chosen;

            return { ...prev, items };
        });
        setOpenSlot(null);
        setDescription("");
        setQuantity(1);
        setMaxQuantity(99);
    }

    function clearSlot(slotIndex: number) {
        setPlayer((prev) => {
            if (!prev) return prev;
            const items = [...(prev.items ?? [])];
            const { map: v2g } = buildVisible(items);
            if (slotIndex < 0 || slotIndex >= v2g.length) return prev;
            items.splice(v2g[slotIndex], 1);
            return { ...prev, items };
        });
    }

    return (
        <div className="text-white">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">ITENS</div>

            {/* NOVO: Card fixo de Elixires */}
            <div className="mb-4">
                <ElixirsCard player={player} setPlayer={setPlayer} />
            </div>

            {/* --- sua lista infinita de itens permanece igual --- */}
            <div className="flex flex-col gap-4">
                {slots.map((selected, idx) => {
                    const isAddSlot = selected === null;

                    return (
                        <div key={selected ? `${selected.description}-${idx}` : `empty-${idx}`} className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
                            <div
                                role="button"
                                onClick={() => !selected && setOpenSlot(idx)}
                                className={`w-full text-left py-4 px-6 rounded-2xl transition-colors ${isAddSlot ? "h-28 grid place-items-center hover:bg-white/5" : "hover:bg-white/5"
                                    }`}
                            >
                                {selected ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-start justify-between">
                                            <div className="text-lg font-semibold leading-tight mr-2">
                                                {selected.description}
                                            </div>
                                            <button
                                                className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearSlot(idx);
                                                }}
                                                aria-label={`Remover ${selected.description}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <div className="opacity-80 text-sm">
                                            {selected.quantity ?? 0}/{selected.maxQuantity ?? "?"}
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

            {/* Modal de criação de item */}
            <Modal open={openSlot !== null} onClose={() => setOpenSlot(null)}>
                <div className="p-4 flex flex-col gap-4">
                    <input
                        className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                        placeholder="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">Quantidade</label>
                            <input
                                type="number"
                                min={0}
                                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm opacity-80 mb-1">Quantidade Máxima</label>
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
                        className="w-full px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                        disabled={!description.trim()}
                        onClick={() =>
                            upsertItemAt(openSlot ?? (player?.items?.length ?? 0), {
                                description: description.trim(),
                                quantity,
                                maxQuantity,
                            })
                        }
                    >
                        Adicionar
                    </button>
                </div>
            </Modal>
        </div>
    );
}
