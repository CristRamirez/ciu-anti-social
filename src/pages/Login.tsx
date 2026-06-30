import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const FIXED_PASSWORD = "123456";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nickname.trim() || !password) {
      setError("Completa nickname y contraseña.");
      return;
    }
    if (password !== FIXED_PASSWORD) {
      setError("Contraseña incorrecta.");
      return;
    }
    setLoading(true);
    try {
      const users = await api.getUsers();
      const found = users.find(
        (u) => u.nickname.toLowerCase() === nickname.trim().toLowerCase()
      );
      if (!found) {
        setError("Usuario no encontrado.");
        return;
      }
      login(found);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>

        <label>Nickname</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoFocus
          placeholder="tu nickname"
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="123456"
        />

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="muted center">
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </form>
    </div>
  );
}
