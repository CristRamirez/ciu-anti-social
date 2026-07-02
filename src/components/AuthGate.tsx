import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function AuthGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const blocked = !user && !PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (blocked) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [blocked]);

  if (!blocked) return null;

  return createPortal(
    <div className="auth-gate-backdrop">
      <div className="auth-gate-card" role="dialog" aria-modal="true">
        <h2>Iniciá sesión</h2>
        <p className="muted">
          Necesitás una cuenta para navegar la red. Es gratis y rápido.
        </p>
        <div className="auth-gate-actions">
          <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
          <Link to="/register" className="btn btn-ghost">Crear cuenta</Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
