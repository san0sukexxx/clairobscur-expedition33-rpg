import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaSkull, FaCheckCircle, FaDivide, FaShieldAlt } from "react-icons/fa";
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
import { APIBattle, type AttackStatusEffectRequest, type CreateAttackRequest, type CreateDefenseRequest, type ResolveStatusRequest } from "../api/APIBattle";
import { type BattleCharacterInfo, type AttackResponse, type DefenseOption, type AttackType, type WeaponInfo, type StatusResponse } from "../api/ResponseModel";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import {
  rollCommandForInitiative,
  rollCommandForDefense,
  initiativeTotal,
  calculateDefense,
  calculateMaxCounterDamage,
  rollCommandForAttack,
  calculateAttackDamage,
  calculateFreeShotPlus,
  playerHasShield,
  playerHasEmpowered,
  playerHasWeakened,
  calculateStatusResolvedTotalValue,
  calculateResolveStatusWithDiceTotal,
  getPlayerFrenzy,
  playerHasDizzy
} from "../utils/PlayerCalculator";

import {
  calculateCriticalMulti,
  calculateFailureDiv,
  diceTotal,
  countCriticalRolls,
  countFailuresRolls
} from "../utils/DiceCalculator";

import { rollWithTimeout } from "../utils/RollUtils";
import PanelModal from "../components/PanelModal";
import { useToast } from "../components/Toast";
import { calculateRawWeaponPower } from "../utils/PlayerCalculator";
import { calculateNpcAttackReceivedDamage, checkForFragile, getWeaponElementModifier, hasEmpowered, hasHastened, hasShield, npcIsFlying } from "../utils/NpcCalculator";
import MasterEditingOverlay from "../components/MasterEditingOverlay"
import PendingAttacksModal from "../components/PendingAttacksModal"
import { getElementModifierText } from "../utils/ElementUtils";
import PendingStatusModal from "../components/PendingStatusModal";
import { rollCommandForResolveStatus } from "../utils/StatusCalculator";
import { statusNeedsResolveRoll } from "../utils/BattleUtils";

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");
  const alreadyRan = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wasMasterEditing, setWasMasterEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<GetPlayerResponse | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);
  const [attackType, setAttackType] = useState<AttackType>("basic");
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

  const [lastBattleLog, setLastBattleLog] = useState<number | undefined>();

  const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weaponList = useMemo(() => {
    return WeaponsDataLoader.getByFile(
      WeaponsDataLoader.fileForCharacter(player?.playerSheet?.characterId)
    );
  }, [player?.playerSheet?.characterId]);

  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo>({
    weapon: null,
    details: null,
  });

  useEffect(() => {
    const weaponId = player?.playerSheet?.weaponId;

    if (!weaponId) {
      setWeaponInfo({ weapon: null, details: null });
      return;
    }

    const weapon = player?.weapons?.find(w => w.id === weaponId) ?? null;
    const details = weaponList.find(w => w.name === weaponId) ?? null;

    setWeaponInfo({ weapon, details });
  }, [player?.playerSheet?.weaponId, player?.weapons, weaponList]);

  const { campaign, character } = useParams<{
    campaign: string;
    character: string;
  }>();

  useEffect(() => {
    setup();
  }, []);

  const checkPlayerLoop = useCallback(async () => {
    try {
      if (!player) return;

      const playerInfo = await APIPlayer.get(player.id, lastBattleLog);

      checkBattleLog(playerInfo);

      const hadBattle = player?.fightInfo != null;
      const hasBattleNow = playerInfo?.fightInfo != null;

      if (hadBattle !== hasBattleNow) {
        showToast(
          hasBattleNow
            ? "Uma batalha está em andamento"
            : "A batalha foi encerrada"
        );

        setPlayer(prev =>
          prev
            ? {
              ...prev,
              fightInfo: playerInfo?.fightInfo ?? undefined
            }
            : prev
        );
      }

      setWasMasterEditing(prev => {
        if (playerInfo.isMasterEditing && !prev) {
          setPlayer(p => (p ? { ...p, isMasterEditing: true } : p));
          return true;
        } else if (!playerInfo.isMasterEditing && prev) {
          setPlayer(playerInfo);
          return false;
        }
        return prev;
      });
    } catch (e: any) {
      showToast("Erro ao verificar editing");
    }
  }, [player, lastBattleLog]);

  useEffect(() => {
    const id = setInterval(() => {
      void checkPlayerLoop();
    }, 2000);

    return () => clearInterval(id);
  }, [checkPlayerLoop]);

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />

      {!isAdmin && player?.isMasterEditing && (
        <MasterEditingOverlay />
      )}

      <PendingStatusModal
        player={player}
        onTapResolve={onResolveStatus}
      />

      <PendingAttacksModal
        player={player}
        weaponList={weaponList}
        onSelectDefense={handleSelectDefense}
      />

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
            <PlayerSheet player={player} setPlayer={setPlayer} campaignInfo={campaignInfo} weaponInfo={weaponInfo} />
          )}

          {!loading && !error && tab === "arma" && (
            <WeaponSection player={player} setPlayer={setPlayer} weaponList={weaponList} isAdmin={isAdmin} />
          )}

          {!loading && !error && tab === "pictos" && (
            <PictosTab player={player} setPlayer={setPlayer} isAdmin={isAdmin} />
          )}

          {/* TODO */}
          {/* {!loading && !error && tab === "luminas" && (
            <LuminasSection luminas={pictos} player={player} setPlayer={setPlayer} />
          )} */}

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
      fetchInfo();
    }

  }

  async function fetchInfo() {
    try {
      if (!campaign || !character) return;
      const campaignId = parseInt(campaign);

      const [campaignInfo, playerResponse] = await Promise.all([
        APICampaign.get(campaignId),
        APIPlayer.get(parseInt(character))
      ]);

      const lastBattleLog = getLastBattleLogFromPlayer(playerResponse);
      setLastBattleLog(lastBattleLog);

      setPlayer(playerResponse);
      setCampaignInfo(campaignInfo);

      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError("Erro ao carregar player: " + e?.message);
    }
  }

  function checkBattleLog(playerInfo: GetPlayerResponse) {
    const logs = playerInfo.battleLogs ?? []
    if (logs.length === 0) return

    const fightEvents = new Set([
      "ADD_CHARACTER",
      "REMOVE_CHARACTER",
      "SET_INITIATIVE",
      "BATTLE_STARTED",
      "TURN_ENDED",
      "TURN_ADDED",
      "ALLOW_COUNTER",
      "STATUS_ADDED",
      "ATTACK_PENDING",
      "COUNTER_RESOLVED",
      "DAMAGE_DEALT",
      "STATUS_RESOLVED",
      "HP_CHANGED"
    ])

    const sheetEvents = new Set([
      "ATTACK_PENDING",
      "COUNTER_RESOLVED",
      "DAMAGE_DEALT",
      "STATUS_ADDED",
      "STATUS_RESOLVED",
    ])

    const shouldUpdateFight = logs.some(log => fightEvents.has(log.eventType))
    const shouldUpdateSheet = logs.some(log => sheetEvents.has(log.eventType))

    if (shouldUpdateSheet) {
      applySheetInfoUpdate(playerInfo)
    }

    if (shouldUpdateFight) {
      applyFightInfoUpdate(playerInfo)
    }

    const lastBattleLog = getLastBattleLogFromPlayer(playerInfo)
    setLastBattleLog(lastBattleLog)
  }


  function applyFightInfoUpdate(playerInfo: GetPlayerResponse) {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          fightInfo: playerInfo.fightInfo ?? prev.fightInfo
        }
        : prev
    );
  }

  function applySheetInfoUpdate(playerInfo: GetPlayerResponse) {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          playerSheet: playerInfo.playerSheet ?? prev.playerSheet
        }
        : prev
    );
  }

  function getLastBattleLogFromPlayer(playerInfo: GetPlayerResponse) {
    if (playerInfo.battleLogs && playerInfo.battleLogs.length > 0) {

      let lastId = 0;

      for (const log of playerInfo.battleLogs) {
        if (log.id > lastId) {
          lastId = log.id;
        }
      }

      return lastId;
    }

    return undefined;
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

    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForInitiative(weaponInfo), result => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculateCriticalMulti(result)
      const rollTotal = diceTotal(result)
      const total = initiativeTotal(player, result)
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
            Habilidade: <b>{player.playerSheet?.hability ?? 0}</b>
            {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> {failuresDiv} )
              </span>
            )}
          </p>
          <h1 className="text-2xl font-bold">Total: {total}</h1>
        </div>
      )

      setModalOpen(true)

      const callAddInitiative = async () => {
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
          showToast("Erro ao registrar iniciativa")
        }
      };

      callAddInitiative();
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
        showToast("Agora você está participando da batalha");
      } catch (e) {
        showToast("Erro ao salvar player");
      }
    };

    joinBattleCall();
  }

  function endTurn() {
    if (!player) return;

    const endTurnCall = async () => {
      try {
        await APIBattle.endTurn(player.fightInfo?.playerBattleID ?? 0)
      } catch (e) {
        showToast("Erro ao encerrar o turno");
      }
    };

    endTurnCall();
  }

  function handleSelectAttackTarget(target: BattleCharacterInfo) {
    if (player == null) { return }

    if (npcIsFlying(target) && attackType != "free-shot") {
      showToast("Este inimigo está voando e só pode ser atingido por tiros livres", { duration: 3000 });
      return;
    }

    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, attackType), result => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculateCriticalMulti(result)
      const rollTotal = diceTotal(result)
      const weaponPower = calculateRawWeaponPower(weaponInfo, attackType)
      const total = calculateAttackDamage(player, weaponInfo, target, result, attackType)
      const failures = countFailuresRolls(result)
      const failuresDiv = calculateFailureDiv(result)
      const elementModifier = getWeaponElementModifier(target.id, weaponInfo)
      const freeShotPlus = calculateFreeShotPlus(player, target, attackType)
      const isShielded = hasShield(target)
      const isEmpowered = playerHasEmpowered(player)
      const isWeakened = playerHasWeakened(player)
      const playerFrenzy = getPlayerFrenzy(player)
      const isDizzy = playerHasDizzy(player)

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
          {isEmpowered && (
            <p>
              Poderoso: <b>(x2)</b>
            </p>
          )}
          {isWeakened && (
            <p>
              Enfraquecido:
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> 2 )
              </span>
            </p>
          )}
          {weaponPower > 0 && (
            <p>
              Arma: <b>{weaponPower}</b>
            </p>
          )}
          {freeShotPlus > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Vulnerabilidade tiro-livre <b>(+{freeShotPlus})</b>
            </h3>
          )}
          {((playerFrenzy?.ammount ?? 0) > 0) && attackType != "free-shot" && (
            <p>
              Frenesi <b>(+{playerFrenzy?.ammount})</b>
            </p>
          )}
          {elementModifier != undefined && (
            <p>
              Elemento da arma: <b>{getElementModifierText(elementModifier.type)}</b>
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (x{elementModifier.multiplier})
              </span>
            </p>
          )}
          {isDizzy && attackType == "free-shot" && (
            <p>
              Está tonto:
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> 2 )
              </span>
            </p>
          )}
          {isShielded && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaShieldAlt className="w-6 h-6" />
              Possui escudo (Anula todo dano)
            </h3>
          )}
          <h1 className="text-2xl font-bold">Total: {total}</h1>
        </div>
      )

      setModalOpen(true)

      const callAttack = async () => {
        try {
          if (target.type == "npc") {
            const totalDamageToNpc = calculateNpcAttackReceivedDamage(target, total);
            const willGetFragile = checkForFragile(target, total);

            let effects: AttackStatusEffectRequest[] = []
            const attackInfo: CreateAttackRequest = {
              totalDamage: totalDamageToNpc,
              targetBattleId: target.battleID,
              sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
              attackType: attackType,
              effects: effects
            }

            if (willGetFragile) {
              effects.push({
                effectType: "Fragile",
                ammount: 1,
                remainingTurns: 2
              })
            }

            await APIBattle.attack(attackInfo)
          } else {
            const attackInfo: CreateAttackRequest = {
              totalPower: total,
              targetBattleId: target.battleID,
              sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
              attackType: attackType
              // TODO:
              // effects: [
              //     {
              //         effectType: "burn",
              //         ammount: 5
              //     }
              // ]
            }

            await APIBattle.attack(attackInfo)
          }

        } catch (e) {
          showToast("Erro ao atacar")
        }
      };

      callAttack();
    });
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
      case COMBAT_MENU_ACTIONS.EndTurn:
        endTurn();
        break;
      case COMBAT_MENU_ACTIONS.Attack:
        setAttackType("basic");
        break;
      case COMBAT_MENU_ACTIONS.FreeShot:
        setAttackType("free-shot");
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

  async function handleSelectDefense(attack: AttackResponse, defense: DefenseOption) {
    if (!player || !diceBoardRef.current) {
      return;
    }

    const callDefend = async (payload: CreateDefenseRequest) => {
      try {
        await APIBattle.defend(payload);
      } catch (e) {
        showToast("Erro ao encerrar o defender");
      }
    };

    const callCounter = async (battleCharacterId: number, maxDamage: number) => {
      try {
        await APIBattle.applyDefense(battleCharacterId, maxDamage);
        if (maxDamage > 0) {
          showToast("Você contra-atacou!");
        } else {
          showToast("Você não contra-atacou");
        }
      } catch (e) {
        showToast("Erro ao encerrar o executar o counter");
      }
    };

    const executeDefense = async (result: any | null) => {
      try {
        let defenseValue = attack.totalPower;
        if (result != null) {
          defenseValue = calculateDefense(attack.totalPower, player, weaponInfo, result, defense);
        }

        let description = "Você recebeu todo o dano.";

        if (defense === "block") {
          if (defenseValue > 0) {
            description = `Você não conseguiu aparar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu aparar o golpe!`;
          }
        } else if (defense === "gradient-block") {
          if (defenseValue > 0) {
            description = `Você não conseguiu aparar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu aparar o golpe! É hora de um contra-ataque!`;
          }
        } else if (defense === "dodge") {
          if (defenseValue > 0) {
            description = `Você não conseguiu desviar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu desviar do golpe!`;
          }
        } else if (defense === "jump") {
          if (defenseValue > 0) {
            description = `Você não conseguiu pular do ataque e recebeu ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu pular do ataque!`;
          }
        }

        if (defenseValue == 0 && playerHasShield(player)) {
          description = "Um escudo foi usado, você não recebeu dano"
        }

        const payload: CreateDefenseRequest = {
          attackId: attack.id,
          totalDamage: defenseValue,
        };

        callDefend(payload);

        showToast(description);
      } catch (e) {
        showToast("Falha ao registrar a defesa");
      }
    };

    const takeTheDamage = async () => {
      executeDefense(null)
    };

    if (defense == "counter") {
      callCounter(attack.targetBattleId, calculateMaxCounterDamage(player, weaponList));
    } else if (defense == "cancel-counter") {
      callCounter(attack.targetBattleId, 0);
    } else if (defense != "take") {
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForDefense(player, weaponInfo, defense), result => {
        executeDefense(result);
      });
    } else {
      takeTheDamage()
    }
  }

  function onResolveStatus(status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) {
    const callResolveStatus = async (payload: ResolveStatusRequest) => {
      try {
        await APIBattle.resolveStatus(payload);
      } catch (e) {
        showToast("Erro resolver o status");
      }
    };

    if (!statusNeedsResolveRoll(status)) {
      const total = calculateStatusResolvedTotalValue(player, weaponInfo, status)
      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      })

      return;
    }

    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForResolveStatus(status), result => {
      const total = calculateResolveStatusWithDiceTotal(player, weaponInfo, status, result)

      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      })
    })
  }
}
