import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Modal } from "./Modal";
import type { User } from "../types";

interface SearchUsersProps {
  open: boolean;
  onClose: () => void;
}

export function SearchUsers({ open, onClose }: SearchUsersProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    api.getUsers()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, [open]);

  const filtered = query.trim()
    ? users.filter((u) => u.nickname.toLowerCase().includes(query.toLowerCase()))
    : users.slice(0, 10);

  const handleClick = (id: string) => {
    onClose();
    navigate(`/u/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Buscar usuarios">
      <input
        className="search-input"
        placeholder="Buscar por nickname..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {filtered.length === 0 ? (
        <p className="muted">Sin resultados.</p>
      ) : (
        <ul className="search-results">
          {filtered.map((u) => (
            <li key={u._id}>
              <button type="button" className="search-result-item" onClick={() => handleClick(u._id)}>
                <div className="post-avatar" aria-hidden>
                  {u.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="post-nick">@{u.nickname}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
