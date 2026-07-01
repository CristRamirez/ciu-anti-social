import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { relativeTime } from "../utils/time";
import type { Comment, Post, PostImage, User } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageCarousel } from "./ImageCarousel";

interface PostCardProps {
  post: Post;
  images?: PostImage[];
  commentsCount?: number;
  isNew?: boolean;
  onVerMas?: (postId: string) => void;
  onUpdated?: (updated: Post) => void;
  onDeleted?: (postId: string) => void;
}

function getOwnerNick(user: Post["user"]): string {
  if (typeof user === "string") return user;
  return user?.nickname ?? "anon";
}

function getAvatarLetter(user: Post["user"]): string {
  const nick = getOwnerNick(user);
  return nick.charAt(0).toUpperCase() || "?";
}

function getOwnerId(user: Post["user"]): string {
  if (typeof user === "string") return user;
  return user?._id ?? "";
}

export function PostCard({ post, images = [], commentsCount = 0, isNew = false, onVerMas, onUpdated, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const owner = post.user as User | string;
  const fecha = post.fechaPublicacion ?? post.createdAt;
  const urls = images.map((img) => img.url_image);
  const isOwner = !!user && user._id === getOwnerId(post.user);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.texto);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nicks, setNicks] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getComments(post._id)
      .then(async (data) => {
        if (cancelled) return;
        setComments(data);
        const uniqueIds = Array.from(new Set(data.map((c) => c.user)));
        const missing = uniqueIds.filter((id) => !(id in nicks));
        if (missing.length === 0) return;
        const results = await Promise.all(
          missing.map((id) =>
            api
              .getUser(id)
              .then((u) => [id, u.nickname] as const)
              .catch(() => [id, "anon"] as const)
          )
        );
        if (cancelled) return;
        setNicks((prev) => {
          const next = { ...prev };
          for (const [id, nick] of results) next[id] = nick;
          return next;
        });
      })
      .catch(() => {
        // ignorar errores de comments preview
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id]);

  useEffect(() => {
    if (!editing && !menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (editing && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setEditing(false);
        setEditText(post.texto);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, menuOpen, post.texto]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePost(post._id);
      setConfirmDelete(false);
      onDeleted?.(post._id);
      success("Post eliminado");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updatePost(user._id, post._id, { texto: editText });
      setEditing(false);
      onUpdated?.(updated);
      success("Post actualizado");
    } finally {
      setSaving(false);
    }
  };

  const refreshComments = async () => {
    try {
      const data = await api.getComments(post._id);
      setComments(data);
      const uniqueIds = Array.from(new Set(data.map((c) => c.user)));
      const missing = uniqueIds.filter((id) => !(id in nicks));
      if (missing.length === 0) return;
      const results = await Promise.all(
        missing.map((id) =>
          api
            .getUser(id)
            .then((u) => [id, u.nickname] as const)
            .catch(() => [id, "anon"] as const)
        )
      );
      setNicks((prev) => {
        const next = { ...prev };
        for (const [id, nick] of results) next[id] = nick;
        return next;
      });
    } catch {
      // ignorar
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const value = newComment.trim();
    if (!value) return;
    setPostingComment(true);
    try {
      await api.createComment(user._id, post._id, value);
      setNewComment("");
      await refreshComments();
      success("Comentario publicado");
    } finally {
      setPostingComment(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (editing) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select")) return;
    navigate(`/post/${post._id}`);
  };

  return (
    <article
      className={`card post-card post-card--clickable${isNew ? " post-card--new" : ""}`}
      ref={cardRef}
      onClick={handleCardClick}
    >
      <header className="post-head">
        <div className="post-avatar" aria-hidden>
          {getAvatarLetter(owner)}
        </div>
        <div className="post-head-meta">
          <span className="post-nick">@{getOwnerNick(owner)}</span>
          <span className="post-date muted">{relativeTime(fecha)}</span>
        </div>

        <div className="post-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="post-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            title="Opciones"
          >
            ···
          </button>
          {menuOpen && (
            <div className="post-menu-dropdown">
              <button
                type="button"
                className="post-menu-item"
                onClick={() => { setMenuOpen(false); onVerMas?.(post._id); }}
              >
                Ver más
              </button>
              {isOwner && (
                <>
                  <button
                    type="button"
                    className="post-menu-item"
                    onClick={() => { setMenuOpen(false); setEditText(post.texto); setEditing(true); }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="post-menu-item post-menu-item--danger"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {urls.length > 0 && <ImageCarousel urls={urls} height={460} />}

      {editing ? (
        <div className="post-edit-form">
          <textarea
            className="post-edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="post-edit-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setEditText(post.texto); }}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <p className="post-text">{post.texto}</p>
      )}

      {post.tags && post.tags.length > 0 && (
        <ul className="post-tags">
          {post.tags.map((t) => (
            <li key={t._id} className="post-tag">#{t.nombre}</li>
          ))}
        </ul>
      )}

      {comments.length > 0 && (
        <ul className="comments-preview">
          {comments.slice(0, 2).map((c) => {
            const nick = nicks[c.user] ?? "...";
            const letter = (nick.charAt(0) || "?").toUpperCase();
            return (
              <li key={c._id} className="comment-preview-item">
                <div className="comment-preview-avatar" aria-hidden>{letter}</div>
                <div className="comment-preview-body">
                  <span className="comment-preview-nick">@{nick}</span>
                  <p className="comment-preview-text">{c.texto}</p>
                </div>
              </li>
            );
          })}
          {comments.length > 2 && (
            <li className="comments-preview-more">
              <button
                type="button"
                className="post-ver-mas"
                onClick={() => (onVerMas ? onVerMas(post._id) : navigate(`/post/${post._id}`))}
              >
                Ver {comments.length - 2} comentarios más
              </button>
            </li>
          )}
        </ul>
      )}

      <footer className="post-foot">
        <span className="muted">
          {(() => {
            const n = comments.length || commentsCount;
            return `${n} ${n === 1 ? "comentario" : "comentarios"}`;
          })()}
        </span>
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <input
            className="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Escribí un comentario..." : "Iniciá sesión para comentar"}
            disabled={!user || postingComment}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!user || postingComment || !newComment.trim()}
          >
            {postingComment ? "..." : "Enviar"}
          </button>
        </form>
      </footer>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar post"
        message="¿Seguro que querés eliminar este post?"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </article>
  );
}
