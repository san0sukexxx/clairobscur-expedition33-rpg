import { useMemo, useState } from "react";
import { type PictoResponse, type PictoColor } from "../api/ResponseModel";
import { displayPictoAttributeCritical, displayPictoAttributeDefense, displayPictoAttributeHealth, displayPictoAttributeSpeed, displayPictoCritical, displayPictoDefense, displayPictoHealth, displayPictoSpeed, getPictoByName } from "../utils/PictoUtils";
import { PictosList } from "../data/PictosList";
import type { GetPlayerResponse } from "../api/APIPlayer";

interface PictosTabProps {
  player: GetPlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
}

const colorToHex: Record<PictoColor, string> = {
  green: "rgb(26, 230, 103)",
  red: "rgb(227, 30, 25)",
  blue: "rgb(140, 255, 255)",
  yellow: "rgb(235, 220, 170)",
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
  const pictoInfo = getPictoByName(picto?.name ?? "")

  const wrapperSize = isBig ? "w-14 h-14" : "w-9 h-9";
  const innerSize = isBig ? "w-11 h-11" : "w-7 h-7";
  const iconSize = isBig ? "text-x2" : "text-lg";

  return (
    <div
      className={`relative ${wrapperSize} rotate-45 border border-white/20 rounded-sm grid place-items-center bg-black/30 ml-2`}
      aria-label={picto?.name ?? "Adicionar picto"}
    >
      {maskBase ? (
        <div
          className={`rotate-[-45deg] ${innerSize}`}
          style={{
            backgroundColor: colorToHex[pictoInfo!.color],
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
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Stat({ label, value, displayValue, displayAttributedValue }: { label: string; value: number | string | undefined; displayValue?: string | number | undefined; displayAttributedValue?: string | undefined; }) {
  if (value === undefined) return null;
  return (
    <div className="text-sm flex items-baseline gap-2">
      <span className="opacity-70">{label}</span>
      <span className="text-2xl font-extrabold leading-none">
        {displayValue === undefined ? (
          value
        ) : (
          `${displayAttributedValue} (${displayValue})`
        )}</span>
    </div>
  );
}

function StatusTexts({ pictoResponse, level }: { pictoResponse: PictoResponse, level: number }) {
  const picto = getPictoByName(pictoResponse.name)
  if(!picto) { return }
  
  return (
    <>
      <Stat label="Velocidade" value={picto.status.speed} displayValue={displayPictoSpeed(picto.status.speed ?? 0, level)} displayAttributedValue={displayPictoAttributeSpeed(picto.status.speed ?? 0, level)} />
      <Stat
        label="Crítico"
        value={
          picto.status.criticalRate !== undefined
            ? `${picto.status.criticalRate}%`
            : undefined
        }
        displayValue={displayPictoCritical(picto.status.criticalRate ?? 0, level)}
        displayAttributedValue={displayPictoAttributeCritical(picto.status.criticalRate ?? 0, level)}
      />
      <Stat label="HP" value={picto.status.health} displayValue={displayPictoHealth(picto.status.health ?? 0, level)} displayAttributedValue={displayPictoAttributeHealth(picto.status.health ?? 0, level)} />
      <Stat label="Defesa" value={picto.status.defense} displayValue={displayPictoDefense(picto.status.defense ?? 0, level)} displayAttributedValue={displayPictoAttributeDefense(picto.status.defense ?? 0, level)} />
    </>
  );
}
function PictoCard({ picto, onPick }: { picto: PictoResponse; onPick?: (p: PictoResponse) => void }) {
  const level = picto.level ?? 1;
  const pictoInfo = getPictoByName(picto.name)

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
        <div className="grid grid-cols-1 gap-2">
          <StatusTexts pictoResponse={picto} level={level} />
          <Stat label="Nível" value={picto.level ?? 1} />
        </div>
        <div className="opacity-80">{pictoInfo?.description}</div>
      </div>
    </button>

  );
}

function getLevel(p: PictoResponse | null | undefined) {
  return p?.level ?? 1;
}

export default function PictosTab({ player, setPlayer }: PictosTabProps) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const slots: (PictoResponse | null)[] = useMemo(() => {
    const arr: (PictoResponse | null)[] = [null, null, null];
    (player?.pictos ?? []).forEach((p) => {
      const s = typeof p.slot === "number" ? Math.max(0, Math.min(2, p.slot!)) : 0;
      arr[s] = p;
    });
    return arr;
  }, [player?.pictos]);

  const filtered = useMemo(() => {
    const selectedNames = new Set(
      (player?.pictos ?? []).map(p => p.name.toLowerCase())
    );

    const withoutSelected = PictosList.filter(
      p => !selectedNames.has(p.name.toLowerCase())
    );

    const q = query.trim().toLowerCase();
    if (!q) return withoutSelected;

    return withoutSelected.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [query, player?.pictos]);


  function upsertPictoAt(slotIndex: number, picto: PictoResponse) {
    setPlayer((prev) => {
      if (!prev) return prev;
      const others = (prev.pictos ?? []).filter((p) => p.slot !== slotIndex);
      const chosen: PictoResponse = { ...picto, slot: slotIndex, level: picto.level ?? 1 };
      return { ...prev, pictos: [...others, chosen] };
    });
    setOpenSlot(null);
  }

  function clearSlot(slotIndex: number) {
    setPlayer((prev) => {
      if (!prev) return prev;
      const next = (prev.pictos ?? []).filter((p) => p.slot !== slotIndex);
      return { ...prev, pictos: next };
    });
  }

  function bumpLevel(slotIndex: number, delta: number) {
    setPlayer((prev) => {
      if (!prev) return prev;
      const next = (prev.pictos ?? []).map((p) => {
        if (p.slot !== slotIndex) return p;
        const lvl = Math.max(1, Math.min(33, (p.level ?? 1) + delta));
        return { ...p, level: lvl };
      });
      return { ...prev, pictos: next };
    });
  }

  function handleSlotActivate(idx: number) {
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
      <div className="text-center text-lg tracking-widest pb-3 opacity-90">PICTOS</div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((idx) => {
          const selected = slots[idx];
          const pictoInfo = getPictoByName(selected?.name ?? "")
          const accent = selected ? colorToHex[pictoInfo!.color] : "rgba(255,255,255,0.15)";

          return (
            <div key={idx} className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">

              {/* Borda chanfrada */}
              <div
                className="pointer-events-none absolute inset-x-3 top-4 bottom-4 rounded-xl"
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
                className={`w-full text-left p-6 pl-28 rounded-2xl transition-colors ${selected ? "hover:bg-white/5 cursor-default" : "h-48 grid place-items-center hover:bg-white/5"
                  }`}
              >
                {/* Trilho/diamante lateral */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <PlusDiamond icon={selected ? "" : "+"} picto={selected} isBig={true} />
                </div>
                {selected ? (
                  <div className="flex flex-col gap-3">
                    {/* Header: título + Clear (botão separado, não aninhado) */}
                    <div className="flex items-start justify-between">
                      <div className="text-2xl font-semibold leading-tight mr-2">{selected.name}</div>
                      <button
                        className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(idx);
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Linha de stats */}
                    <div className="flex items-center gap-8">
                      <div className="grid grid-cols-1 gap-2">
                        <StatusTexts pictoResponse={selected} level={selected.level ?? 1} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Controle de Level */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="opacity-70 mr-2">Nível</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 grid place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              bumpLevel(idx, -1);
                            }}
                          >
                            ‹
                          </button>
                          <span className="text-xl font-extrabold w-10 text-center">{getLevel(selected)}</span>
                          <button
                            className="w-7 h-7 grid place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              bumpLevel(idx, +1);
                            }}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-white/10 my-1" />

                    {/* Descrição */}
                    <div className="opacity-85">{pictoInfo?.description}</div>
                  </div>
                ) : (
                  <div className="text-center w-full opacity-60 tracking-wide text-lg">Selecione um Picto</div>
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
            <PictoCard key={`${p.name}-${p.color}`} picto={p} onPick={(pp) => upsertPictoAt(openSlot ?? 0, pp)} />
          ))}
          {filtered.length === 0 && <div className="opacity-70 p-8 text-center">No pictos found.</div>}
        </div>
      </Modal>
    </div>
  );
}
