import type { EncounterNpcDto, EncounterRewardDto } from "../api/APIEncounter";

export interface StoryEncounter {
    id: string;
    locationId: string;
    npcs: EncounterNpcDto[];
    rewards: EncounterRewardDto[];
    bonusXp: number;
}

export const StoryEncountersList: StoryEncounter[] = [
];
