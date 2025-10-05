import { useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { type PictoResponse } from "../api/ResponseModel";
import { type PlayerResponse } from "../api/APIPlayer";

interface PictosTabProps {
    pictos: PictoResponse[] | null;
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

export default function PictosTab({ pictos, player, setPlayer }: PictosTabProps) {
  const [slots, setSlots] = useState<PictoResponse[]>([]);
  const [pickerOpen, setPickerOpen] = useState<{ open: boolean; slotIndex: number | null }>({
    open: false,
    slotIndex: null,
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (pictos == null) return [];
    const q = query.trim().toLowerCase();
    if (!q) return pictos;
    return pictos.filter(p => p.name.toLowerCase().includes(q));
  }, [query]);

  function openPicker(i: number) {
    setPickerOpen({ open: true, slotIndex: i });
  }

  function selectPicto(p: PictoResponse) {
    if (pickerOpen.slotIndex == null) return;
    setSlots(prev => prev.map((s, i) => (i === pickerOpen.slotIndex ? { ...s, picto: p } : s)));
    setPickerOpen({ open: false, slotIndex: null });
  }

  function clearSlot(i: number) {
    // setSlots(prev => prev.map((s, idx) => (idx === i ? { level: 20 } : s)));
  }

  function bumpLevel(i: number, delta: number) {
    // setSlots(prev =>
    //   prev.map((s, idx) => (idx === i ? { ...s, level: Math.max(1, Math.min(20, s.level + delta)) } : s)),
    // );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title justify-center">Pictos</h2>

        <div className="space-y-4">
          {slots.map((slot, i) =>
            pictos ? (
              // --- Slot vazio -------------------------------------------------
              <button
                key={i}
                className="w-full rounded-lg border border-base-300 bg-base-200 py-6 text-center tracking-wide hover:bg-base-300"
                onClick={() => openPicker(i)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-base-300 grid place-items-center text-xl">+</div>
                  <div className="flex-1" />
                  <span className="text-sm sm:text-base opacity-80">SELECT PICTO</span>
                  <div className="flex-1" />
                </div>
              </button>
            ) : (
              // --- Slot preenchido -------------------------------------------
              <div key={i} className="rounded-lg border border-base-300 bg-base-200">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Ícone lateral */}
                    <img src={`/pictos/${slot.name}.webp`} alt="" className="w-12 h-12 rounded-md object-contain" />

                    {/* Nome + stats */}
                    <div className="flex-1">
                      <div className="flex items-start">
                        <h3 className="text-lg font-semibold flex-1">{slot.name}</h3>
                        <button className="btn btn-xs btn-ghost gap-2" onClick={() => clearSlot(i)}>
                          <FaTimes /> Clear
                        </button>
                      </div>

                      <div className="divider my-2" />

                      <div className="grid grid-cols-3 gap-3 items-end">
                        {/* <Stat label={slot.picto.statLeftLabel} value={slot.picto.statLeftValue} />
                        {slot.picto.statMidLabel ? (
                          <Stat label={slot.picto.statMidLabel} value={slot.picto.statMidValue ?? "-"} />
                        ) : (
                          <div />
                        )} */}

                        {/* Level */}
                        <div className="text-right">
                          <div className="text-xs uppercase opacity-70">Level</div>
                          <div className="flex items-center gap-2 justify-end">
                            <button className="btn btn-xs btn-ghost" onClick={() => bumpLevel(i, -1)}>
                              <FaChevronLeft />
                            </button>
                            {/* <span className="text-2xl font-bold text-primary">{slot.level}</span> */}
                            <button className="btn btn-xs btn-ghost" onClick={() => bumpLevel(i, +1)}>
                              <FaChevronRight />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="divider my-2" />
                      <p className="text-sm text-base-content/70">{slot.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Modal / Picker ------------------------------------------------------ */}
      <dialog className={`modal ${pickerOpen.open ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-3">Selecionar Picto</h3>

          <label className="input input-bordered flex items-center gap-2 mb-3">
            <input
              className="grow"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <ul className="menu bg-base-200 rounded-box p-2 max-h-80 overflow-auto">
            {filtered.map((p) => (
              <li key={p.name}>
                <button className="flex items-center gap-3 py-2" onClick={() => selectPicto(p)}>
                  <img src={`/pictos/${p.name}.webp`} alt="" className="w-8 h-8 rounded-md object-contain" />
                  <span>{p.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => setPickerOpen({ open: false, slotIndex: null })}>
                Fechar
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={() => setPickerOpen({ open: false, slotIndex: null })}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value ?? "-"}</div>
    </div>
  );
}
