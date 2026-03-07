import type { EncounterNpcDto, EncounterRewardDto } from "../api/APIEncounter";

export interface StoryEncounter {
    id: string;
    name: string;
    locationId: string;
    npcs: EncounterNpcDto[];
    rewards: EncounterRewardDto[];
    bonusXp: number;
}

export const StoryEncountersList: StoryEncounter[] = [
    {
        id: "lumiere-mime",
        name: "storyEncounters.lumiere-mime",
        locationId: "lumiere",
        npcs: [{ npcId: "mime", quantity: 1 }],
        rewards: [],
        bonusXp: 50,
    },
    {
        id: "spring-meadows-lancer",
        name: "storyEncounters.spring-meadows-lancer",
        locationId: "spring-meadows",
        npcs: [{ npcId: "lancer", quantity: 1 }],
        rewards: [],
        bonusXp: 0,
    },
    {
        id: "spring-meadows-portier",
        name: "storyEncounters.spring-meadows-portier",
        locationId: "spring-meadows",
        npcs: [{ npcId: "gatekeeper", quantity: 1 }],
        rewards: [{ rewardType: "picto", itemId: "dodger", level: 1 }],
        bonusXp: 0,
    },
];
