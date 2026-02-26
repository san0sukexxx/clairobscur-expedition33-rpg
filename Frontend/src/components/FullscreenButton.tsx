import { useState, useEffect } from "react";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      {isFullscreen ? (
        <MdFullscreenExit className="text-2xl" />
      ) : (
        <MdFullscreen className="text-2xl" />
      )}
    </button>
  );
}
