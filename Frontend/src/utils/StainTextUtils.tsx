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
 * Mapeamento de nomes de elementos em inglês para português
 */
const ELEMENT_NAMES_PT: Record<string, string> = {
    "Lightning": "Raio",
    "Earth": "Terra",
    "Fire": "Fogo",
    "Ice": "Gelo",
    "Light": "Luz"
};

/**
 * Traduz o nome de um elemento de inglês para português
 * @param elementName Nome do elemento em inglês
 * @returns Nome do elemento em português
 */
export function translateElementName(elementName: string): string {
    return ELEMENT_NAMES_PT[elementName] || elementName;
}

/**
 * Substitui referências a manchas ("Mancha de X", "X stain", "stain of X") por imagens
 * @param text Texto da descrição da habilidade
 * @returns Array de React nodes com texto e imagens
 */
export function renderStainText(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];

    // Regex para capturar padrões como:
    // - PT "Mancha de Raio" / "2 Manchas de Fogo"  → match[1]=count, match[2]=element
    // - EN "1 Fire stain" / "Lightning stains"      → match[3]=count, match[4]=element
    // - EN "2 stains of Earth"                      → match[5]=count, match[6]=element
    const stainPattern = /(\d+\s+)?Manchas?\s+de\s+(Raio|Lightning|Terra|Earth|Fogo|Fire|Gelo|Ice|Luz|Light)|(\d+\s+)?\b(Raio|Lightning|Terra|Earth|Fogo|Fire|Gelo|Ice|Luz|Light)\b\s+stains?|(\d+\s+)?stains?\s+of\s+(Raio|Lightning|Terra|Earth|Fogo|Fire|Gelo|Ice|Luz|Light)\b/gi;

    let lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = stainPattern.exec(text)) !== null) {
        const matchIndex = match.index; // Store for type safety

        // Adiciona o texto antes do match
        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }

        const fullMatch = match[0];
        const count = (match[1] || match[3] || match[5])?.trim();
        const stainName = match[2] || match[4] || match[6];
        const imagePath = STAIN_IMAGES[stainName];

        if (imagePath) {
            // Se houver número (ex: "2 Manchas de Fogo"), renderiza as imagens repetidas (sem o número no texto)
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
                // Apenas uma imagem (para "Mancha de X", "X stain" ou "stain of X")
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
