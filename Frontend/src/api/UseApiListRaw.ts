// useApiListRaw.ts
import { useEffect, useState } from "react";
import type React from "react";

export function useApiListRaw<T>(
    loader: () => Promise<T[]>,
    deps: React.DependencyList = []
) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const list = await loader();
                if (!alive) return;
                setItems(list ?? []);
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
