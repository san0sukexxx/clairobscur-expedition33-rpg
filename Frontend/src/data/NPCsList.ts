import { type NPCInfo } from "../api/ResponseModel";

export const NPCsList: NPCInfo[] = [
    {
        id: "grosse-tete",
        name: "Grosse Tete",
        power: 1,
        hability: 2,
        resistance: 3,
        isFlying: true
    },
    {
        id: "golem",
        name: "Golem",
        power: 8,
        hability: 3,
        resistance: 3,
        weakTo: "Fire",
        freeShotWeakPoints: 2,
        attackList: [{
            type: "basic",
            statusList: [
                {
                    type: "Frozen",
                    ammount: 3
                }
            ]
        },
        {
            type: "gradient",
            statusList: [
                {
                    type: "Burning",
                    ammount: 3,
                    remainingTurns: 2
                }
            ]
        }],
        skillList: [
            {
                type: "give-status",
                statusList: [
                    {
                        ammount: 3,
                        type: "Shielded"
                    }
                ]
            }
        ]
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