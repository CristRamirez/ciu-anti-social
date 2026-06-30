import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { relativeTime } from "../utils/time";
import type { Post, PostImage, User } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageCarousel } from "./ImageCarousel";

interface PostCardProps {
  post: Post;
  images?: PostImage[];
  commentsCount?: number;
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

export function PostCard({ post, images = [], commentsCount = 0, onVerMas, onUpdated, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const owner = post.user as User | string;
  const fecha = post.fechaPublicacion ?? post.createdAt;
  const urls = images.map((img) => img.url_image);
  const isOwner = !!user && user._id === getOwnerId(post.user);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.texto);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setEditing(false);
        setEditText(post.texto);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, post.texto]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePost(post._id);
      setConfirmDelete(false);
      onDeleted?.(post._id);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="card post-card" ref={cardRef}>
      <header className="post-head">
        <div className="post-avatar" aria-hidden>
          {getAvatarLetter(owner)}
        </div>
        <div className="post-head-meta">
          <span className="post-nick">@{getOwnerNick(owner)}</span>
          <span className="post-date muted">{relativeTime(fecha)}</span>
        </div>
        {isOwner && !editing && (
          <button
            type="button"
            className="post-edit-btn"
            onClick={() => { setEditText(post.texto); setEditing(true); }}
            title="Editar"
          >
            ✏️
          </button>
        )}
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

      <footer className="post-foot">
        <span className="muted">
          {commentsCount} {commentsCount === 1 ? "comentario" : "comentarios"}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isOwner && (
            <button
              type="button"
              className="post-delete-btn"
              onClick={() => setConfirmDelete(true)}
              title="Eliminar"
            >
              🗑️
            </button>
          )}
          <button
            type="button"
            className="post-ver-mas"
            onClick={() => onVerMas?.(post._id)}
          >
            Ver más
          </button>
        </div>
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
