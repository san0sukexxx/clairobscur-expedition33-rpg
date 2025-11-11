import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaSkull, FaCheckCircle, FaDivide } from "react-icons/fa";
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
import { APIPlayer, type CreatePlayerInput, type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import { APIPictos } from "../api/APIPictos";
import { APIBattle } from "../api/APIBattle";
import { type PictoResponse, type BattleCharacterInfo } from "../api/ResponseModel";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import {
  rollCommandForInitiative,
  rollCommandFoBasicAttack,
  initiativeTotal,
  countCriticalRolls,
  calculateCriticalMulti,
  diceTotal,
  isCriticalFailureRoll,
  calculateFailureDiv,
  countFailuresRolls
} from "../utils/PlayerCalculator";
import PanelModal from "../components/PanelModal";
import { useToast } from "../components/Toast";
import { calculateBasicAttackDamage, calculateRawWeaponPower } from "../utils/PlayerCalculator";
import MasterEditingOverlay from "../components/MasterEditingOverlay"

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");
  const alreadyRan = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<GetPlayerResponse | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
  const [pictos, setPictos] = useState<PictoResponse[] | null>(null);
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

  const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />

      {!isAdmin && player?.isMasterEditing && (
        <MasterEditingOverlay />
      )}

      <PanelModal
        open={modalOpen}
        onClose={handleModalClose}
        title={modalTitle}
        size="md"
        showClose={false}
      >
        {modalBody}
      </PanelModal>

      {/* Navbar topo */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <button
            onClick={() => handleNavigateBackToAdmin()}
            className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition"
          >
            <MdOutlineKeyboardBackspace className="text-2xl" />
            <span>Ficha do Jogador</span>
          </button>
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
            <CombatSection onMenuAction={handleCombatMenuAction} player={player} onSelectTarget={handleSelectAttackTarget} />
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
      return fetchInfo();
    }

  }

  async function fetchInfo() {
    try {
      if (!campaign || !character) return;
      const campaignId = parseInt(campaign, 10);

      const [campaignInfo, playerResponse, pictosListResponse] = await Promise.all([
        APICampaign.get(campaignId),
        APIPlayer.get(parseInt(character)),
        APIPictos.getPictosList(),
      ]);

      setPlayer(playerResponse);
      setPictos(pictosListResponse.pictos);
      setCampaignInfo(campaignInfo);

      setLoading(false);

      const interval = setInterval(() => {
        checkPlayerLoop()
      }, 2000)

      return () => clearInterval(interval);
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError("Erro ao carregar player: " + e?.message);
    }
  }

  async function checkPlayerLoop() {
    try {
      if (!character) return
      const playerInfo = await APIPlayer.get(parseInt(character))
      setPlayer(prev => (prev ? { ...prev, isMasterEditing: !!playerInfo.isMasterEditing } : prev))
    } catch (e: any) {
      console.error("Erro ao verificar editing:", e)
    }
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

    diceBoardRef.current?.roll(rollCommandForInitiative(player), async (result) => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculateCriticalMulti(result)
      const rollTotal = diceTotal(result)
      const total = initiativeTotal(player, result)
      const isCriticalFailure = isCriticalFailureRoll(result)

      setModalTitle("Resultado da rolagem")

      if (isCriticalFailure) {
        setModalBody(
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              Falha crítica
            </h3>
            <h1 className="text-2xl font-bold">Total: {total}</h1>
          </div>
        )
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
            <p>
              Habilidade: <b>{player.playerSheet?.hability ?? 0}</b>
              {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            </p>
            <h1 className="text-2xl font-bold">Total: {total}</h1>
          </div>
        )
      }

      setModalOpen(true)

      try {
        const savedInitiative = await APIBattle.addInitiative({
          battleCharacterId: player.fightInfo?.playerBattleID ?? 0,
          value: total,
          hability: player.playerSheet?.hability ?? 0,
          playFirst: criticalRolls > 0,
        })

        setPlayer((prev) => {
          if (!prev || !prev.fightInfo) return prev

          const fi = prev.fightInfo
          const current = fi.initiatives ?? []

          return {
            ...prev,
            fightInfo: {
              ...fi,
              initiatives: [...current, savedInitiative],
            },
          }
        })
      } catch (err) {
        console.error("Erro ao registrar iniciativa:", err)
      }

      timeoutDiceBoardRef.current = setTimeout(() => {
        diceBoardRef.current?.hideBoard();
        timeoutDiceBoardRef.current = null;
      }, 5000);
    })

  }

  function joinBattle() {
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


    const joinBattleCall = async () => {
      try {
        await APIBattle.joinBattle({
          battleCharacterId: player.fightInfo?.playerBattleID ?? 0
        })
      } catch (e) {
        console.error("Erro ao salvar player:", e);
      }
    };

    joinBattleCall();
  }

  function handleSelectAttackTarget(target: BattleCharacterInfo) {
    if (player == null) { return }

    diceBoardRef.current?.roll(rollCommandFoBasicAttack(player, weaponList), async (result) => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculateCriticalMulti(result)
      const rollTotal = diceTotal(result)
      const weaponPower = calculateRawWeaponPower(player, weaponList, result)
      const total = calculateBasicAttackDamage(player, weaponList, result)
      const failures = countFailuresRolls(result)
      const failuresDiv = calculateFailureDiv(result)

      setModalTitle("Resultado da rolagem")

      setModalBody(
        <div className="space-y-2">
          <p>Rolagem: {rollTotal}</p>
          {criticalRolls > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Críticos: <b>{criticalRolls}</b>
            </h3>
          )}
          {failures > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              Falhas críticas: <b>{failures}</b>
            </h3>
          )}
          <p>
            Poder: <b>{player.playerSheet?.power ?? 0}</b>
            {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> {failuresDiv} )
              </span>
            )}
          </p>
          {weaponPower > 0 && (
            <p>
              Arma: <b>{weaponPower}</b>
            </p>
          )}
          <h1 className="text-2xl font-bold">Total: {total}</h1>
        </div>
      )

      // TODO: call attack API

      setModalOpen(true)
    });

    timeoutDiceBoardRef.current = setTimeout(() => {
      diceBoardRef.current?.hideBoard();
      timeoutDiceBoardRef.current = null;
    }, 5000);
  }

  function handleModalClose() {
    if (timeoutDiceBoardRef.current) {
      diceBoardRef.current?.hideBoard();
      clearTimeout(timeoutDiceBoardRef.current);
      timeoutDiceBoardRef.current = null;
    }
    setModalOpen(false);
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
      case COMBAT_MENU_ACTIONS.JoinBattle:
        joinBattle();
        break;
      default:
        break;
    }
  }

  async function handleNavigateBackToAdmin() {
    if (player == undefined || campaignInfo == undefined) { return; }

    if (isAdmin) {
      try {
        await APIPlayer.setMasterEditing(player.id, false);
        navigate(`/campaign-admin/${campaignInfo.id}`);
      } catch {
        console.log(error);
      }
    } else {
      navigate(`/character-sheet-list/${campaign}`);
    }
  }
}
