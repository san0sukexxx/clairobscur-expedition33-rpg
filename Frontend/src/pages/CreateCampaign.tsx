import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Item = { id: string; label: string; checked: boolean };

const DEFAULT_ITEMS: Item[] = [
    { id: "gustave", label: "Gustave", checked: true },
    { id: "maelle", label: "Maelle", checked: true },
    { id: "sciel", label: "Sciel", checked: true },
    { id: "lune", label: "Lune", checked: true },
    { id: "verso", label: "Verso", checked: false },
    { id: "monoco", label: "Monoco", checked: false },
];

export default function CreateCampaign() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);

    const selectedCount = items.filter(i => i.checked).length;

    const nameError = useMemo(() => {
        if (!touched) return undefined;
        if (name.trim().length < 3) return "O nome deve ter pelo menos 3 caracteres.";
        return undefined;
    }, [name, touched]);

    const canSubmit = name.trim().length >= 3 && selectedCount > 0 && !submitting;

    function toggleItem(id: string) {
        setItems(prev =>
            prev.map(i => (i.id === id ? { ...i, checked: !i.checked } : i))
        );
    }

    function toggleAll(checked: boolean) {
        setItems(prev => prev.map(i => ({ ...i, checked })));
    }

    // TODO: implement after backend
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTouched(true);
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            // simula chamada de API
            await new Promise(r => setTimeout(r, 600));
            // redireciona (ajuste a rota como preferir)
            navigate("/campaign-admin");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-base-200 p-4">
            <form onSubmit={onSubmit} className="w-full max-w-md card bg-base-100 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-primary">Criar Campanha</h2>

                    {/* Nome da campanha */}
                    <label className="form-control" onBlur={() => setTouched(true)}>
                        <span className="label-text">Nome da campanha</span>
                        <input
                            className="input input-bordered"
                            placeholder="Expedition 33"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {nameError && (
                            <span className="text-error text-sm mt-1 block w-full">{nameError}</span>
                        )}
                    </label>

                    {/* Ações de seleção */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-sm opacity-70">
                            Personagens iniciais permitidos: <b>{selectedCount}</b> / {items.length}
                        </span>
                        <div className="join">
                            <button
                                type="button"
                                className="btn btn-xs join-item"
                                onClick={() => toggleAll(true)}
                            >
                                Selecionar tudo
                            </button>
                            <button
                                type="button"
                                className="btn btn-xs join-item"
                                onClick={() => toggleAll(false)}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {/* Lista com checkboxes */}
                    <ul className="menu bg-base-200 rounded-box p-2 w-full">
                        {items.map((item) => (
                            <li key={item.id}>
                                <label className="flex items-center gap-3 py-2">
                                    <img src={`/${item.id}.webp`} alt={item.label} className="max-h-32 w-auto" />

                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={item.checked}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                    <span>{item.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>

                    {/* Ações do formulário */}
                    <div className="card-actions justify-end mt-2">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => navigate(-1)}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                "Criar campanha"
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
