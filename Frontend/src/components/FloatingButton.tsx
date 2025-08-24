import { FaPlus } from "react-icons/fa";
import React from "react";

interface FloatingButtonProps {
  onClick: () => void;
}

export default function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        btn btn-primary 
        btn-circle 
        fixed 
        bottom-6 
        right-6 
        shadow-lg 
        flex 
        items-center 
        justify-center
      "
    >
      <FaPlus size={14} />
    </button>
  );
}
