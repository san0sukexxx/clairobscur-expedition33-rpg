import type { EncounterNpcDto, EncounterRewardDto } from "../api/APIEncounter";

export interface StoryEncounter {
    id: string;
    name: string;
    locationId: string;
    npcs: EncounterNpcDto[];
    rewards: EncounterRewardDto[];
    bonusXp: number;
    playerCharacterIds?: string[];
}

export const StoryEncountersList: StoryEncounter[] = [
    {
        id: "lumiere-mime",
        name: "storyEncounters.lumiere-mime",
        locationId: "lumiere",
        npcs: [{ npcId: "mime", quantity: 1 }],
        rewards: [],
        bonusXp: 0,
    },
    {
        id: "lumiere-maelle",
        name: "storyEncounters.lumiere-maelle",
        locationId: "lumiere",
        npcs: [],
        rewards: [],
        bonusXp: 0,
        playerCharacterIds: ["maelle"],
    },
    {
        id: "spring-meadows-portier",
        name: "storyEncounters.spring-meadows-portier",
        locationId: "spring-meadows",
        npcs: [{ npcId: "portier", quantity: 1 }],
        rewards: [{ rewardType: "picto", itemId: "dodger", level: 1 }],
        bonusXp: 0,
    },
    {
        id: "spring-meadows-abandoned-building",
        name: "storyEncounters.spring-meadows-abandoned-building",
        locationId: "spring-meadows",
        npcs: [{ npcId: "lancer", quantity: 2 }],
        rewards: [{ rewardType: "weapon", itemId: "lanceram" }],
        bonusXp: 0,
    },
    {
        id: "spring-meadows-chromatic-lancelier",
        name: "storyEncounters.spring-meadows-chromatic-lancelier",
        locationId: "spring-meadows",
        npcs: [{ npcId: "chromatic-lancelier", quantity: 1 }],
        rewards: [{ rewardType: "picto", itemId: "augmented-attack", level: 1 }],
        bonusXp: 0,
    },
    {
        id: "spring-meadows-abbests",
        name: "storyEncounters.spring-meadows-abbests",
        locationId: "spring-meadows",
        npcs: [{ npcId: "abbest", quantity: 2 }],
        rewards: [{ rewardType: "weapon", itemId: "lighterim" }],
        bonusXp: 0,
    },
    {
        id: "spring-meadows-eveque",
        name: "storyEncounters.spring-meadows-eveque",
        locationId: "spring-meadows",
        npcs: [{ npcId: "eveque", quantity: 1 }],
        rewards: [{ rewardType: "picto", itemId: "cleansing-tint" }],
        bonusXp: 0,
    },
    {
        id: "flying-waters-brulers",
        name: "storyEncounters.flying-waters-brulers",
        locationId: "flying-waters",
        npcs: [{ npcId: "bruler", quantity: 2 }],
        rewards: [{ rewardType: "weapon", itemId: "brulerum" }],
        bonusXp: 0,
    },
    {
        id: "flying-waters-blacksmith",
        name: "storyEncounters.flying-waters-blacksmith",
        locationId: "flying-waters",
        npcs: [{ npcId: "bruler", quantity: 1 }, { npcId: "cruler", quantity: 1 }],
        rewards: [{ rewardType: "weapon", itemId: "cruciferam" }],
        bonusXp: 0,
    },
    {
        id: "flying-waters-bourgeon",
        name: "storyEncounters.flying-waters-bourgeon",
        locationId: "flying-waters",
        npcs: [{ npcId: "bourgeon", quantity: 1 }],
        rewards: [{ rewardType: "picto", itemId: "augmented-counter-i", level: 1 }],
        bonusXp: 0,
    },
    {
        id: "flying-waters-chromatic-troubadour",
        name: "storyEncounters.flying-waters-chromatic-troubadour",
        locationId: "flying-waters",
        npcs: [{ npcId: "chromatic-troubadour", quantity: 1 }],
        rewards: [{ rewardType: "weapon", itemId: "troubadim" }],
        bonusXp: 0,
    },
    {
        id: "ancient-sanctuary-robust-sakapatate",
        name: "storyEncounters.ancient-sanctuary-robust-sakapatate",
        locationId: "ancient-sanctuary",
        npcs: [{ npcId: "robust-sakapatate", quantity: 1 }],
        rewards: [{ rewardType: "weapon", itemId: "sakaram" }],
        bonusXp: 0,
    },
    {
        id: "ancient-sanctuary-ranger-catapult-sakapatate",
        name: "storyEncounters.ancient-sanctuary-ranger-catapult-sakapatate",
        locationId: "ancient-sanctuary",
        npcs: [{ npcId: "ranger-sakapatate", quantity: 1 }, { npcId: "catapult-sakapatate", quantity: 1 }],
        rewards: [{ rewardType: "weapon", itemId: "trebuchim" }],
        bonusXp: 0,
    },
];
