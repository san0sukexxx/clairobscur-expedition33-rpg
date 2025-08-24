import { useRef, useState } from "react";

const characters = [
    { id: "gustave", label: "Gustave" },
    { id: "maelle", label: "Maelle" },
    { id: "sciel", label: "Sciel" },
    { id: "lune", label: "Lune" },
    { id: "verso", label: "Verso" },
    { id: "monoco", label: "Monoco" },
];

export default function CharacterSelect() {
    const [selected, setSelected] = useState(characters[0]);
    const detailsRef = useRef<HTMLDetailsElement>(null);

    function handleSelect(c: typeof characters[number]) {
        setSelected(c);
        // fecha o dropdown imediatamente
        detailsRef.current?.removeAttribute("open");
    }

    return (
        <details ref={detailsRef} className="dropdown w-full">
            {/* Botão gatilho */}
            <summary className="btn btn-xl w-full justify-start gap-5 text-xl h-20">
                <img
                    src={`/${selected.id}.webp`}
                    alt={selected.label}
                    className="w-14 h-14 rounded-full"
                />
                {selected.label}
            </summary>

            {/* Opções */}
            <ul className="dropdown-content menu bg-base-100 rounded-box shadow w-80 mt-2 z-[1] p-2">
                {characters.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className="flex items-center gap-5 py-4 text-xl w-full text-left"
                            onClick={() => handleSelect(c)}
                        >
                            <img src={`/${c.id}.webp`} alt={c.label} className="w-14 h-14 rounded-full" />
                            {c.label}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}