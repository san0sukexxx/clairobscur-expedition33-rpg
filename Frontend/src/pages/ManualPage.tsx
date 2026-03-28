import { useNavigate, useParams } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { FullscreenButton } from "../components/FullscreenButton";
import { t } from "../i18n";
import { ManualMasterContent } from "./ManualMasterContent";
import { ManualPlayerContent } from "./ManualPlayerContent";

/* ── D&D 5e PHB palette ── */
const parchment = "#eee5ce";
const ink = "#1c1410";
const inkMuted = "#58473a";
const heading = "#58180d";
const rule = "#c9ad6a";

const pageStyle: React.CSSProperties = {
  background: `
    radial-gradient(ellipse at 20% 20%, rgba(255,248,230,0.5) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(200,180,140,0.3) 0%, transparent 60%),
    radial-gradient(circle at 15% 85%, rgba(180,160,120,0.15) 0%, transparent 40%),
    radial-gradient(circle at 85% 15%, rgba(160,140,100,0.1) 0%, transparent 35%),
    linear-gradient(180deg, ${parchment} 0%, #e4d5b0 100%)
  `,
  color: ink,
  fontFamily: "'Noto Serif', Georgia, serif",
  fontSize: "13px",
  lineHeight: "1.6",
};

function DecorativeRule() {
  return (
    <div className="my-2" style={{
      height: "2px",
      background: `linear-gradient(to right, transparent, ${rule}, ${rule}, transparent)`,
    }} />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DecorativeRule />
      <h2 className="text-xl font-bold mt-1 mb-2" style={{ color: heading, fontFamily: "'Noto Serif', Georgia, serif" }}>
        {children}
      </h2>
    </>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold mt-3 mb-1" style={{ color: heading, fontFamily: "'Noto Serif', Georgia, serif" }}>
      {children}
    </h3>
  );
}

export { SectionTitle, SubTitle, DecorativeRule };

export default function ManualPage() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const isMaster = type === "master";

  const titleKey = isMaster ? "manual.masterTitle" : "manual.playerTitle";

  return (
    <div className="min-h-dvh flex flex-col" style={pageStyle}>
      {/* Navbar */}
      <div className="shadow sticky top-0 z-10 px-4 py-2 flex items-center justify-between"
        style={{ background: heading, color: parchment }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition"
        >
          <MdOutlineKeyboardBackspace className="text-2xl" />
          <span style={{ fontFamily: "'Noto Serif', Georgia, serif" }}>{t(titleKey)}</span>
        </button>
        <FullscreenButton />
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {isMaster ? <ManualMasterContent /> : <ManualPlayerContent />}
      </main>
    </div>
  );
}
