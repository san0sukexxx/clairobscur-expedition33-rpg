import { useRef } from "react";

const characters = [
    { id: "gustave", label: "Gustave" },
    { id: "maelle", label: "Maelle" },
    { id: "sciel", label: "Sciel" },
    { id: "lune", label: "Lune" },
    { id: "verso", label: "Verso" },
    { id: "monoco", label: "Monoco" },
];

interface CharacterSelectProps {
    selected: string;
    onSelect: (id: string) => void;
}

export default function CharacterSelect({ selected, onSelect }: CharacterSelectProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    const current = characters.find(c => c.id === selected) ?? characters[0];

    function handleSelect(id: string) {
        onSelect(id);
        detailsRef.current?.removeAttribute("open");
    }

    return (
        <details ref={detailsRef} className="dropdown w-full">
            {/* Botão gatilho */}
            <summary className="btn btn-xl w-full justify-start gap-5 text-xl h-20">
                <img
                    src={`/characters/${current.id}.webp`}
                    alt={current.label}
                    className="w-14 h-14 rounded-full"
                />
                {current.label}
            </summary>

            {/* Opções */}
            <ul className="dropdown-content menu bg-base-100 rounded-box shadow w-80 mt-2 z-[1] p-2">
                {characters.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className="flex items-center gap-5 py-4 text-xl w-full text-left"
                            onClick={() => handleSelect(c.id)}
                        >
                            <img src={`/characters/${c.id}.webp`} alt={c.label} className="w-14 h-14 rounded-full" />
                            {c.label}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}
