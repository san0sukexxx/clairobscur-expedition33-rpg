import React from "react";

/**
 * Mapeamento de manchas para suas imagens correspondentes
 */
const STAIN_IMAGES: Record<string, string> = {
    "Raio": "/stains/lightning-stain.png",      // Amarelo
    "Lightning": "/stains/lightning-stain.png",
    "Terra": "/stains/earth-stain.png",         // Verde
    "Earth": "/stains/earth-stain.png",
    "Fogo": "/stains/fire-stain.png",           // Vermelho
    "Fire": "/stains/fire-stain.png",
    "Gelo": "/stains/ice-stain.png",            // Azul
    "Ice": "/stains/ice-stain.png",
    "Luz": "/stains/light-stain.png",           // Coringa
    "Light": "/stains/light-stain.png"
};

/**
 * Substitui texto "Mancha de X" e nomes de elementos completamente por imagens
 * @param text Texto da descrição da habilidade
 * @returns Array de React nodes com texto e imagens
 */
export function renderStainText(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];

    // Regex para capturar padrões como:
    // - "Mancha de Raio" ou "Mancha de Lightning"
    // - "1 Mancha de Gelo"
    // - "2 Manchas de Fogo"
    // - Palavras isoladas: "Gelo", "Fogo", "Raio", "Terra", "Luz" (word boundary)
    // - EXCETO quando precedido por "de " (para evitar "dano de Fogo")
    const stainPattern = /(\d+\s+)?Manchas?\s+de\s+(Raio|Lightning|Terra|Earth|Fogo|Fire|Gelo|Ice|Luz|Light)|(?<!de )\b(Raio|Lightning|Terra|Earth|Fogo|Fire|Gelo|Ice|Luz|Light)\b/gi;

    let lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = stainPattern.exec(text)) !== null) {
        const matchIndex = match.index; // Store for type safety

        // Adiciona o texto antes do match
        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }

        const fullMatch = match[0];
        const count = match[1]?.trim(); // "1 " ou "2 " ou undefined
        const stainNameWithPrefix = match[2]; // "Raio" quando tem "Mancha de"
        const stainNameAlone = match[3]; // "Raio" quando está sozinho
        const stainName = stainNameWithPrefix || stainNameAlone;
        const imagePath = STAIN_IMAGES[stainName];

        if (imagePath) {
            // Se houver número (ex: "2 Manchas de Fogo"), renderiza apenas as imagens repetidas (sem número)
            if (count) {
                const numericCount = parseInt(count);
                parts.push(
                    <span key={matchIndex} className="inline-flex items-center gap-1 mx-0.5">
                        {Array.from({ length: numericCount }).map((_, idx) => (
                            <img
                                key={`${matchIndex}-${idx}`}
                                src={imagePath}
                                alt={stainName}
                                className="inline-block w-5 h-5"
                                style={{ verticalAlign: "text-bottom" }}
                            />
                        ))}
                    </span>
                );
            } else {
                // Apenas uma imagem (para "Mancha de X" ou "X" sozinho)
                parts.push(
                    <img
                        key={matchIndex}
                        src={imagePath}
                        alt={stainName}
                        className="inline-block w-5 h-5 mx-0.5"
                        style={{ verticalAlign: "text-bottom" }}
                    />
                );
            }
        } else {
            // Fallback: mantém o texto original
            parts.push(fullMatch);
        }

        lastIndex = matchIndex + fullMatch.length;
    }

    // Adiciona o texto restante após o último match
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}
