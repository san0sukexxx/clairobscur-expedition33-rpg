import { type NPCInfo } from "../api/ResponseModel";

export const NPCsList: NPCInfo[] = [
    {
        id: "sophie",
        name: "Sophie",
        strength:     10,
        dexterity:    12,
        constitution: 10,
        intelligence: 14,
        wisdom:       13,
        charisma:     15,
    },
    {
        id: "punch-bag",
        name: "Saco de Pancada",
        strength:     16,
        dexterity:     6,
        constitution: 18,
        intelligence:  4,
        wisdom:        6,
        charisma:      4,
    },
    {
        id: "mime",
        name: "Mímico",
        strength:     14,
        dexterity:    16,
        constitution: 12,
        intelligence: 10,
        wisdom:        8,
        charisma:     13,
        initiativeBonus: 999,
        maxLifeBonus: 10,
        attackList: [
            {
                type: "skill",
                name: "Combo Marteladas",
                additionalDamage: 3,
                quantity: 4,
                statusList: [
                    { ammount: 1, remainingTurns: 1, type: "Silenced" }
                ]
            },
            {
                type: "skill",
                name: "Combo Tapas",
                quantity: 3,
            }
        ],
        reward: {
            type: "picto",
            itemId: "energy-master",
            level: 1
        }
    },
    {
        id: "lancer",
        name: "Lanceiro",
        strength:     16,
        dexterity:    12,
        constitution: 14,
        intelligence:  8,
        wisdom:       10,
        charisma:      9,
        freeShotWeakPoints: 1,
        weakTo: "Ice",
        reward: {
            type: "weapon",
            itemId: "Lanceram",
            level: 1
        }
    },
    {
        id: "gatekeeper",
        name: "Porteiro",
        strength:     18,
        dexterity:     8,
        constitution: 20,
        intelligence:  6,
        wisdom:        8,
        charisma:      7,
        freeShotWeakPoints: 1,
        weakTo: "Ice",
        attackList: [
            {
                type: "jump-all",
                additionalDamage: 3,
                additionalDices: 1,
            }
        ],
        reward: {
            type: "picto",
            itemId: "dodger",
            level: 1
        }
    },
];
