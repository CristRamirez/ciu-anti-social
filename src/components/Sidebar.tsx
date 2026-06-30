import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "sidebar-link active" : "sidebar-link";
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!user) return null;

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" end className={navLinkClass}>
          Inicio
        </NavLink>
        <button type="button" className="sidebar-link sidebar-link-btn">
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
            <button type="button" className="sidebar-dropdown-item">
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
    </aside>
  );
}
