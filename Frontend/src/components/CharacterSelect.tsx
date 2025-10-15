import { useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { CHARACTERS_LIST } from "../utils/CharacterUtils";

interface CharacterSelectProps {
    selected: string | null | undefined;
    onSelect: (id: string) => void;
}

export default function CharacterSelect({ selected, onSelect }: CharacterSelectProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const current = CHARACTERS_LIST.find((c) => c.id === selected) ?? null;

    function handleSelect(id: string) {
        onSelect(id);
        detailsRef.current?.removeAttribute("open");
    }

    return (
        <details ref={detailsRef} className="dropdown w-full">
            <summary className="btn btn-xl w-full justify-start gap-5 text-xl h-20">
                {current ? (
                    <>
                        <img
                            src={`/characters/${current.id}.webp`}
                            alt={current.label}
                            className="w-14 h-14 rounded-full"
                        />
                        {current.label}
                    </>
                ) : (
                    <div className="flex items-center gap-3 text-gray-400 text-lg">
                        <FaUserCircle className="w-6 h-6" aria-hidden />
                        <span>Selecione seu personagem</span>
                    </div>
                )}
            </summary>

            <ul className="dropdown-content menu bg-base-100 rounded-box shadow w-80 mt-2 z-[1] p-2">
                {CHARACTERS_LIST.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className="flex items-center gap-5 py-4 text-xl w-full text-left"
                            onClick={() => handleSelect(c.id)}
                        >
                            <img
                                src={`/characters/${c.id}.webp`}
                                alt={c.label}
                                className="w-14 h-14 rounded-full"
                            />
                            {c.label}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}
