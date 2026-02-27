import { useState, useEffect, type RefObject, type MutableRefObject } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { rollWithTimeout } from "../utils/RollUtils";
import { diceTotal } from "../utils/DiceCalculator";
import type { DiceBoardRef } from "./DiceBoard";
import { t } from "../i18n";
import { APIGameLog } from "../api/APIGameLog";
import { dispatchRoll } from "../utils/rollDispatcher";

/* ── Armor Class (escudo) ── */
function ArmorClassCard({ value, onRoll }: { value: number; onRoll: () => void }) {
    return (
        <button
            onClick={onRoll}
            className="relative flex flex-col items-center justify-start pt-2 bg-base-200 w-20 h-24 text-base-content shrink-0 hover:brightness-110 active:scale-95 transition cursor-pointer"
            style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)" }}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 120" preserveAspectRatio="none" fill="none">
                <path d="M1.5 1.5 L98.5 1.5 L98.5 84 L50 118.5 L1.5 84 Z"
                    stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
                <path d="M5 5 L95 5 L95 81 L50 113 L5 81 Z"
                    stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75" />
            </svg>
            <span className="relative z-10 text-[9px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.armorClassTop")}</span>
            <span className="relative z-10 text-3xl font-black leading-tight">{value}</span>
            <span className="relative z-10 text-[9px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.armorClassBottom")}</span>
        </button>
    );
}

/* ── Initiative (hexágono) ── */
function InitiativeCard({ dexterity, onRoll }: { dexterity: number; onRoll: () => void }) {
    const mod = Math.floor((dexterity - 10) / 2);
    const modStr = mod >= 0 ? `+${mod}` : String(mod);

    return (
        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-2">
            <button
                onClick={onRoll}
                className="relative flex items-center justify-center bg-base-200 w-20 h-20 text-base-content hover:brightness-110 active:scale-95 transition cursor-pointer"
                style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
                    <path d="M25.5 1.5 L74.5 1.5 L98.5 50 L74.5 98.5 L25.5 98.5 L1.5 50 Z"
                        stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
                    <path d="M27 5 L73 5 L95 50 L73 95 L27 95 L5 50 Z"
                        stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75" />
                </svg>
                <span className="relative z-10 text-2xl font-black">{modStr}</span>
            </button>
            <span className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.initiative")}</span>
        </div>
    );
}

