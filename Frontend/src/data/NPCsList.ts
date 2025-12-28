import { type NPCInfo } from "../api/ResponseModel";

export const NPCsList: NPCInfo[] = [
    {
        id: "sophie",
        name: "Sophie",
        power: 1,
        hability: 1,
        resistance: 1
    }
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
//         attackList: [{
//             type: "basic",
//             statusList: [
//                 {
//                     type: "Frozen",
//                     ammount: 3
//                 }
//             ]
//         },
//         {
//             type: "gradient",
//             statusList: [
//                 {
//                     type: "Burning",
//                     ammount: 3,
//                     remainingTurns: 2
//                 }
//             ]
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