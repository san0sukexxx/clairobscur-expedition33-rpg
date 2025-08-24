import { useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import FloatingButton from "../components/FloatingButton";

// Modelo simples (pode vir de API)
type ListItem = {
  id: string;
  name: string;
  character: string;
};

const MOCK: ListItem[] = [
  { id: "c1", name: "Juliano", character: "Verso" },
  { id: "c2", name: "Julia", character: "Sciel" },
  { id: "c3", name: "Tamara", character: "Lune" },
];

export default function CharacterSheetList() {
  const [items] = useState<ListItem[]>(MOCK);
  const { campaign } = useParams<{ campaign: string }>();
  const navigate = useNavigate();

  function handleAddCharacter() {
    navigate(`/campaign-player/${campaign}`);
  }

  return (
    <div className="min-h-dvh bg-base-200">
      {/* Navbar (mobile) */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <Link to="/campaign-list" className="flex items-center gap-2">
            <MdOutlineKeyboardBackspace />
            <span className="text-lg font-bold">Fichas de personagem</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="p-4 space-y-4 max-w-md mx-auto">
        {items.length === 0 ? (
          <div className="text-center opacity-70 py-16">
            Nenhuma ficha de personagem disponível.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id}>
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="card-title text-base">{c.name}</h2>
                      </div>
                      <div className="text-right text-sm opacity-70">
                        Character: {c.character}
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-2">
                      <Link
                        to={`/campaign-player/${campaign}/${c.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Usar
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <FloatingButton onClick={handleAddCharacter} />
    </div>
  );
}
