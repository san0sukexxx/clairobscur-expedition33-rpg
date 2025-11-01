export function getBattleStatusLabel(status: string): string {
    switch (status) {
        case "starting":
            return "Aguardando início";
        case "started":
            return "Em andamento";
        case "finished":
            return "Terminada";
        default:
            return status;
    }
}
