import type { LocationInfo } from "../api/ResponseModel";
import { LocationsList } from "../data/LocationsList";
import { getLocationName } from "../i18n";

export function getLocationById(id: string): LocationInfo | undefined {
    return LocationsList.find(
        (loc) => loc.id.toLowerCase() === id.toLowerCase()
    );
}

export function getAllLocationsSorted(): LocationInfo[] {
    return [...LocationsList].sort((a, b) =>
        getLocationName(a.id).localeCompare(getLocationName(b.id), "pt-BR")
    );
}
