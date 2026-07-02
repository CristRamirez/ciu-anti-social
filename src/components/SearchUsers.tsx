import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Modal } from "./Modal";
import type { User } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchUsers({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setLoading(true);
    api
      .getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 10);
    return users.filter((u) => u.nickname.toLowerCase().includes(q)).slice(0, 20);
  }, [users, query]);

  const go = (id: string) => {
    onClose();
    navigate(`/u/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Buscar usuarios">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribí un nickname..."
        className="search-input"
      />
      {loading && <div className="muted small">Cargando...</div>}
      {!loading && filtered.length === 0 && (
        <div className="muted small">Sin resultados.</div>
      )}
      <ul className="search-list">
        {filtered.map((u) => (
          <li key={u._id}>
            <button
              type="button"
              className="search-item"
              onClick={() => go(u._id)}
            >
              <div className="avatar small">{u.nickname[0].toUpperCase()}</div>
              <span className="users-nick">@{u.nickname}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
