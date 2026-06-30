import { NavLink } from "react-router-dom";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "sidebar-link active" : "sidebar-link";
}

export function Sidebar() {
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
    </aside>
  );
}
