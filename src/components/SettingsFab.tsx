import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "./Modal";
import type { Tag } from "../types";

function friendlyErr(raw: string): string {
  if (/E11000|duplicate key/i.test(raw)) return "Ese tag ya existe";
  return raw;
}

export function SettingsFab() {
  const { user } = useAuth();
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const ts = await api.getTags();
      setTags(ts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = newName.trim();
    if (!value) {
      setCreateError("Ingresá un nombre.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createTag(value);
      setTags((prev) => [...prev, created]);
      setNewName("");
      success("Tag creado");
    } catch (err) {
      setCreateError(friendlyErr(err instanceof Error ? err.message : "Error"));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (t: Tag) => {
    setEditId(t._id);
    setEditName(t.nombre);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    const value = editName.trim();
    if (!value) {
      setEditError("No puede estar vacío.");
      return;
    }
    setSavingId(id);
    setEditError(null);
    try {
      const updated = await api.updateTag(id, value);
      setTags((prev) => prev.map((t) => (t._id === id ? updated : t)));
      setEditId(null);
      success("Tag actualizado");
    } catch (err) {
      setEditError(friendlyErr(err instanceof Error ? err.message : "Error"));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tag?")) return;
    setDeletingId(id);
    try {
      await api.deleteTag(id);
      setTags((prev) => prev.filter((t) => t._id !== id));
      success("Tag eliminado");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        className="settings-fab"
        onClick={() => setOpen(true)}
        title="Configuración"
        aria-label="Configuración"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Etiquetas">
        <form onSubmit={handleCreate} className="tag-create">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nuevo tag (sin espacios)"
            maxLength={20}
            disabled={creating}
          />
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={creating || !newName.trim()}
          >
            {creating ? "..." : "Crear"}
          </button>
        </form>
        {createError && <div className="alert alert-error">{createError}</div>}

        {loading && <div className="muted small">Cargando...</div>}
        {!loading && tags.length === 0 && (
          <div className="muted small">No hay etiquetas todavía.</div>
        )}

        <ul className="tag-admin-list">
          {tags.map((t) => {
            const isEditing = editId === t._id;
            return (
              <li key={t._id} className="tag-admin-item">
                {isEditing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={20}
                      autoFocus
                      disabled={savingId === t._id}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(t._id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button
                      type="button"
                      className="icon-btn small"
                      onClick={() => saveEdit(t._id)}
                      disabled={savingId === t._id}
                      title="Guardar"
                      aria-label="Guardar"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn small"
                      onClick={cancelEdit}
                      disabled={savingId === t._id}
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="tag">#{t.nombre}</span>
                    <button
                      type="button"
                      className="icon-btn small"
                      onClick={() => startEdit(t)}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn small danger"
                      onClick={() => handleDelete(t._id)}
                      disabled={deletingId === t._id}
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {editError && <div className="alert alert-error">{editError}</div>}
      </Modal>
    </>
  );
}
