import { useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { CHARACTERS_LIST } from "../utils/CharacterUtils";
import { t } from "../i18n";

interface CharacterSelectProps {
    selected: string | null | undefined;
    onSelect: (id: string) => void;
    allowedCharacters: string[];
}

export default function CharacterSelect({ selected, onSelect, allowedCharacters }: CharacterSelectProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const current = CHARACTERS_LIST.find((c) => c.id === selected) ?? null;
    const filteredList = CHARACTERS_LIST.filter((c) => allowedCharacters.includes(c.id));

    function handleSelect(id: string) {
        onSelect(id);
        detailsRef.current?.removeAttribute("open");
    }

    return (
        <details ref={detailsRef} className="dropdown flex-1">
            <summary className="btn w-full justify-start gap-3 text-base h-[4.5rem]">
                {current ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden shrink-0">
                            <img
                                src={`/characters/${current.id}.webp`}
                                alt={current.label}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {current.label}
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FaUserCircle className="w-5 h-5" aria-hidden />
                        <span>{t("characterSheet.selectCharacter")}</span>
                    </div>
                )}
            </summary>

            <ul className="dropdown-content menu bg-base-100 rounded-box shadow w-72 mt-2 z-[1] p-2">
                {filteredList.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className="flex items-center gap-3 py-2 text-base w-full text-left"
                            onClick={() => handleSelect(c.id)}
                        >
                            <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden shrink-0">
                                <img
                                    src={`/characters/${c.id}.webp`}
                                    alt={c.label}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {c.label}
                        </button>
                    </li>
                ))}
            </ul>
        </details>
    );
}
