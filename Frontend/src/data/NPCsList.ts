import { type NPCInfo } from "../api/ResponseModel";

export const NPCsList: NPCInfo[] = [
    {
        id: "sophie",
        name: "Sophie",
        power: 1,
        hability: 0,
        resistance: 0
    },
    {
        id: "punch-bag",
        name: "Sado de pancada",
        power: 0,
        hability: 0,
        resistance: 2
    },
    {
        id: "mime",
        name: "Mímico",
        power: 2,
        hability: 1,
        resistance: 1,
        initiativeBonus: 999,
        maxLifeBonus: 10,
        attackList: [
            {
                type: "skill",
                name: "Combo Marteladas",
                additionalDamage: 3,
                quantity: 4,
                statusList: [
                    {
                        ammount: 1,
                        remainingTurns: 1,
                        type: "Silenced"
                    }
                ]
            },
            {
                type: "skill",
                name: "Combo Tapas",
                quantity: 3
            }
        ],
        skillList: [
            {
                type: "give-status",
                statusList: [
                    {
                        ammount: 10,
                        type: "invisible-barrier"
                    }
                ]
            },
        ]
    },
    {
        id: "lancer",
        name: "Lanceiro",
        power: 2,
        hability: 1,
        resistance: 2,
        freeShotWeakPoints: 1
    },
    {
        id: "gatekeeper",
        name: "Porteiro",
        power: 1,
        hability: 1,
        resistance: 4,
        freeShotWeakPoints: 1,
        weakTo: "Ice",
        attackList: [
            {
                type: "jump-all",
                additionalDamage: 3,
                additionalDices: 1
            }
        ]
    },
];

// Exemplo de como usar
// export const NPCsList: NPCInfo[] = [
//     {
//         id: "grosse-tete",
//         name: "Grosse Tete",
//         power: 1,
//         hability: 2,
//         resistance: 3,
//         isFlying: true
//     },
//     {
//         id: "golem",
//         name: "Golem",
//         power: 8,
//         hability: 3,
//         resistance: 3,
//         weakTo: "Fire",
//         freeShotWeakPoints: 2,
//         initiativeBonus: 5,  // +5 flat bonus to initiative rolls
//         maxLifeBonus: 20,  // +20 flat bonus to max HP (3*5 + 20 = 35 HP)
//         attackList: [{
//             type: "basic",
//             name: "Golpe Duplo",  // Custom name (overrides "Ataque básico")
//             quantity: 2,  // Will attack 2 times in sequence
//             additionalDamage: 5,  // +5 flat damage per attack
//             additionalDices: 2,  // Roll 3d6 instead of 1d6
//             statusList: [  // Optional - can be omitted if no status effects
//                 {
//                     type: "Frozen",
//                     ammount: 3
//                 }
//             ]
//         },
//         {
//             type: "gradient",
//             name: "Chamas Graduais",  // Custom name (overrides "Gradiente")
//             quantity: 1,  // Will attack 1 time (default if not specified)
//             additionalDamage: 3  // +3 flat damage
//             // statusList omitted - attack has no status effects
//         },
//         {
//             type: "basic",
//             name: "Soco Rápido",  // Simple attack with no bonuses
//             // All properties are optional except 'type'
//         }],
//         skillList: [
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 3,
//                         type: "Shielded"
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Hastened",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Slowed",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Empowered",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Weakened",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Protected",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Unprotected",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Regeneration",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Cursed",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Stunned",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 5,
//                         type: "Confused",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Entangled",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Exhausted",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 3,
//                         type: "Frenzy",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Rage",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 3,
//                         type: "Burning",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 4,
//                         type: "Frozen",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Inverted",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Marked"
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 3,
//                         type: "Plagued"
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Silenced",
//                         remainingTurns: 2
//                     }
//                 ]
//             },
//             {
//                 type: "give-status",
//                 statusList: [
//                     {
//                         ammount: 1,
//                         type: "Dizzy",
//                         remainingTurns: 2
//                     }
//                 ]
//             }
//         ]
//     },
// ];