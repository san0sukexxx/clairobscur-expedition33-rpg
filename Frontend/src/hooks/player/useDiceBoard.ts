import { useRef, useCallback } from "react";
import type { DiceBoardRef } from "../../components/DiceBoard";
import type { UseDiceBoardReturn } from "../../pages/PlayerPage/PlayerPage.types";

/**
 * Hook to manage DiceBoard ref and timeout
 */
export function useDiceBoard(): UseDiceBoardReturn {
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDiceTimeout = useCallback(() => {
    if (timeoutDiceBoardRef.current) {
      diceBoardRef.current?.hideBoard();
      clearTimeout(timeoutDiceBoardRef.current);
      timeoutDiceBoardRef.current = null;
    }
  }, []);

  return {
    diceBoardRef,
    timeoutDiceBoardRef,
    clearDiceTimeout
  };
}
