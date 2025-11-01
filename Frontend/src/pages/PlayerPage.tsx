import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaSkull, FaCheckCircle } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import WeaponSection from "../components/WeaponSection";
import PlayerSheet from "../components/PlayerSheet";
import PictosTab from "../components/PictosTab";
import LuminasSection from "../components/LuminasSection";
import SkillsSection from "../components/SkillsSection";
import ItemsSection from "../components/ItemsSection";
import CombatSection from "../components/CombatSection";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import { APIPlayer, type CreatePlayerInput } from "../api/APIPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import { type PlayerResponse, MockAPIPlayer } from "../api/MockAPIPlayer";
import { APIPictos } from "../api/APIPictos";
import { type PictoResponse } from "../api/ResponseModel";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import {
  rollCommandForInitiative,
  initiativeTotal,
  countCriticalRolls,
  calculateCriticalMulti,
  diceTotal,
  isCriticalFailureRoll
} from "../utils/PlayerCalculator";
import PanelModal from "../components/PanelModal";
import { RefreshHelper } from "../utils/RefreshHelper";
import { useToast } from "../components/Toast";

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");
  const alreadyRan = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
  const [pictos, setPictos] = useState<PictoResponse[] | null>(null);
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);
  const refreshHelper = new RefreshHelper();
  const { showToast } = useToast();
  const { pathname } = useLocation();
  // const isAdmin = pathname === "/campaign-player-admin";
  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

  const weaponList = useMemo(() => {
    return WeaponsDataLoader.getByFile(
      WeaponsDataLoader.fileForCharacter(player?.playerSheet?.characterId)
    );
  }, [player?.playerSheet?.characterId]);

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
          <Link
            to={isAdmin ? "/campaign-admin/1" : `/character-sheet-list/${campaign}`}
            className="flex items-center gap-2"
          >
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
            <PlayerSheet player={player} setPlayer={setPlayer} campaignInfo={campaignInfo} />
          )}

          {!loading && !error && tab === "arma" && (
            <WeaponSection player={player} setPlayer={setPlayer} weaponList={weaponList} isAdmin={isAdmin} />
          )}

          {!loading && !error && tab === "pictos" && (
            <PictosTab pictos={pictos} player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "luminas" && (
            <LuminasSection luminas={pictos} player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "inventario" && (
            <ItemsSection player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "combate" && (
            <CombatSection onMenuAction={handleCombatMenuAction} player={player} setPlayer={setPlayer} />
          )}

          {!loading && !error && tab === "habilidades" && (
            <SkillsSection player={player} setPlayer={setPlayer} />
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
          const input: CreatePlayerInput = { campaign: Number(campaign)! };
          const response = await APIPlayer.create(input);

          navigate(`/campaign-player/${campaign}/${response.id}`, { replace: true });
        } catch (e: any) {
          setError("Erro ao carregar dados: " + e?.message);
        }
      };

      createSheet();
    } else {
      fetchInfo(parseInt(character));
    }

  }

  async function fetchInfo(character: number) {
    try {
      if (!campaign) return;
      const campaignId = parseInt(campaign, 10);

      const [campaignInfo, playerResponse, pictosListResponse] = await Promise.all([
        APICampaign.get(campaignId),
        APIPlayer.get(character),
        APIPictos.getPictosList(),
      ]);

      setPlayer(playerResponse);
      setPictos(pictosListResponse.pictos);
      setCampaignInfo(campaignInfo);

      setLoading(false);

      // TODO: implement
      // refreshHelper.init(character, playerResponse.player, setPlayer, showToast);
      // refreshHelper.refreshInfoLoop();
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError("Erro ao carregar player: " + e?.message);
    }
  }

  function onPlayerChange() {
    if (!player) return;

    const savePlayer = async () => {
      try {
        await MockAPIPlayer.save(player);
      } catch (e) {
        console.error("Erro ao salvar player:", e);
      }
    };

    savePlayer();
  }

  function rollInitiative() {
    if (!player) return;

    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: {
          ...player.fightInfo,
          canRollInitiative: false
        }
      });
    }

    const rollCall = async (total: number) => {
      try {
        await MockAPIPlayer.saveRollInitiative(player, total);
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
