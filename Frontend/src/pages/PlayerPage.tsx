import { useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import CharacterSelect from "../components/CharacterSelect";
import WeaponSection from "../components/WeaponSection";
import PictosTab from "../components/PictosTab";
import LuminasSection from "../components/LuminasSection";
import CombatSection from "../components/CombatSection";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";

type Skill = { id: string; name: string; learned: boolean };
type Item = { id: string; name: string; equipped: boolean };

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");

  const { campaign, character } = useParams<{
    campaign: string;
    character: string;
  }>();

  // mock simples
  const [hp, setHp] = useState(20);
  const [mp, setMp] = useState(8);
  const [skills, setSkills] = useState<Skill[]>([
    { id: "s1", name: "Investigar", learned: true },
    { id: "s2", name: "Furtividade", learned: false },
    { id: "s3", name: "Acrobacia", learned: true },
  ]);

  const [items, setItems] = useState<Item[]>([
    { id: "i1", name: "Espada longa", equipped: true },
    { id: "i2", name: "Escudo de madeira", equipped: false },
    { id: "i3", name: "Poção de cura", equipped: false },
  ]);

  function toggleSkill(id: string) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, learned: !s.learned } : s));
  }

  function toggleItem(id: string) {
    setItems(prev =>
      prev.map(it => it.id === id ? { ...it, equipped: !it.equipped } : it)
    );
  }

  function handleCombatMenuAction(action: CombatMenuAction) {
    switch (action) {
      case COMBAT_MENU_ACTIONS.Inventory:
        setTab("inventario");
        break;
      case COMBAT_MENU_ACTIONS.Skills:
        setTab("habilidades");
        break;
      default:
        break;
    }
  }

  return (
    <div className="min-h-dvh bg-base-200">
      {/* Navbar topo */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <Link to={`/character-sheet-list/${campaign}`} className="flex items-center gap-2">
            <MdOutlineKeyboardBackspace />
            <span className="text-lg font-bold">Ficha do Jogador</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo (deixa espaço para a btm-nav) */}
      <main className="p-4 max-w-md mx-auto pb-24">
        {/* Conteúdo da aba */}
        <section className="space-y-4">
          {tab === "ficha" && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Ficha</h2>

                <div className="grid grid-cols-1 gap-3">
                  <label className="form-control flex flex-col items-start gap-1">
                    <span className="label-text">Nome</span>
                    <input
                      className="input input-bordered w-full"
                      placeholder="Nome"
                    />
                  </label>

                  <CharacterSelect />

                  <div className="grid grid-cols-2 gap-3">
                    <label className="form-control">
                      <span className="label-text">Total de pontos</span>
                      <input className="input input-bordered" placeholder="Ex.: 10" type="number" />
                    </label>
                    <label className="form-control">
                      <span className="label-text">XP</span>
                      <input className="input input-bordered" placeholder="Ex.: 10" type="number" />
                    </label>
                  </div>

                  <div className="card bg-base-200 shadow">
                    <div className="card-body">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                          <span className="label-text">Poder</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={hp}
                            onChange={(e) => setHp(Number(e.target.value))}
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text">PA</span> <span className="pl-1 text-sm text-gray-500">máx. 5</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={mp}
                            onChange={(e) => setMp(Number(e.target.value))}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                          <span className="label-text">Habilidade</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={hp}
                            onChange={(e) => setHp(Number(e.target.value))}
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text">PM</span> <span className="pl-1 text-sm text-gray-500">máx. 15</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={mp}
                            onChange={(e) => setMp(Number(e.target.value))}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                          <span className="label-text">Resistência</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={hp}
                            onChange={(e) => setHp(Number(e.target.value))}
                          />
                        </label>
                        <label className="form-control">
                          <span className="label-text">PV</span> <span className="pl-1 text-sm text-gray-500">máx. 10</span>
                          <input
                            type="number"
                            className="input input-bordered"
                            value={mp}
                            onChange={(e) => setMp(Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <label className="form-control flex flex-col items-start gap-1">
                    <span className="label-text">Anotações</span>
                    <textarea
                      className="textarea textarea-bordered w-full h-48 rounded-md"
                      placeholder="Anotações"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === "arma" && (
            <WeaponSection />
          )}

          {tab === "pictos" && (
            <PictosTab />
          )}

          {tab === "luminas" && (
            <LuminasSection />
          )}

          {tab === "inventario" && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Inventário</h2>
                <ul className="menu bg-base-200 rounded-box p-2 w-full">
                  {items.map(item => (
                    <li key={item.id}>
                      <label className="flex items-center gap-3 py-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-secondary"
                          checked={item.equipped}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span>{item.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-sm opacity-70">
                  Marque os itens que o personagem está utilizando no momento.
                </div>
              </div>
            </div>
          )}


          {tab === "combate" && (
            <CombatSection onMenuAction={handleCombatMenuAction} />
          )}

          {tab === "habilidades" && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">Habilidades</h2>
                <ul className="menu bg-base-200 rounded-box p-2 w-full">
                  {skills.map(s => (
                    <li key={s.id}>
                      <label className="flex items-center gap-3 py-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={s.learned}
                          onChange={() => toggleSkill(s.id)}
                        />
                        <span>{s.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-sm opacity-70">
                  Marque as habilidades que seu personagem já domina.
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Abas fixas no rodapé — somente ícones, distribuídos igualmente */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t shadow-lg">
        <nav className="grid grid-cols-7">
          <button
            className={`py-3 ${tab === "ficha" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("ficha")}
            aria-label="Ficha"
          >
            <FaUser className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "arma" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("arma")}
            aria-label="Arma"
          >
            <LuSword className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "pictos" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("pictos")}
            aria-label="Pictos"
          >
            <GiStoneTablet className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "luminas" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("luminas")}
            aria-label="Luminas"
          >
            <GiCrystalShine className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "inventario" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("inventario")}
            aria-label="Inventário"
          >
            <GiBackpack className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "habilidades" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("habilidades")}
            aria-label="Habilidades"
          >
            <GiMagicSwirl className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "combate" ? "text-primary" : "text-base-content/70"}`}
            onClick={() => setTab("combate")}
            aria-label="Combate"
          >
            <LuSwords className="mx-auto text-2xl" />
          </button>
        </nav>
      </div>


    </div>
  );
}
