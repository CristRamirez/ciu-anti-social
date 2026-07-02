import { useEffect, useRef, useState } from "react";

interface Props {
  onSelect: (emoji: string) => void;
}

const EMOJIS = [
  "😀","😁","😂","🤣","😅","😊","😇","🥰","😍","🤩",
  "😘","😜","🤪","🤨","🧐","🤓","😎","🥳","😏","😒",
  "😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩",
  "🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵",
  "🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫",
  "🤥","😶","😐","😑","😬","🙄","😯","😲","😴","🤤",
  "👍","👎","👏","🙌","🙏","💪","🤝","✌️","🤞","🤟",
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💯",
  "🔥","✨","⭐","🌟","💫","🎉","🎊","🎁","🎂","🥂",
];

export function EmojiPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="emoji-picker" ref={ref}>
      <button
        type="button"
        className="emoji-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Emojis"
        aria-label="Emojis"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>
      {open && (
        <div className="emoji-pop" role="dialog">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="emoji-item"
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
