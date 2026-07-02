import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Tag } from "../types";

export function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getTags().then(setTags).catch(() => setTags([]));
  }, []);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const setImageAt = (idx: number, v: string) => {
    setImages((prev) => prev.map((u, i) => (i === idx ? v : u)));
  };

  const addImageField = () => setImages((prev) => [...prev, ""]);
  const removeImageField = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (!texto.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (texto.length > 255) {
      setError("La descripción no puede superar los 255 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      const post = await api.createPost(user._id, texto.trim(), selectedTags);
      const urls = images.map((u) => u.trim()).filter(Boolean);
      for (const url of urls) {
        try {
          await api.createPostImage(user._id, post._id, url);
        } catch {
          // ignore individual image failure, keep going
        }
      }
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Nueva publicación</h1>

        <label>Descripción *</label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={255}
          placeholder="¿Qué querés contar?"
        />
        <div className="muted small">{texto.length}/255</div>

        <label>Etiquetas</label>
        {tags.length === 0 && (
          <div className="muted small">No hay etiquetas disponibles.</div>
        )}
        <div className="tag-picker">
          {tags.map((t) => {
            const active = selectedTags.includes(t._id);
            return (
              <button
                type="button"
                key={t._id}
                className={`tag-chip ${active ? "active" : ""}`}
                onClick={() => toggleTag(t._id)}
              >
                #{t.nombre}
              </button>
            );
          })}
        </div>

        <label>URLs de imágenes (opcional)</label>
        {images.map((url, i) => (
          <div className="image-row" key={i}>
            <input
              value={url}
              onChange={(e) => setImageAt(i, e.target.value)}
              placeholder="https://..."
            />
            {images.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeImageField(i)}
              >
                Quitar
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addImageField}>
          + Agregar otra imagen
        </button>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-actions">
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
