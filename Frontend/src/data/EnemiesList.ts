import { type BattleCharacterInfo } from "../api/ResponseModel";

export const EnemiesList: BattleCharacterInfo[] = [
    {
        battleID: 0,
        id: "grosse-tete",
        name: "Grosse Tete",
        healthPoints: 45,
        maxHealthPoints: 45,
        magicPoints: 10,
        maxMagicPoints: 10,
        status: [],
        type: "npc",
        isEnemy: true,
        npcInfo: {
            power: 1,
            hability: 2,
            resistance: 3
        }
    },
    {
        battleID: 0,
        id: "golem",
        name: "Golem",
        healthPoints: 120,
        maxHealthPoints: 120,
        magicPoints: 30,
        maxMagicPoints: 30,
        status: [],
        type: "npc",
        isEnemy: true,
        npcInfo: {
            power: 1,
            hability: 1,
            resistance: 3
        }
    },
];

export function getEnemyById(id: string): BattleCharacterInfo | undefined {
    return EnemiesList.find(
        (enemy) => enemy.id.toLowerCase() === id.toLowerCase()
    );
} 

export function getAllEnemiesSorted(): BattleCharacterInfo[] {
    return [...EnemiesList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}