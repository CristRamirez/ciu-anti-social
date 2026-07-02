import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EmojiPicker } from "./EmojiPicker";
import type { Post, Tag } from "../types";

interface Props {
  onCreated: (post: Post) => void;
}

export function PostComposer({ onCreated }: Props) {
  const { user } = useAuth();
  const { success } = useToast();
  const [texto, setTexto] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [tagAdding, setTagAdding] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const setImageAt = (i: number, v: string) =>
    setImages((p) => p.map((u, idx) => (idx === i ? v : u)));

  const addTag = async () => {
    const value = tagDraft.trim();
    if (!value) {
      setTagError("Escribí un nombre.");
      return;
    }
    if (selectedTags.some((t) => t.nombre.toLowerCase() === value.toLowerCase())) {
      setTagError("Ya lo agregaste.");
      return;
    }
    setTagAdding(true);
    setTagError(null);
    try {
      const all = await api.getTags();
      let tag = all.find((t) => t.nombre.toLowerCase() === value.toLowerCase());
      if (!tag) {
        tag = await api.createTag(value);
      }
      setSelectedTags((prev) => [...prev, tag!]);
      setTagDraft("");
      setTagInputOpen(false);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setTagAdding(false);
    }
  };

  const removeTag = (id: string) =>
    setSelectedTags((prev) => prev.filter((t) => t._id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (!texto.trim()) {
      setError("Escribí algo antes de publicar.");
      return;
    }
    setSubmitting(true);
    try {
      const post = await api.createPost(
        user._id,
        texto.trim(),
        selectedTags.map((t) => t._id)
      );
      const urls = images.map((u) => u.trim()).filter(Boolean);
      for (const url of urls) {
        try {
          await api.createPostImage(user._id, post._id, url);
        } catch {
          /* ignore individual failure */
        }
      }
      setTexto("");
      setSelectedTags([]);
      setImages([]);
      success("Post creado exitosamente");
      onCreated(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="card composer-anon">
        <span className="muted">¿Querés postear algo?</span>
        <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
      </div>
    );
  }

  const initial = user.nickname[0].toUpperCase();

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <div className="composer-top">
        <div className="avatar">{initial}</div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`¿Qué pensás, @${user.nickname}?`}
          rows={2}
          maxLength={255}
        />
      </div>

      <div className="composer-extra">
        <label>Etiquetas</label>
          <div className="tag-picker">
            {selectedTags.map((t) => (
              <span key={t._id} className="tag-chip active">
                #{t.nombre}
                <button
                  type="button"
                  className="tag-chip-remove"
                  onClick={() => removeTag(t._id)}
                  aria-label={`Quitar ${t.nombre}`}
                >
                  ×
                </button>
              </span>
            ))}
            {tagInputOpen ? (
              <span className="tag-inline-add">
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  placeholder="nombre"
                  maxLength={20}
                  autoFocus
                  disabled={tagAdding}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                    if (e.key === "Escape") {
                      setTagInputOpen(false);
                      setTagDraft("");
                      setTagError(null);
                    }
                  }}
                />
                <button
                  type="button"
                  className="tag-inline-ok"
                  onClick={addTag}
                  disabled={tagAdding}
                  aria-label="Agregar"
                >
                  ✓
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="tag-chip tag-chip-add"
                onClick={() => {
                  setTagInputOpen(true);
                  setTagError(null);
                }}
                aria-label="Agregar etiqueta"
              >
                +
              </button>
            )}
          </div>
          {tagError && <div className="alert alert-error">{tagError}</div>}

        <label>URLs de imágenes</label>
        {images.map((url, i) => (
          <div className="image-row" key={i}>
            <input
              value={url}
              onChange={(e) => setImageAt(i, e.target.value)}
              placeholder="https://..."
            />
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => setImages((p) => [...p, ""])}
        >
          + Imagen
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="composer-foot">
        <EmojiPicker
          onSelect={(em) =>
            setTexto((t) => (t.length + em.length <= 255 ? t + em : t))
          }
        />
        <div className="composer-foot-right" style={{ marginLeft: "auto" }}>
          <span className="muted small">{texto.length}/255</span>
          <button className="btn btn-primary btn-pill" disabled={submitting}>
            {submitting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </form>
  );
}
