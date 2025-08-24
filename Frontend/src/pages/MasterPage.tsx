import { AiFillPlusCircle } from "react-icons/ai";
import { AiFillSave } from "react-icons/ai";
import { Link } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";


export default function MasterPage() {
    return (
        <div className="min-h-dvh grid place-items-center bg-base-200">
            <div className="w-full max-w-xs px-4 flex flex-col gap-6">
                <Link to="/" className="gap-2">
                    <MdOutlineKeyboardBackspace />
                </Link>

                <h1 className="text-3xl font-bold text-center text-primary">
                    Seja o mestre
                </h1>

                <Link to="/create-campaign" className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3">
                    <AiFillPlusCircle size={24} />
                    Criar campanha
                    <span className="opacity-0 w-1">.</span>
                </Link>

                <Link to="/load-campaign" className="btn btn-secondary btn-lg w-full flex items-center justify-center gap-3">
                    <AiFillSave size={22} />
                    Carregar campanha
                    <span className="opacity-0 w-1">.</span>
                </Link>
            </div>
        </div>
    );
}
