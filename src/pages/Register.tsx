import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!nickname.trim()) {
      setError("El nickname es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      const user = await api.createUser(nickname.trim());
      setOk("Usuario creado. Te logueamos...");
      login(user);
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el usuario";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="muted">
          Elegí un nickname. La contraseña para todos es <code>123456</code>.
        </p>

        <label>Nickname</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoFocus
          placeholder="elegí un nickname"
        />

        {error && <div className="alert alert-error">{error}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>

        <p className="muted center">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
}
