import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Weapon = {
  id: string;
  name: string;
  image: string;
  level: number;
  power: number;
  element: string;
  vitality: string;
  defense: string;
};

export default function WeaponSection() {
  const weapon: Weapon = {
    id: "w1",
    name: "Abyseram",
    image: "/weapons/abyseram.png",
    level: 20,
    power: 1200,
    element: "⚔️",
    vitality: "A",
    defense: "B",
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        {/* Cabeçalho */}
        <h2 className="text-center font-bold text-sm tracking-wide uppercase">
          Weapon
        </h2>

        {/* Imagem + Nome + Level */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-4">
            <img
              src={weapon.image}
              alt={weapon.name}
              className="w-20 h-20 object-contain"
            />
            <span className="text-2xl font-light">{weapon.name}</span>
          </div>

          <div className="text-right">
            <span className="block text-xs uppercase opacity-70">Level</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-xs btn-ghost">
                <FaChevronLeft />
              </button>
              <span className="text-2xl font-bold text-primary">
                {weapon.level}
              </span>
              <button className="btn btn-xs btn-ghost">
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center mt-6">
          <div>
            <span className="block text-xs uppercase opacity-70">Power</span>
            <span className="block text-2xl font-bold">{weapon.power}</span>
            <span className="block text-xs opacity-50">
              (Attributes not included)
            </span>
          </div>
          <div>
            <span className="block text-xs uppercase opacity-70">Element</span>
            <span className="block text-2xl">{weapon.element}</span>
          </div>
          <div>
            <span className="block text-xs uppercase opacity-70">Vitality</span>
            <span className="block text-2xl font-bold">{weapon.vitality}</span>
          </div>
          <div>
            <span className="block text-xs uppercase opacity-70">Defense</span>
            <span className="block text-2xl font-bold">{weapon.defense}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
