import React from "react";
import { renderStainText } from "./StainTextUtils";

export function DiamondThumb({ image, alt }: { image?: string; alt: string }) {
    return (
        <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-base-300 bg-base-200/50">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/skills/${image}`} alt={alt} className="h-full w-full -rotate-45 object-cover" />
                ) : (
                    <div className="flex h-full w-full -rotate-45 items-center justify-center text-xl leading-none">+</div>
                )}
            </div>
        </div>
    );
}

export function highlightSkillDescription(text: string, specialAttackId?: string) {
    const isLuneSpecialAttack = specialAttackId?.toLowerCase().includes("lune") ?? false;
    const stainRendered = isLuneSpecialAttack ? renderStainText(text) : [text];

    const isMaelleSpecialAttack = specialAttackId?.toLowerCase().includes("maelle") ?? false;

    const terms = ["Físico", "Predição", "Predições", "Mágico", "Sangramento", "Veneno", "Atordoamento"];

    const rankTerms = ["Rank S", "Rank A", "Rank B", "Rank C", "Rank D"];

    const maskTerms = ["Máscara Onipotente", "Máscara Todopoderosa", "Máscara Lançadora", "Máscara de Conjurador", "Máscara Ágil", "Máscara Equilibrada", "Máscara Pesada"];

    const stanceTerms = ["Defensiva", "Ofensiva", "Virtuosa"];

    const allTerms = [...terms, ...rankTerms, ...maskTerms, ...(isMaelleSpecialAttack ? stanceTerms : [])];
    const pattern = new RegExp(`\\b(${allTerms.join("|")})\\b`, "g");

    const getRankColorClass = (rank: string): string => {
        switch(rank) {
            case "Rank S": return "text-red-400 font-bold border-b-2 border-red-400";
            case "Rank A": return "text-purple-400 font-bold border-b-2 border-purple-400";
            case "Rank B": return "text-blue-400 font-bold border-b-2 border-blue-400";
            case "Rank C": return "text-amber-200 font-bold border-b-2 border-amber-200";
            case "Rank D": return "text-gray-400 font-bold border-b-2 border-gray-400";
            default: return "text-amber-300 font-semibold";
        }
    };

    const getMaskColorClass = (mask: string): string => {
        switch(mask) {
            case "Máscara Onipotente": return "text-warning font-bold border-b-2 border-warning";
            case "Máscara Todopoderosa": return "text-warning font-bold border-b-2 border-warning";
            case "Máscara Lançadora": return "text-info font-bold border-b-2 border-info";
            case "Máscara de Conjurador": return "text-info font-bold border-b-2 border-info";
            case "Máscara Ágil": return "text-purple-600 font-bold border-b-2 border-purple-600";
            case "Máscara Equilibrada": return "text-error font-bold border-b-2 border-error";
            case "Máscara Pesada": return "text-success font-bold border-b-2 border-success";
            default: return "text-amber-300 font-semibold";
        }
    };

    const getStanceColorClass = (stance: string): string => {
        switch(stance) {
            case "Defensiva": return "text-blue-400 font-bold border-b-2 border-blue-400";
            case "Ofensiva": return "text-red-400 font-bold border-b-2 border-red-400";
            case "Virtuosa": return "text-purple-400 font-bold border-b-2 border-purple-400";
            default: return "text-amber-300 font-semibold";
        }
    };

    return stainRendered.map((node, nodeIdx) => {
        if (typeof node !== "string") {
            return <React.Fragment key={`stain-${nodeIdx}`}>{node}</React.Fragment>;
        }

        return node.split(pattern).map((chunk, chunkIdx) => {
            if (rankTerms.includes(chunk)) {
                return (
                    <span key={`${nodeIdx}-${chunkIdx}`} className={getRankColorClass(chunk)}>
                        {chunk}
                    </span>
                );
            } else if (maskTerms.includes(chunk)) {
                return (
                    <span key={`${nodeIdx}-${chunkIdx}`} className={getMaskColorClass(chunk)}>
                        {chunk}
                    </span>
                );
            } else if (stanceTerms.includes(chunk) && isMaelleSpecialAttack) {
                return (
                    <span key={`${nodeIdx}-${chunkIdx}`} className={getStanceColorClass(chunk)}>
                        {chunk}
                    </span>
                );
            } else if (terms.includes(chunk)) {
                return (
                    <span key={`${nodeIdx}-${chunkIdx}`} className="text-amber-300 font-semibold">
                        {chunk}
                    </span>
                );
            } else {
                return <React.Fragment key={`${nodeIdx}-${chunkIdx}`}>{chunk}</React.Fragment>;
            }
        });
    });
}
