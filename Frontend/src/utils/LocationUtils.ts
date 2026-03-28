import type { LocationInfo } from "../api/ResponseModel";
import { LocationsList, MainStoryLocationIds } from "../data/LocationsList";
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

/** Returns main story locations in story progression order. */
export function getMainStoryLocations(): LocationInfo[] {
    const byId = new Map(LocationsList.map((loc) => [loc.id, loc]));
    return MainStoryLocationIds.map((id) => byId.get(id)).filter((loc): loc is LocationInfo => loc != null);
}
