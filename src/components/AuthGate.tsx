import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AuthGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const show = !user && !isAuthRoute;

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div className="auth-gate-backdrop">
      <div className="card auth-gate-card" role="dialog" aria-modal>
        <h2 className="auth-gate-title">Iniciá sesión</h2>
        <p className="muted">Necesitás una cuenta para continuar.</p>
        <div className="auth-gate-actions">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-ghost">Register</Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
