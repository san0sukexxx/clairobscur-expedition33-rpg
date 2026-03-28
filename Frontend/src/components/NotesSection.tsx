import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { useToast } from "./Toast";
import { t } from "../i18n";
import {
    MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
    MdFormatListBulleted, MdFormatListNumbered,
    MdFormatQuote, MdHorizontalRule, MdUndo, MdRedo,
} from "react-icons/md";

interface NotesSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
}

const DEBOUNCE_MS = 1000;

function ToolbarButton({
    onClick, active, disabled, title, children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`
                flex items-center justify-center w-7 h-7 rounded text-sm
                disabled:opacity-30 disabled:cursor-not-allowed
                ${active
                    ? "bg-primary/20 text-primary"
                    : "text-base-content/70 hover:bg-base-300 hover:text-base-content"}
            `}
        >
            {children}
        </button>
    );
}

export function NotesSection({ player, setPlayer }: NotesSectionProps) {
    const { showToast } = useToast();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [, forceUpdate] = useState(0);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder: t("common.notes") }),
        ],
        content: player?.playerSheet?.notes ?? "",
        onTransaction() {
            forceUpdate(n => n + 1);
        },
        onUpdate({ editor }) {
            const html = editor.getHTML();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                if (!player) return;
                try {
                    await APIPlayer.update(player.id, {
                        playerSheet: { ...player.playerSheet, notes: html },
                    });
                    setPlayer(prev => prev ? {
                        ...prev,
                        playerSheet: { ...prev.playerSheet, notes: html },
                    } : prev);
                } catch {
                    showToast(t("common.errorSaving"));
                }
            }, DEBOUNCE_MS);
        },
    });

    useEffect(() => {
        if (!editor) return;
        const incoming = player?.playerSheet?.notes ?? "";
        if (editor.getHTML() !== incoming) {
            editor.commands.setContent(incoming, false);
        }
    }, [player?.id]);

    const active = (mark: string, attrs?: object) => editor?.isActive(mark, attrs) ?? false;

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-3">
            <h2 className="text-2xl font-bold">{t("playerPage.navigation.tabs.notes")}</h2>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border border-base-300 rounded-lg p-1.5 bg-base-200">
                <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()}      active={active("bold")}            title="Negrito"><MdFormatBold /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()}    active={active("italic")}          title="Itálico"><MdFormatItalic /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={active("underline")}       title="Sublinhado"><MdFormatUnderlined /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()}    active={active("strike")}          title="Tachado"><MdFormatStrikethrough /></ToolbarButton>

                <div className="w-px h-5 bg-base-300 mx-1" />

                <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={active("heading", { level: 2 })} title="Título H2">
                    <span className="text-[10px] font-black leading-none">H2</span>
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={active("heading", { level: 3 })} title="Subtítulo H3">
                    <span className="text-[10px] font-black leading-none">H3</span>
                </ToolbarButton>

                <div className="w-px h-5 bg-base-300 mx-1" />

                <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()}  active={active("bulletList")}  title="Lista"><MdFormatListBulleted /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={active("orderedList")} title="Lista numerada"><MdFormatListNumbered /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()}  active={active("blockquote")}  title="Citação"><MdFormatQuote /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()}                                title="Linha horizontal"><MdHorizontalRule /></ToolbarButton>

                <div className="w-px h-5 bg-base-300 mx-1" />

                <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Desfazer"><MdUndo /></ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Refazer"><MdRedo /></ToolbarButton>
            </div>

            {/* Editor */}
            <div
                className="border border-base-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40 bg-base-100 cursor-text"
                onClick={() => editor?.commands.focus()}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
