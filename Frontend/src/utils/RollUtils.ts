export function rollWithTimeout(
    diceBoardRef: React.RefObject<any>,
    timeoutDiceBoardRef: React.RefObject<number | null>,
    command: string,
    callback: (result: any) => void
) {
    diceBoardRef.current?.roll(command, (result: any) => {
        callback(result)

        if (timeoutDiceBoardRef.current) {
            clearTimeout(timeoutDiceBoardRef.current)
            timeoutDiceBoardRef.current = null
        }

        timeoutDiceBoardRef.current = window.setTimeout(() => {
            diceBoardRef.current?.hideBoard()
            timeoutDiceBoardRef.current = null
        }, 5000)
    })
}
