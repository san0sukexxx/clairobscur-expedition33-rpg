import { useState, useCallback, useRef, type RefObject, type MutableRefObject } from "react";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";
import { dispatchRoll } from "../utils/rollDispatcher";
import { t } from "../i18n";

interface FloatingDiceRollerProps {
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

const DICE = ["d20", "d12", "d10", "d100", "d8", "d6", "d4"] as const;
type Die = (typeof DICE)[number];

export function FloatingDiceRoller({ diceBoardRef, timeoutDiceBoardRef }: FloatingDiceRollerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) setSelected({});
      return !prev;
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelected({});
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
  }, [selected, diceBoardRef, timeoutDiceBoardRef]);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-center gap-2">
      {/* Expanded panel */}
      <div
        className={`flex flex-col items-center gap-2 transition-all duration-300 origin-bottom ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        {DICE.map((die) => {
          const count = selected[die] ?? 0;
          return (
            <div key={die} className="relative flex flex-col items-center">
              <button
                className="w-14 h-14 bg-base-300 rounded-full flex items-center justify-center shadow-lg select-none touch-none active:scale-90 transition-transform"
                onPointerDown={() => handlePointerDown(die)}
                onPointerUp={() => handlePointerUp(die)}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img
                  src={`/dice_icons/${die}.svg`}
                  alt={die}
                  className="w-8 h-8 brightness-0 invert"
                  draggable={false}
                />
              </button>
              <span className="text-[10px] font-bold opacity-60 uppercase mt-0.5">
                {die}
              </span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-info text-info-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {count}
                </span>
              )}
            </div>
          );
        })}

        {/* ROLL button */}
        {totalSelected > 0 && (
          <button
            className="px-6 py-2 bg-info text-info-content font-bold rounded-full shadow-lg active:scale-95 transition-transform"
            onClick={handleRoll}
          >
            ROLL
          </button>
        )}

        {/* Close button */}
        <button
          className="w-10 h-10 rounded-full border-2 border-info flex items-center justify-center shadow bg-base-100 active:scale-90 transition-transform"
          onClick={handleClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* FAB button (collapsed) */}
      {!open && (
        <button
          className="w-14 h-14 bg-info text-info-content rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          onClick={handleToggle}
        >
          <img
            src="/dice_icons/d20.svg"
            alt="Roll dice"
            className="w-8 h-8 brightness-0 invert"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
}
