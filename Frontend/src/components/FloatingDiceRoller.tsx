import { useState, useCallback, useRef, type RefObject, type MutableRefObject } from "react";
import { FaUsers, FaUser, FaChevronDown } from "react-icons/fa";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";
import { dispatchRoll } from "../utils/rollDispatcher";
import { APIGameLog } from "../api/APIGameLog";
import { t } from "../i18n";

type SendTo = "everyone" | "self";

interface FloatingDiceRollerProps {
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  playerId?: number;
  className?: string;
}

const DICE = ["d20", "d12", "d10", "d100", "d8", "d6", "d4"] as const;
type Die = (typeof DICE)[number];

export function FloatingDiceRoller({ diceBoardRef, timeoutDiceBoardRef, playerId, className = "bottom-14 right-4" }: FloatingDiceRollerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [sendTo, setSendTo] = useState<SendTo>("everyone");
  const [showSendMenu, setShowSendMenu] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        setSelected({});
        setShowSendMenu(false);
      }
      return !prev;
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelected({});
    setShowSendMenu(false);
  }, []);

  const increment = useCallback((die: Die) => {
    setSelected((prev) => ({ ...prev, [die]: (prev[die] ?? 0) + 1 }));
  }, []);

  const resetDie = useCallback((die: Die) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[die];
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (die: Die) => {
      didLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        resetDie(die);
      }, 500);
    },
    [resetDie]
  );

  const handlePointerUp = useCallback(
    (die: Die) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (!didLongPress.current) {
        increment(die);
      }
    },
    [increment]
  );

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleRoll = useCallback(() => {
    const parts: string[] = [];
    for (const die of DICE) {
      const count = selected[die];
      if (count && count > 0) {
        parts.push(`${count}${die}`);
      }
    }
    if (parts.length === 0) return;

    const diceCommand = parts.join("+");
    if (!diceBoardRef.current) return;

    if (timeoutDiceBoardRef.current != null) {
      clearTimeout(timeoutDiceBoardRef.current);
      timeoutDiceBoardRef.current = null;
    }

    const currentSendTo = sendTo;

    diceBoardRef.current.roll(parts, (result) => {
      const total = diceTotal(result);
      const diceValues: number[] = [];
      for (const group of result) {
        if (Array.isArray(group.rolls)) {
          for (const roll of group.rolls) diceValues.push(roll.value);
        }
      }
      dispatchRoll({
        label: t("characterSheet.customRoll"),
        diceRolled: total,
        modifier: 0,
        total,
        diceCommand,
        diceValues,
      });

      if (currentSendTo === "everyone" && playerId) {
        APIGameLog.create(playerId, {
          rollType: "customRoll",
          abilityKey: diceValues.join("+"),
          diceRolled: total,
          modifier: 0,
          total,
          diceCommand,
        });
      }

      if (timeoutDiceBoardRef.current != null) {
        clearTimeout(timeoutDiceBoardRef.current);
      }
      timeoutDiceBoardRef.current = window.setTimeout(() => {
        diceBoardRef.current?.hideBoard();
        timeoutDiceBoardRef.current = null;
      }, 5000);
    });

    setSelected({});
    setOpen(false);
    setShowSendMenu(false);
  }, [selected, diceBoardRef, timeoutDiceBoardRef, sendTo, playerId]);

  return (
    <div className={`fixed z-[43] flex flex-col items-end gap-1.5 transition-all duration-300 ${className}`}>
      {/* Expanded panel */}
      <div
        className={`flex flex-col items-end gap-1.5 transition-all duration-300 origin-bottom ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        {DICE.map((die) => {
          const count = selected[die] ?? 0;
          return (
            <div key={die} className="relative">
              <button
                className="w-12 h-12 bg-neutral text-neutral-content rounded-full flex flex-col items-center justify-center shadow-md select-none touch-none active:scale-90 transition-transform"
                onPointerDown={() => handlePointerDown(die)}
                onPointerUp={() => handlePointerUp(die)}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={`/dice_icons/${die}.svg`}
                  alt={die}
                  className="w-6 h-6 brightness-0 invert"
                  draggable={false}
                />
                <span className="text-[7px] font-bold opacity-60 uppercase leading-none">{die}</span>
              </button>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-info text-info-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {count}
                </span>
              )}
            </div>
          );
        })}

        {/* Bottom row: Send menu + ROLL + Close */}
        <div className="flex items-center gap-1.5 mt-1 relative">
          {/* Send-to popover */}
          {showSendMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-base-300 rounded-lg shadow-xl border border-base-content/10 py-2 px-1 min-w-36">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider px-2 mb-1">
                {t("characterSheet.sendToEveryone").replace(/.*/, "SEND TO:")}
              </p>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-base-200 transition-colors"
                onClick={() => { setSendTo("everyone"); setShowSendMenu(false); }}
              >
                <FaUsers className="text-sm opacity-70" />
                <span className="text-sm">{t("characterSheet.sendToEveryone")}</span>
                {sendTo === "everyone" && <span className="ml-auto text-info">✓</span>}
              </button>
              <button
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-base-200 transition-colors"
                onClick={() => { setSendTo("self"); setShowSendMenu(false); }}
              >
                <FaUser className="text-sm opacity-70" />
                <span className="text-sm">{t("characterSheet.sendToSelf")}</span>
                {sendTo === "self" && <span className="ml-auto text-info">✓</span>}
              </button>
            </div>
          )}

          {totalSelected > 0 && (
            <div className="flex items-center bg-info rounded-full shadow-lg overflow-hidden">
              <button
                className="flex items-center justify-center px-2 py-2 text-info-content/70 hover:text-info-content active:scale-90 transition-all"
                onClick={() => setShowSendMenu((p) => !p)}
              >
                <FaChevronDown
                  size={10}
                  className={`transition-transform duration-200 ${showSendMenu ? "" : "rotate-180"}`}
                />
              </button>
              <button
                className="px-3 py-2 text-info-content text-sm font-bold border-l border-info-content/30 active:scale-95 transition-transform"
                onClick={handleRoll}
              >
                {t("characterSheet.rollButton")}
              </button>
            </div>
          )}
          <button
            className="w-12 h-12 rounded-full border-2 border-info flex items-center justify-center shadow bg-base-100 active:scale-90 transition-transform"
            onClick={handleClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* FAB button (collapsed) */}
      {!open && (
        <button
          className="btn btn-info btn-circle w-11 h-11 min-h-0 shadow-lg active:scale-90 transition-transform"
          onClick={handleToggle}
        >
          <img
            src="/dice_icons/d20.svg"
            alt="Roll dice"
            className="w-6 h-6 brightness-0 invert"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
}
