import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Modal } from "./Modal";
import { PostComposer } from "./PostComposer";
import { SearchUsers } from "./SearchUsers";
import { SettingsDialog } from "./SettingsDialog";
import type { Post } from "../types";

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;
  const initial = user.nickname[0].toUpperCase();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const handlePlusClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setComposerOpen(true);
  };

  const handleCreated = (post: Post) => {
    setComposerOpen(false);
    window.dispatchEvent(new CustomEvent("post-created", { detail: post }));
  };

  return (
    <>
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link">Inicio</NavLink>
          <button
            type="button"
            className="sidebar-link sidebar-create"
            onClick={() => setSearchOpen(true)}
          >
            Buscar
          </button>
          <NavLink to="/profile" className="sidebar-link">Perfil</NavLink>
          <button
            type="button"
            className="sidebar-link sidebar-create"
            onClick={handlePlusClick}
          >
            Crear post
          </button>
        </nav>

        <div className="sidebar-user" ref={ref}>
          <button
            type="button"
            className="sidebar-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {initial}
          </button>
          <div className="sidebar-nick">{user ? `@${user.nickname}` : "Sin sesión"}</div>

          {menuOpen && user && (
            <div className="sidebar-menu" role="menu">
              <button
                type="button"
                className="sidebar-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
              >
                Ajustes
              </button>
              <button
                type="button"
                className="sidebar-menu-item"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Nueva publicación"
      >
        <PostComposer onCreated={handleCreated} />
      </Modal>

      <SearchUsers open={searchOpen} onClose={() => setSearchOpen(false)} />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
