import type { EncounterNpcDto, EncounterRewardDto } from "../api/APIEncounter";

export interface StoryEncounter {
    id: string;
    locationId: string;
    npcs: EncounterNpcDto[];
    rewards: EncounterRewardDto[];
    bonusXp: number;
}

export const StoryEncountersList: StoryEncounter[] = [
    {
        id: "lumiere-mime",
        locationId: "lumiere",
        npcs: [{ npcId: "mime", quantity: 1 }],
        rewards: [],
        bonusXp: 50,
    },
    {
        id: "spring-meadows-lancer",
        locationId: "spring-meadows",
        npcs: [{ npcId: "lancer", quantity: 1 }],
        rewards: [],
        bonusXp: 0,
    },
];
