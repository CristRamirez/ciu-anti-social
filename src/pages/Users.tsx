import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { User } from "../types";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container feed"><p className="muted">Cargando...</p></div>;

  return (
    <div className="container feed">
      <h1 className="feed-title">Usuarios</h1>
      {users.length === 0 ? (
        <p className="muted">No hay usuarios.</p>
      ) : (
        <ul className="users-list">
          {users.map((u) => (
            <li key={u._id}>
              <Link to={`/u/${u._id}`} className="user-item">
                <div className="post-avatar" aria-hidden>
                  {u.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="post-nick">@{u.nickname}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
