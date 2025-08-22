import { AiOutlineBook } from "react-icons/ai";
import { FaUser } from "react-icons/fa";

export default function UserTypeSelect() {
  return (
    <div className="min-h-dvh grid place-items-center bg-base-200">
      <div className="w-full max-w-xs px-4 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-center text-primary">
          RPG Expedition 33
        </h1>

        <button className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3">
          <AiOutlineBook size={24} />
          Mestre
          <span className="opacity-0 w-1">.</span>
        </button>

        <button className="btn btn-secondary btn-lg w-full flex items-center justify-center gap-3">
          <FaUser size={22} />
          Jogador
          <span className="opacity-0 w-1">.</span>
        </button>
      </div>
    </div>
  );
}
