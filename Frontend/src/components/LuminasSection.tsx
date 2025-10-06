import { useMemo, useState } from "react";
import { type PictoResponse, type PictoColor } from "../api/ResponseModel";
import { type PlayerResponse } from "../api/APIPlayer";

interface LuminasTabProps {
  luminas: PictoResponse[] | null;
  player: PlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

const colorToHex: Record<PictoColor, string> = {
  green: "rgb(26, 230, 103)",
  red: "rgb(227, 30, 25)",
  blue: "rgb(140, 255, 255)",
};

function PlusDiamond({
  icon = "+",
  picto,
  isBig = false,
}: {
  icon?: string;
  picto?: PictoResponse | null;
  isBig?: boolean;
}) {
  const maskBase = picto?.name ? encodeURI(`/pictos/${picto.name}.webp`) : null;

  const wrapperSize = isBig ? "w-14 h-14" : "w-9 h-9";
  const innerSize = isBig ? "w-11 h-11" : "w-7 h-7";
  const iconSize = isBig ? "text-2xl" : "text-lg";

  return (
    <div
      className={`relative ${wrapperSize} rotate-45 border border-white/20 rounded-sm grid place-items-center bg-black/30 ml-2`}
      aria-label={picto?.name ?? "Adicionar picto"}
    >
      {maskBase ? (
        <div
          className={`rotate-[-45deg] ${innerSize}`}
          style={{
            backgroundColor: picto ? colorToHex[picto.color] : "transparent",
            WebkitMaskImage: `url("${maskBase}?scope=mask")`,
            maskImage: `url("${maskBase}?scope=mask")`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      ) : (
        <span className={`rotate-[-45deg] leading-none ${iconSize}`}>{icon}</span>
      )}
    </div>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#121212] border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-lg tracking-wide">Selecione um Picto</div>
            <button onClick={onClose} className="text-2xl leading-none px-2">×</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="p-4">
      <input
        className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
        placeholder="Buscar..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PictoCard({ picto, onPick }: { picto: PictoResponse; onPick?: (p: PictoResponse) => void }) {
  return (
    <button
      onClick={() => onPick && onPick(picto)}
      className="w-full text-left grid grid-cols-[80px_1fr] items-center gap-4 p-4 bg-black/25 hover:bg-white/5 transition-colors border border-white/10 rounded-xl"
    >
      <PlusDiamond icon="" picto={picto} isBig={true} />
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold leading-tight">{picto.name}</div>
        </div>
        <div className="opacity-80">{picto.description}</div>
      </div>
    </button>
  );
}

export default function LuminasSection({ luminas, player, setPlayer }: LuminasTabProps) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  // Slots infinitos: todos os escolhidos + 1 slot vazio para adicionar
  const slots: (PictoResponse | null)[] = useMemo(() => {
    const chosen = (player?.luminas ?? []);
    return [...chosen, null];
  }, [player?.luminas]);

  // Filtra por busca e remove já selecionados (não pode repetir)
  const filtered = useMemo(() => {
    const list = luminas ?? [];
    const selectedNames = new Set(
      (player?.luminas ?? []).map(p => p.name.toLowerCase())
    );
    const withoutSelected = list.filter(
      p => !selectedNames.has(p.name.toLowerCase()) && (p.battleCount ?? 0) >= 4
    );

    const q = query.trim().toLowerCase();
    if (!q) return withoutSelected;

    return withoutSelected.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [luminas, query, player?.luminas]);

  function upsertPictoAt(slotIndex: number, picto: PictoResponse) {
    setPlayer(prev => {
      if (!prev) return prev;
      const current = [...(prev.luminas ?? [])];

      // Remover duplicata pelo name (case-insensitive)
      const nameLc = picto.name.toLowerCase();
      const existingIdx = current.findIndex(p => p.name.toLowerCase() === nameLc);
      let targetIndex = slotIndex;

      if (existingIdx !== -1 && existingIdx !== targetIndex) {
        current.splice(existingIdx, 1);
        // Se removemos um antes do alvo, o índice alvo diminui 1
        if (existingIdx < targetIndex) targetIndex -= 1;
      }

      const chosen: PictoResponse = { ...picto, level: picto.level ?? 1 };

      if (targetIndex >= current.length) {
        current.push(chosen); // adicionando no slot vazio (final)
      } else {
        current[targetIndex] = chosen; // substituindo um existente (se algum dia permitir editar)
      }
      return { ...prev, luminas: current };
    });
    setOpenSlot(null);
  }

  function clearSlot(slotIndex: number) {
    setPlayer(prev => {
      if (!prev) return prev;
      const next = [...(prev.luminas ?? [])];
      if (slotIndex >= 0 && slotIndex < next.length) {
        next.splice(slotIndex, 1); // remove e “fecha” o array
      }
      return { ...prev, luminas: next };
    });
  }

  function handleSlotActivate(idx: number) {
    // Abre o modal apenas no slot vazio (o último, que é null)
    if (!slots[idx]) setOpenSlot(idx);
  }

  function onKeyActivate(e: React.KeyboardEvent<HTMLDivElement>, idx: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSlotActivate(idx);
    }
  }

  return (
    <div className="text-white">
      <div className="text-center text-lg tracking-widest pb-3 opacity-90">LUMINAS</div>

      <div className="flex flex-col gap-4">
        {slots.map((selected, idx) => {
          const accent = selected ? colorToHex[selected.color] : "rgba(255,255,255,0.15)";
          const isAddSlot = selected === null; // último slot

          return (
            <div key={selected ? `${selected.name}-${idx}` : `empty-${idx}`} className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
              {/* Borda chanfrada */}
              <div
                className="pointer-events-none absolute inset-x-3 top-2 bottom-1 rounded-xl"
                style={{
                  border: `1px solid ${selected ? accent : "transparent"}`,
                  clipPath:
                    "polygon(0% 10%, 6% 10%, 7.5% 5%, 100% 5%, 100% 95%, 7.5% 95%, 6% 90%, 0% 90%)",
                }}
              />

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => onKeyActivate(e, idx)}
                onClick={() => handleSlotActivate(idx)}
                className={`w-full text-left py-4 px-6 pl-28 rounded-2xl transition-colors ${isAddSlot ? "h-32 grid place-items-center hover:bg-white/5" : "hover:bg-white/5"
                  }`}
              >
                {/* Trilho/diamante lateral */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <PlusDiamond icon={selected ? "" : "+"} picto={selected ?? undefined} isBig={true} />
                </div>

                {selected ? (
                  <div className="flex flex-col gap-1">
                    {/* Header: título + Clear */}
                    <div className="flex items-start justify-between">
                      <div className="text-2xl font-semibold leading-tight mr-2">
                        {selected.name} <span className="opacity-70">({selected.luminaCost})</span>
                      </div>
                      <button
                        className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(idx);
                        }}
                        aria-label={`Remover ${selected.name}`}
                      >
                        ×
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-white/10 my-1" />

                    {/* Descrição */}
                    <div className="opacity-85">{selected.description}</div>
                  </div>
                ) : (
                  <div className="text-center w-full opacity-60 tracking-wide text-lg">
                    Adicionar Lumina
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de seleção */}
      <Modal open={openSlot !== null} onClose={() => setOpenSlot(null)}>
        <SearchBox value={query} onChange={setQuery} />
        <div className="px-4 pb-4 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <PictoCard key={`${p.name}-${p.color}`} picto={p} onPick={(pp) => upsertPictoAt(openSlot ?? (player?.luminas?.length ?? 0), pp)} />
          ))}
          {filtered.length === 0 && <div className="opacity-70 p-8 text-center">Nenhuma Lumina encontrada.</div>}
        </div>
      </Modal>
    </div>
  );
}
