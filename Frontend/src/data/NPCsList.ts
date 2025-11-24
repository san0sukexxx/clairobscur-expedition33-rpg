import { type NPCInfo } from "../api/ResponseModel";

export const NPCsList: NPCInfo[] = [
    {
        id: "grosse-tete",
        name: "Grosse Tete",
        power: 1,
        hability: 2,
        resistance: 3
    },
    {
        id: "golem",
        name: "Golem",
        power: 1,
        hability: 1,
        resistance: 3,
        weakTo: "Fire"
    },
];

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