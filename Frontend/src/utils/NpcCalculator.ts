import { type NPCInfo } from "../api/ResponseModel"

export function randomizeNpcInitiativeTotal(npc: NPCInfo) {
    const diceResult = Math.floor(Math.random() * 6) + 1
    console.log(diceResult);

    if (diceResult == 1) {
        return 1;
    }

    const criticalMulti = diceResult == 6 ? 2 : 1;

    return diceResult + (npc.hability * criticalMulti);
}

export function getNPCMaxHealth(npc: NPCInfo) {
    return npc.resistance * 5;
}
