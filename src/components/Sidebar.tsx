import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SearchUsers } from "./SearchUsers";
import { SettingsDialog } from "./SettingsDialog";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "sidebar-link active" : "sidebar-link";
}

export function Sidebar() {
  // Hooks primero, siempre en el mismo orden. Early return va DESPUES.
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false);
    setSettingsOpen(true);
  }, []);

  if (!user) return null;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" end className={navLinkClass}>
          Inicio
        </NavLink>
        <button type="button" className="sidebar-link sidebar-link-btn" onClick={() => setSearchOpen(true)}>
          Buscar
        </button>
        <NavLink to="/profile" className={navLinkClass}>
          Perfil
        </NavLink>
        <NavLink to="/" className={navLinkClass}>
          Crear post
        </NavLink>
      </nav>

      <div className="sidebar-user" ref={menuRef}>
        {menuOpen && (
          <div className="sidebar-dropdown">
            <button type="button" className="sidebar-dropdown-item" onClick={handleOpenSettings}>
              Ajustes
            </button>
            <button
              type="button"
              className="sidebar-dropdown-item"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
        <button
          type="button"
          className="sidebar-avatar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {user.nickname.charAt(0).toUpperCase()}
        </button>
      </div>

      <SearchUsers open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