/* ── Hit Points ── */
function HitPointsCard({ hpCurrent, hpMax, onChangeCurrent, onChangeMax, onRefresh }: {
    hpCurrent: number; hpMax: number;
    onChangeCurrent: (v: number) => void; onChangeMax: (v: number) => void;
    onRefresh: () => void;
}) {
    const [curInput, setCurInput] = useState(String(hpCurrent));
    const [maxInput, setMaxInput] = useState(String(hpMax));
    const [spinning, setSpinning] = useState(false);
    useEffect(() => setCurInput(String(hpCurrent)), [hpCurrent]);
    useEffect(() => setMaxInput(String(hpMax)), [hpMax]);

    const pct = hpMax > 0 ? Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100)) : 0;

    function handleRefresh() {
        setSpinning(true);
        onRefresh();
        setTimeout(() => setSpinning(false), 600);
    }

    return (
        <div className="rounded-lg bg-base-200 px-3 py-2 flex flex-col items-center gap-1 flex-1">
            <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.hitPoints")}</span>
                <button
                    onClick={handleRefresh}
                    title={t("characterSheet.restoreHp")}
                    className="text-base-content/50 hover:text-success active:scale-90 transition-all"
                >
                    <FiRefreshCw className={`text-sm ${spinning ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="flex items-center gap-0.5 text-2xl font-black">
                <input
                    type="number"
                    value={curInput}
                    onChange={(e) => { setCurInput(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) onChangeCurrent(v); }}
                    onBlur={() => { if (isNaN(parseInt(curInput)) || parseInt(curInput) < 0) setCurInput(String(hpCurrent)); }}
                    className="w-12 bg-transparent text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="opacity-40 text-xl">/</span>
                <input
                    type="number"
                    value={maxInput}
                    onChange={(e) => { setMaxInput(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) onChangeMax(v); }}
                    onBlur={() => { if (isNaN(parseInt(maxInput)) || parseInt(maxInput) < 0) setMaxInput(String(hpMax)); }}
                    className="w-12 bg-transparent text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </div>
            <div className="w-full h-1 rounded-full bg-base-300">
                <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ── Section principal ── */
interface CombatStatsSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onBattleInitiative?: () => void;
}

export function CombatStatsSection({ player, setPlayer, diceBoardRef, timeoutDiceBoardRef, onBattleInitiative }: CombatStatsSectionProps) {
    async function sync(p: GetPlayerResponse) {
        await APIPlayer.update(p.id, { playerSheet: p.playerSheet ?? {} });
    }

    function update(patch: Partial<NonNullable<GetPlayerResponse["playerSheet"]>>) {
        if (!player) return;
        const next = { ...player, playerSheet: { ...player.playerSheet, ...patch } };
        setPlayer(next);
        sync(next);
    }

    const sheet = player?.playerSheet;
    const dex = sheet?.abilityScores?.dexterity ?? 10;
    const dexMod = Math.floor((dex - 10) / 2);
    const ac = 10 + dexMod;
    const hpCurrent = sheet?.hpCurrent ?? 0;
    const hpMax = sheet?.hpMax ?? 0;
    const level = sheet?.totalPoints ?? 1;
    const proficiencyBonus = Math.floor((Math.max(1, level) - 1) / 4) + 2;

    function rollAC() {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            const label = t("characterSheet.armorClass");
            dispatchRoll({ label, diceRolled: roll, modifier: 0, total: roll, diceCommand: "1d20" });
            if (player?.id) {
                APIGameLog.create(player.id, {
                    rollType: "abilityCheck",
                    abilityKey: "armorClass",
                    diceRolled: roll,
                    modifier: 0,
                    total: roll,
                    diceCommand: "1d20",
                }).catch(() => {});
            }
        });
    }

    function rollInitiative() {
        const modStr = dexMod >= 0 ? `+${dexMod}` : String(dexMod);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            const total = roll + dexMod;
            const label = t("characterSheet.initiative");
            const diceCommand = dexMod === 0 ? "1d20" : dexMod > 0 ? `1d20+${dexMod}` : `1d20${dexMod}`;
            dispatchRoll({ label, diceRolled: roll, modifier: dexMod, total, diceCommand });
            if (player?.id) {
                APIGameLog.create(player.id, {
                    rollType: "abilityCheck",
                    abilityKey: "initiative",
                    diceRolled: roll,
                    modifier: dexMod,
                    total,
                    diceCommand,
                }).catch(() => {});
            }
        });
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex gap-4 items-start">
            {/* Esquerda: CA + Iniciativa */}
            <div className="flex gap-3 items-start shrink-0">
                <div className="mt-2"><ArmorClassCard value={ac} onRoll={rollAC} /></div>
                <InitiativeCard
                    dexterity={dex}
                    onRoll={onBattleInitiative && player?.fightInfo?.canRollInitiative ? onBattleInitiative : rollInitiative}
                />
            </div>

            {/* Direita: HP */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                <HitPointsCard
                    hpCurrent={hpCurrent}
                    hpMax={hpMax}
                    onChangeCurrent={(v) => update({ hpCurrent: v })}
                    onChangeMax={(v) => update({ hpMax: v })}
                    onRefresh={() => update({ hpCurrent: hpMax })}
                />
                <div className="rounded-lg bg-base-200 px-3 py-2 flex items-center justify-between">
                    <span className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.proficiencyBonus")}</span>
                    <span className="text-xl font-black">+{proficiencyBonus}</span>
                </div>
            </div>
        </div>
    );
}
