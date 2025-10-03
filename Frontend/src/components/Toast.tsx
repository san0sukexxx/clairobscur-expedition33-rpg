// toast-queue.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastOptions = {
  duration?: number; // ms
};

type Enqueue = (message: string, opts?: ToastOptions) => void;

type ToastItem = {
  id: number;
  message: string;
  duration: number;
};

const ToastQueueContext = createContext<Enqueue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const idRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enqueue: Enqueue = useCallback((message, opts) => {
    const item: ToastItem = {
      id: idRef.current++,
      message,
      duration: opts?.duration ?? 1500,
    };
    setQueue((q) => [...q, item]);
  }, []);

  // Avança a fila quando não há toast ativo
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [current, queue]);

  // Controla auto-close do toast atual
  useEffect(() => {
    if (!current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrent(null), current.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  return (
    <ToastQueueContext.Provider value={enqueue}>
      {children}
      {/* Renderer */}
      {current && (
        <div className="toast-container">
          <div className="toast-message" key={current.id}>
            {current.message}
          </div>
        </div>
      )}
    </ToastQueueContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastQueueContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  }
  return { showToast: ctx };
}
