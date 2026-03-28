// useApiListRaw.ts
import { useEffect, useRef, useState } from "react";
import type React from "react";

export function useApiListRaw<T>(
    loader: () => Promise<T[]>,
    deps: React.DependencyList = []
) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);
    const hasLoaded = useRef(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            // Only show the loading spinner on the very first fetch
            if (!hasLoaded.current) setLoading(true);
            setError(null);
            try {
                const list = await loader();
                if (!alive) return;
                setItems(list ?? []);
                hasLoaded.current = true;
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Erro ao carregar dados.");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [...deps, tick]);

    const reload = () => setTick((x) => x + 1);

    return { items, setItems, loading, error, reload };
}
