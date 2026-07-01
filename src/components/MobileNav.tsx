import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import { PostComposer } from "./PostComposer";
import { SearchUsers } from "./SearchUsers";
import { SettingsDialog } from "./SettingsDialog";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "mobile-nav-item active" : "mobile-nav-item";
}

export function MobileNav() {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <nav className="mobile-nav">
        <NavLink to="/" end className={navLinkClass}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Inicio</span>
        </NavLink>

        <button type="button" className="mobile-nav-item" onClick={() => setSearchOpen(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Buscar</span>
        </button>

        <button
          type="button"
          className="mobile-nav-create"
          onClick={() => setComposerOpen(true)}
          title="Crear post"
          aria-label="Crear post"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>

        <NavLink to="/profile" className={navLinkClass}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
            <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Perfil</span>
        </NavLink>

        <button type="button" className="mobile-nav-item" onClick={() => setSettingsOpen(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
            <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66v.06a2.1 2.1 0 0 1-4.2 0v-.06a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.9a2.1 2.1 0 0 1 0-4.2h.06A1.8 1.8 0 0 0 4.6 8a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04A1.8 1.8 0 0 0 9.2 3.4a1.8 1.8 0 0 0 1.1-1.66V1.7a2.1 2.1 0 0 1 4.2 0v.06a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04A1.8 1.8 0 0 0 19.4 8c.16.5.54.9 1.04 1.04.2.06.42.08.62.08h.04a2.1 2.1 0 0 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Ajustes</span>
        </button>
      </nav>

      <SearchUsers open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title="Crear post">
        <PostComposer onCreated={() => setComposerOpen(false)} />
      </Modal>
    </>
  );
}
