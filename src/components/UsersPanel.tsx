import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function UsersPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.getUsers()
      .then((data) => {
        setTotal(data.length);
        const shuffled = shuffle(data);
        setUsers(shuffled.slice(0, 5));
      })
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, nickname: user.nickname } : u))
    );
  }, [user]);

  if (!user) return null;

  return (
    <aside className="users-panel">
      <h3 className="users-panel-title">Usuarios</h3>
      <ul className="users-panel-list">
        {users.map((u) => (
          <li key={u._id}>
            <Link to={`/u/${u._id}`} className="users-panel-item">
              <div className="users-panel-avatar" aria-hidden>
                {u.nickname.charAt(0).toUpperCase()}
              </div>
              <span className="post-nick">@{u.nickname}</span>
            </Link>
          </li>
        ))}
      </ul>
      {total > 5 && (
        <Link to="/users" className="users-panel-more">
          Ver mas
        </Link>
      )}
    </aside>
  );
}
