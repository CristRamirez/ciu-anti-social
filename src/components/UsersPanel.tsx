import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function UsersPanel() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getUsers()
      .then((all) => {
        if (cancelled) return;
        setTotal(all.length);
        setUsers(shuffle(all).slice(0, 5));
      })
      .catch(() => !cancelled && setUsers([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u._id === authUser._id ? { ...u, nickname: authUser.nickname } : u
      )
    );
  }, [authUser?._id, authUser?.nickname]);

  if (!authUser) return null;

  return (
    <aside className="users-panel">
      <div className="users-card">
        <h3 className="users-title">Otros perfiles</h3>
        {loading && <div className="muted small">Cargando...</div>}
        {!loading && users.length === 0 && (
          <div className="muted small">No hay usuarios.</div>
        )}
        <ul className="users-list">
          {users.map((u) => (
            <li key={u._id} className="users-item">
              <Link to={`/u/${u._id}`} className="users-item-link">
                <div className="avatar small">{u.nickname[0].toUpperCase()}</div>
                <span className="users-nick">@{u.nickname}</span>
              </Link>
            </li>
          ))}
        </ul>
        {total > users.length && (
          <Link to="/users" className="users-more">Ver más</Link>
        )}
      </div>
    </aside>
  );
}
