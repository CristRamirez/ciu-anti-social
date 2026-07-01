import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import type { Tag } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";

function getTagError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (/duplicate|E11000|existe|duplicado/i.test(message)) return "Ese tag ya existe";
  return message || "No se pudo guardar el tag";
}

export function SettingsFab() {
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError("");

    api
      .getTags()
      .then(setTags)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar las etiquetas"))
      .finally(() => setLoading(false));
  }, [open]);

  const resetEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = newTag.trim();
    if (!nombre) return;

    setSaving(true);
    setError("");

    try {
      const created = await api.createTag(nombre);
      setTags((prev) => [...prev, created]);
      setNewTag("");
      success("Etiqueta creada");
    } catch (err) {
      setError(getTagError(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tag: Tag) => {
    setError("");
    setEditingId(tag._id);
    setEditingValue(tag.nombre);
  };

  const saveEdit = async (id: string) => {
    const nombre = editingValue.trim();
    if (!nombre) return;

    setSaving(true);
    setError("");

    try {
      const updated = await api.updateTag(id, nombre);
      setTags((prev) => prev.map((tag) => (tag._id === id ? updated : tag)));
      resetEdit();
      success("Etiqueta actualizada");
    } catch (err) {
      setError(getTagError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async () => {
    if (!deleteId) return;

    setDeleting(true);
    setError("");

    try {
      await api.deleteTag(deleteId);
      setTags((prev) => prev.filter((tag) => tag._id !== deleteId));
      setDeleteId(null);
      success("Etiqueta eliminada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la etiqueta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="settings-fab"
        onClick={() => setOpen(true)}
        aria-label="Ajustes"
        title="Ajustes"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04a2.1 2.1 0 0 1-2.97 2.97l-.04-.04a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66v.06a2.1 2.1 0 0 1-4.2 0v-.06a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.04.04a2.1 2.1 0 0 1-2.97-2.97l.04-.04A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.9a2.1 2.1 0 0 1 0-4.2h.06A1.8 1.8 0 0 0 4.6 8a1.8 1.8 0 0 0-.36-1.98l-.04-.04a2.1 2.1 0 0 1 2.97-2.97l.04.04A1.8 1.8 0 0 0 9.2 3.4a1.8 1.8 0 0 0 1.1-1.66V1.7a2.1 2.1 0 0 1 4.2 0v.06a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.04-.04a2.1 2.1 0 0 1 2.97 2.97l-.04.04A1.8 1.8 0 0 0 19.4 8c.16.5.54.9 1.04 1.04.2.06.42.08.62.08h.04a2.1 2.1 0 0 1 0 4.2h-.06A1.8 1.8 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Etiquetas">
        <form className="settings-tag-form" onSubmit={createTag}>
          <input
            className="settings-tag-input"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nueva etiqueta"
            disabled={saving}
          />
          <button type="submit" className="btn btn-primary" disabled={saving || !newTag.trim()}>
            Crear
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <p className="muted">Cargando...</p>}

        {!loading && (
          <ul className="settings-tag-list">
            {tags.map((tag) => (
              <li key={tag._id} className="settings-tag-item">
                {editingId === tag._id ? (
                  <>
                    <input
                      className="settings-tag-input"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(tag._id);
                        if (e.key === "Escape") resetEdit();
                      }}
                      disabled={saving}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="settings-icon-btn"
                      onClick={() => saveEdit(tag._id)}
                      disabled={saving || !editingValue.trim()}
                      title="Guardar"
                    >
                      ✓
                    </button>
                    <button type="button" className="settings-icon-btn" onClick={resetEdit} disabled={saving} title="Cancelar">
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <span className="settings-tag-name">#{tag.nombre}</span>
                    <button type="button" className="settings-icon-btn" onClick={() => startEdit(tag)} title="Editar">
                      ✎
                    </button>
                    <button type="button" className="settings-icon-btn settings-icon-btn-danger" onClick={() => setDeleteId(tag._id)} title="Eliminar">
                      🗑
                    </button>
                  </>
                )}
              </li>
            ))}
            {tags.length === 0 && <li className="muted">No hay etiquetas todavía.</li>}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar etiqueta"
        message="¿Seguro que querés eliminar esta etiqueta?"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={deleteTag}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}