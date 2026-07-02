import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { User } from "../types";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getUsers()
      .then((all) => !cancelled && setUsers(all))
      .catch((e) =>
        !cancelled && setError(e instanceof Error ? e.message : "Error")
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container">
      <Link to="/" className="link-back">← Volver</Link>
      <header className="card">
        <h1 style={{ margin: 0 }}>Todos los usuarios</h1>
        <p className="muted">{users.length} en total</p>
      </header>

      {loading && <div className="muted">Cargando...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <ul className="users-list big card">
        {users.map((u) => (
          <li key={u._id} className="users-item">
            <Link to={`/u/${u._id}`} className="users-item-link">
              <div className="avatar">{u.nickname[0].toUpperCase()}</div>
              <span className="users-nick">@{u.nickname}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
