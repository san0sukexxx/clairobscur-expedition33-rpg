import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaSkull, FaCheckCircle } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import WeaponSection from "../components/WeaponSection";
import PlayerSheet from "../components/PlayerSheet";
import PictosTab from "../components/PictosTab";
import LuminasSection from "../components/LuminasSection";
import CombatSection from "../components/CombatSection";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import { APIPlayer, type CreatePlayerInput, type PlayerResponse } from "../api/APIPlayer";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard"
import {
  rollCommandForInitiative,
  initiativeTotal,
  countCriticalRolls,
  calculateCriticalMulti,
  diceTotal,
  isCriticalFailureRoll
} from "../utils/PlayerCalculator"
import PanelModal from "../components/PanelModal";

type Skill = { id: string; name: string; learned: boolean };
type Item = { id: string; name: string; equipped: boolean };

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");
  const alreadyRan = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);

  const weaponList = useMemo(() => {
    return WeaponsDataLoader.getByFile(
      WeaponsDataLoader.fileForCharacter(player?.playerSheet?.character)
    );
  }, [player?.playerSheet?.character]);

  const { campaign, character } = useParams<{
    campaign: string;
    character: string;
  }>();

  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    onPlayerChange();
  }, [player]);

  // mock simples
  const [skills, setSkills] = useState<Skill[]>([
    { id: "s1", name: "Investigar", learned: true },
    { id: "s2", name: "Furtividade", learned: false },
    { id: "s3", name: "Acrobacia", learned: true },
  ]);

  // mock simples
  const [items, setItems] = useState<Item[]>([
    { id: "i1", name: "Espada longa", equipped: true },
    { id: "i2", name: "Escudo de madeira", equipped: false },
    { id: "i3", name: "Poção de cura", equipped: false },
  ]);

  // mock simples
  function toggleSkill(id: string) {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, learned: !s.learned } : s));
  }

  // mock simples
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
      case COMBAT_MENU_ACTIONS.Initiative:
        rollInitiative();
        break;
      default:
        break;
    }
  }

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />

      <PanelModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        size="md"
        showClose={false}
      >
        {modalBody}
      </PanelModal>

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
        {loading && <div className="text-center opacity-70 py-16">Carregando…</div>}

        {error && !loading && (
          <div className="text-center text-error py-16">{error}</div>
        )}

        {/* Conteúdo da aba */}
        <section className="space-y-4">
          {!loading && !error && tab === "ficha" && (
            <PlayerSheet player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "arma" && (
            <WeaponSection player={player} setPlayer={setPlayer} weaponList={weaponList} />
          )}

          {!loading && !error && tab === "pictos" && (
            <PictosTab />
          )}

          {!loading && !error && tab === "luminas" && (
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


          {!loading && !error && tab === "combate" && (
            <CombatSection onMenuAction={handleCombatMenuAction} player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "habilidades" && (
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

  function setup() {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    if (character == undefined) {
      const createSheet = async () => {
        try {
          const input: CreatePlayerInput = { campaign: campaign! };
          const response = await APIPlayer.create(input);

          navigate(`/campaign-player/${campaign}/${response.playerID}`, { replace: false });
          setLoading(false);
        } catch (e: any) {
          setError("Erro ao carregar dados: " + e?.message);
        }
      };

      createSheet();
    } else {
      fetchInfo(character);
    }
  }

  async function fetchInfo(character: string) {
    try {
      const response = await APIPlayer.getInfo(character);
      setPlayer(response.player);

      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError("Erro ao carregar player: " + e?.message);
    }
  }

  function onPlayerChange() {
    if (!player) return;

    const savePlayer = async () => {
      try {
        await APIPlayer.save(player);
      } catch (e) {
        console.error("Erro ao salvar player:", e);
      }
    };

    savePlayer();
  }

  function rollInitiative() {
    if (!player) return;

    if (player.fightInfo) {
        player.fightInfo.canRollInitiative = false;
        setPlayer(player);
    }

    const rollCall = async (total: number) => {
      try {
        await APIPlayer.saveRollInitiative(player, total);
      } catch (e) {
        console.error("Erro ao salvar player:", e);
      }
    };

    diceBoardRef.current?.roll(rollCommandForInitiative(player), (result) => {
      const criticalRolls = countCriticalRolls(result);
      const criticalMulti = calculateCriticalMulti(result);
      const rollTotal = diceTotal(result);
      const total = initiativeTotal(player, result);
      const isCriticalFailure = isCriticalFailureRoll(result);

      setModalTitle("Resultado da rolagem");

      if (isCriticalFailure) {
        setModalBody(
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              Falha crítica
            </h3>
            <p>Total: {total}</p>
          </div>
        );
      } else {
        setModalBody(
          <div className="space-y-2">
            <p>Rolagem: {rollTotal}</p>
            {criticalRolls > 0 && (
              <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
                <FaCheckCircle className="w-6 h-6" />
                Críticos: <b>{criticalRolls}</b>
              </h3>
            )}
            <p>Habilidade: <b>{(player.playerSheet?.hability ?? 0)}</b>
              {criticalRolls > 0 && (
                <b> (x{criticalMulti})</b>
              )}
            </p>
            <p>Total: {total}</p>
          </div>
        );
      }

      setModalOpen(true);

      rollCall(result);

      setTimeout(() => {
        diceBoardRef.current?.hideBoard();
      }, 3000);
    });
  }
}
