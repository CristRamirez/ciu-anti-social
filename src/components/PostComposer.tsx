import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";

interface PostComposerProps {
  onCreated?: (post: Post) => void;
}

export function PostComposer({ onCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [texto, setTexto] = useState("");
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
      const created = await api.createPostForUser(user._id, value);
      setTexto("");
      onCreated?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSubmitting(false);
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
