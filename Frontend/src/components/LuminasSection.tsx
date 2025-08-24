import { useMemo, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";

/* ---------------- Helpers ---------------- */
function uid(): string {
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ---------------- Tipos ---------------- */
type LuminaBase = {
  id: string;
  name: string;
  icon: string;      // caminho da imagem ou ícone
  color: "emerald" | "red" | "cyan" | "amber" | "violet" | "slate";
};

type LuminaRow = {
  rowId: string;     // id da linha (permite duplicar a mesma lumina várias vezes)
  lumina: LuminaBase;
  amount: number;
};

/* ---------------- Catálogo (picker) ---------------- */
const ALL_LUMINAS: LuminaBase[] = [
  { id: "energy-master", name: "Energy Master", icon: "/pictos/energy.png", color: "emerald" },
  { id: "aug-first-strike", name: "Augmented First Strike", icon: "/pictos/strike.png", color: "red" },
  { id: "survivor", name: "Survivor", icon: "/pictos/survivor.png", color: "cyan" },
  { id: "aegis-revival", name: "Aegis Revival", icon: "/pictos/aegis.png", color: "cyan" },
  { id: "recovery", name: "Recovery", icon: "/pictos/recovery.png", color: "violet" },
  { id: "energising-parry", name: "Energising Parry", icon: "/pictos/parry.png", color: "emerald" },
];

/* ---------------- Componente ---------------- */
export default function LuminasSection() {
  const [rows, setRows] = useState<LuminaRow[]>([
    { rowId: uid(), lumina: ALL_LUMINAS[0], amount: 40 },
    { rowId: uid(), lumina: ALL_LUMINAS[1], amount: 5 },
    { rowId: uid(), lumina: ALL_LUMINAS[2], amount: 20 },
  ]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const total = useMemo(() => rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_LUMINAS;
    return ALL_LUMINAS.filter(l => l.name.toLowerCase().includes(q));
  }, [query]);

  function addLumina(l: LuminaBase) {
    setRows(prev => [...prev, { rowId: uid(), lumina: l, amount: 0 }]); // permite duplicados
    setPickerOpen(false);
    setQuery("");
  }

  function removeRow(rowId: string) {
    setRows(prev => prev.filter(r => r.rowId !== rowId));
  }

  function setAmount(rowId: string, val: string) {
    const n = Number(val.replace(/\D/g, "")) || 0;
    setRows(prev => prev.map(r => (r.rowId === rowId ? { ...r, amount: n } : r)));
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        {/* Título */}
        <h2 className="text-center font-bold tracking-wide uppercase">
          Luminas <span className="text-info">({total})</span>
        </h2>

        {/* Lista */}
        <ul className="mt-3 space-y-3">
          {rows.map(r => (
            <li key={r.rowId} className="rounded-lg border border-base-300 bg-base-200 px-3 py-4">
              <div className="flex items-center gap-4">
                <DiamondOrImg icon={r.lumina.icon} color={r.lumina.color} />
                <span className="flex-1">{r.lumina.name}</span>

                {/* quantidade à direita + remover */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input input-ghost w-16 text-right text-lg"
                    value={r.amount}
                    onChange={(e) => setAmount(r.rowId, e.target.value)}
                  />
                  <button className="btn btn-ghost btn-xs" onClick={() => removeRow(r.rowId)} aria-label="Clear">
                    <FaTimes />
                  </button>
                </div>
              </div>
            </li>
          ))}

          {/* Add New -> abre picker */}
          <li>
            <button
              type="button"
              className="w-full rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 transition py-4 px-3 flex items-center gap-4"
              onClick={() => setPickerOpen(true)}
            >
              <DiamondOrImg icon="" color="slate" />
              <span className="flex-1 text-left">Add New</span>
              <FaPlus className="opacity-70" />
            </button>
          </li>
        </ul>
      </div>

      {/* Picker / Modal */}
      <dialog className={`modal ${pickerOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-3">Selecionar Lumina</h3>

          <label className="input input-bordered flex items-center gap-2 mb-3">
            <input
              className="grow"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <ul className="menu bg-base-200 rounded-box p-2 max-h-80 overflow-auto">
            {filtered.map(l => (
              <li key={l.id}>
                <button className="flex items-center gap-3 py-2" onClick={() => addLumina(l)}>
                  <DiamondOrImg icon={l.icon} color={l.color} />
                  <span>{l.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => setPickerOpen(false)}>Fechar</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

/* Ícone: usa imagem se existir; senão, desenha um losango colorido */
function DiamondOrImg({ icon, color }: { icon: string; color: "emerald" | "red" | "cyan" | "amber" | "violet" | "slate" }) {
  if (icon) {
    return <img src={icon} alt="" className="w-10 h-10 object-contain rounded-md" />;
  }
  const bg = {
    emerald: "bg-emerald-400",
    red: "bg-rose-500",
    cyan: "bg-cyan-400",
    amber: "bg-amber-400",
    violet: "bg-violet-400",
    slate: "bg-slate-400",
  }[color];
  return (
    <div className="relative w-10 h-10">
      <div className={`absolute inset-0 origin-center rotate-45 ${bg} rounded-sm shadow`} />
      <div className="absolute inset-1 origin-center rotate-45 bg-base-100 rounded-sm" />
    </div>
  );
}
