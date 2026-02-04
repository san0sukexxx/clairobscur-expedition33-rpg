import type { GetPlayerResponse } from "../api/APIPlayer";
import { rollWithTimeout } from "./RollUtils";

export type AttributeTestType = "hability" | "power" | "resistance";

export interface AttributeTestResult {
    roll: number;           // Valor do d6
    attribute: number;      // Valor do atributo
    total: number;          // roll + attribute
    dc: number;             // Dificuldade (CD)
    success: boolean;       // total > dc
}

/**
 * Realiza um teste de atributo
 * Rola 1d6 + atributo e compara com o CD
 * Sucesso se total > CD
 */
export function performAttributeTest(
    diceBoardRef: React.RefObject<any>,
    timeoutDiceBoardRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    player: GetPlayerResponse | null,
    testType: AttributeTestType,
    dc: number,
    callback: (result: AttributeTestResult) => void
): void {
    const attribute = getAttributeValue(player, testType);

    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", (diceResult) => {
        const roll = diceResult?.[0]?.rolls?.[0]?.value ?? 0;
        const total = roll + attribute;
        const success = total > dc;

        callback({
            roll,
            attribute,
            total,
            dc,
            success
        });
    });
}

/**
 * Realiza múltiplos testes de atributo sequencialmente
 * Retorna array com todos os resultados via callback
 */
export function performMultipleAttributeTests(
    diceBoardRef: React.RefObject<any>,
    timeoutDiceBoardRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    player: GetPlayerResponse | null,
    testType: AttributeTestType,
    dc: number,
    count: number,
    callback: (results: AttributeTestResult[]) => void
): void {
    const results: AttributeTestResult[] = [];
    let completed = 0;

    const runNextTest = () => {
        if (completed >= count) {
            callback(results);
            return;
        }

        performAttributeTest(
            diceBoardRef,
            timeoutDiceBoardRef,
            player,
            testType,
            dc,
            (result) => {
                results.push(result);
                completed++;
                runNextTest();
            }
        );
    };

    runNextTest();
}

/**
 * Conta quantos sucessos em uma série de testes
 */
export function countSuccesses(results: AttributeTestResult[]): number {
    return results.filter(r => r.success).length;
}

/**
 * Obtém o valor do atributo do jogador
 */
export function getAttributeValue(
    player: GetPlayerResponse | null,
    testType: AttributeTestType
): number {
    if (!player?.playerSheet) return 0;

    switch (testType) {
        case "hability":
            return player.playerSheet.hability ?? 0;
        case "power":
            return player.playerSheet.power ?? 0;
        case "resistance":
            return player.playerSheet.resistance ?? 0;
        default:
            return 0;
    }
}

/**
 * Retorna o nome traduzido do tipo de teste
 */
export function getAttributeTestLabel(testType: AttributeTestType): string {
    switch (testType) {
        case "hability":
            return "Habilidade";
        case "power":
            return "Poder";
        case "resistance":
            return "Resistência";
        default:
            return testType;
    }
}
