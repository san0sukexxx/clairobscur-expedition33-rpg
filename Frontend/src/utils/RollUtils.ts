export function rollWithTimeout(
    diceBoardRef: React.RefObject<any>,
    timeoutDiceBoardRef: React.RefObject<number | null>,
    command: string,
    callback: (result: any) => void
) {
    if (!diceBoardRef.current) return

    if (timeoutDiceBoardRef.current != null) {
        clearTimeout(timeoutDiceBoardRef.current)
        timeoutDiceBoardRef.current = null
    }

    diceBoardRef.current.roll(command, (result: any) => {
        callback(result)

        if (timeoutDiceBoardRef.current != null) {
            clearTimeout(timeoutDiceBoardRef.current)
        }

        timeoutDiceBoardRef.current = window.setTimeout(() => {
            diceBoardRef.current?.hideBoard()
            timeoutDiceBoardRef.current = null
        }, 5000)
    })
}

export type DiceRollResult = {
    rolls: number[]
    total: number
    criticals: number
    failures: number
}

export function rollD6(count: number): DiceRollResult {
    const rolls: number[] = []

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 6) + 1
        rolls.push(roll)
    }

    const sixes = rolls.filter(r => r === 6).length
    const ones = rolls.filter(r => r === 1).length

    return {
        rolls,
        total: rolls.reduce((a, b) => a + b, 0),
        criticals: Math.max(0, sixes - ones),
        failures: Math.max(0, ones - sixes),
    }
}