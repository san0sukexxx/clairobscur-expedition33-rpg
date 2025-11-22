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
