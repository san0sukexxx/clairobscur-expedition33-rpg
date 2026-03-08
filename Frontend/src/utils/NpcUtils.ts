import type { NPCInfo } from "../api/ResponseModel";
import { NPCsList } from "../data/NPCsList";

export function getNpcById(id: string): NPCInfo | undefined {
    return NPCsList.find(
        (enemy) => enemy.id.toLowerCase() === id.toLowerCase()
    );
}

export function getAllNPCsSorted(): NPCInfo[] {
    return [...NPCsList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}

/**
 * Handles NPC image load errors with fallback chain:
 * 1. Try .jpg instead of .png
 * 2. For chromatic variants, try base enemy .png then .jpg
 * 3. If all fail, hide img and reveal the next sibling fallback icon.
 */
export function handleNpcImgError(e: { currentTarget: HTMLImageElement }, npcId: string) {
    const img = e.currentTarget;
    const step = img.dataset.imgStep ?? "0";

    const locationSuffixes = ["-monolith", "-visages", "-sirene", "-manor", "-battlefield", "-act3", "-flying-waters"];
    let baseId: string | null = null;
    if (npcId.startsWith("chromatic-")) {
        baseId = npcId.replace("chromatic-", "");
    } else {
        for (const suffix of locationSuffixes) {
            if (npcId.endsWith(suffix)) {
                baseId = npcId.slice(0, -suffix.length);
                break;
            }
        }
    }

    if (step === "0") {
        img.dataset.imgStep = "1";
        img.src = `/enemies/${npcId}.jpg`;
        return;
    }
    if (step === "1" && baseId) {
        img.dataset.imgStep = "2";
        img.src = `/enemies/${baseId}.png`;
        return;
    }
    if (step === "2" && baseId) {
        img.dataset.imgStep = "3";
        img.src = `/enemies/${baseId}.jpg`;
        return;
    }
    img.style.display = "none";
    (img.nextElementSibling as HTMLElement)?.classList.remove("hidden");
}