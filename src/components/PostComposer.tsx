import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post, Tag } from "../types";

interface PostComposerProps {
  onCreated?: (post: Post) => void;
}

export function PostComposer({ onCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [texto, setTexto] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const placeholder = `¿Qué pensás, @${user.nickname}?`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = texto.trim();
    if (!value) {
      setError("Escribí algo antes de publicar.");
      return;
    }
    setSubmitting(true);
    try {
      const tagIds = tags.map((t) => t._id);
      const created = await api.createPostForUser(user._id, value, tagIds);
      setTexto("");
      setTags([]);
      onCreated?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSubmitting(false);
    }
  };

  const removeTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t._id !== id));
  };

  const confirmTag = async () => {
    const nombre = tagInput.trim();
    if (!nombre) {
      setTagInputOpen(false);
      return;
    }
    setTagLoading(true);
    setError(null);
    try {
      const all = await api.getTags();
      const match = all.find(
        (t) => t.nombre.toLowerCase() === nombre.toLowerCase()
      );
      const tag = match ?? (await api.createTag(nombre));
      setTags((prev) =>
        prev.some((t) => t._id === tag._id) ? prev : [...prev, tag]
      );
      setTagInput("");
      setTagInputOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error con el tag");
    } finally {
      setTagLoading(false);
    }
  };

  const avatarLetter = user.nickname.charAt(0).toUpperCase() || "?";

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <div className="composer-row">
        <div className="composer-avatar" aria-hidden>
          {avatarLetter}
        </div>
        <textarea
          className="composer-text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      </div>

      <div className="composer-tags">
        {tags.map((t) => (
          <span key={t._id} className="composer-chip">
            #{t.nombre}
            <button
              type="button"
              className="composer-chip-x"
              onClick={() => removeTag(t._id)}
              aria-label={`Quitar ${t.nombre}`}
            >
              ×
            </button>
          </span>
        ))}
        {tagInputOpen ? (
          <span className="composer-tag-input">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmTag();
                } else if (e.key === "Escape") {
                  setTagInputOpen(false);
                  setTagInput("");
                }
              }}
              placeholder="nombre tag"
              autoFocus
              disabled={tagLoading}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={confirmTag}
              disabled={tagLoading}
            >
              OK
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="composer-tag-add"
            onClick={() => setTagInputOpen(true)}
          >
            +
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="composer-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !texto.trim()}
        >
          {submitting ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </form>
  );
}
