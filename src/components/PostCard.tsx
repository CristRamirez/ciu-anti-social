import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Comment, Post, PostImage, Tag, User } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageCarousel } from "./ImageCarousel";
import { EmojiPicker } from "./EmojiPicker";
import { relativeTime } from "../utils/time";

interface Props {
  post: Post;
  isNew?: boolean;
}

export function PostCard({ post, isNew }: Props) {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const [images, setImages] = useState<PostImage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickById, setNickById] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userObj = typeof post.user === "object" ? (post.user as User) : null;
  const postOwnerId = userObj?._id ?? (post.user as string);
  const isOwner = !!user && postOwnerId === user._id;

  const [postText, setPostText] = useState(post.texto);
  const [postTags, setPostTags] = useState<Tag[]>(post.tags ?? []);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.texto);
  const [savingPost, setSavingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const url = newImageUrl.trim();
    if (!url) {
      setImageError("Pegá una URL.");
      return;
    }
    setAddingImage(true);
    setImageError(null);
    try {
      const created = await api.createPostImage(user._id, post._id, url);
      setImages((prev) => [...prev, created]);
      setNewImageUrl("");
      success("Imagen agregada");
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setAddingImage(false);
    }
  };

  const handleDeleteImage = async (i: number) => {
    if (!user) return;
    const img = images[i];
    if (!img) return;
    try {
      await api.deletePostImage(user._id, post._id, img._id);
      setImages((prev) => prev.filter((_, idx) => idx !== i));
      success("Imagen eliminada");
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePost(post._id);
      setRemoved(true);
      success("Post eliminado");
      window.dispatchEvent(
        new CustomEvent("post-deleted", { detail: post._id })
      );
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar");
      setDeleting(false);
    }
  };

  const startEdit = () => {
    setDraft(postText);
    setSelectedTagIds(postTags.map((t) => t._id));
    setPostError(null);
    setEditing(true);
    if (allTags.length === 0) {
      api.getTags().then(setAllTags).catch(() => setAllTags([]));
    }
  };
  const cancelEdit = () => {
    setEditing(false);
    setPostError(null);
  };
  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  const savePost = async () => {
    if (!user) return;
    const value = draft.trim();
    if (!value) {
      setPostError("No puede quedar vacío.");
      return;
    }
    const currentTagIds = postTags.map((t) => t._id).sort().join(",");
    const newTagIds = [...selectedTagIds].sort().join(",");
    const textChanged = value !== postText;
    const tagsChanged = currentTagIds !== newTagIds;
    if (!textChanged && !tagsChanged) {
      setEditing(false);
      return;
    }
    setSavingPost(true);
    setPostError(null);
    try {
      const updated = await api.updatePost(user._id, post._id, value, selectedTagIds);
      setPostText(updated.texto);
      setPostTags(updated.tags ?? []);
      success("Post actualizado");
      setEditing(false);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSavingPost(false);
    }
  };

  const resolveNicks = async (cs: Comment[]) => {
    const ids = Array.from(new Set(cs.map((c) => c.user))).filter(
      (id) => !nickById[id]
    );
    if (ids.length === 0) return;
    const entries = await Promise.all(
      ids.map(async (uid) => {
        try {
          const u = await api.getUser(uid);
          return [uid, u?.nickname ?? "anon"] as const;
        } catch {
          return [uid, "anon"] as const;
        }
      })
    );
    setNickById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  };

  useEffect(() => {
    let cancelled = false;
    if (postOwnerId && post._id) {
      api
        .getPostImages(postOwnerId, post._id)
        .then((imgs) => !cancelled && setImages(imgs))
        .catch(() => !cancelled && setImages([]));
    }
    api
      .getCommentsByPost(post._id)
      .then((cs) => {
        if (cancelled) return;
        setComments(cs);
        resolveNicks(cs);
      })
      .catch(() => !cancelled && setComments([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post._id, postOwnerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (!text.trim()) {
      setError("El comentario no puede estar vacío.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createComment(user._id, post._id, text.trim());
      setText("");
      const cs = await api.getCommentsByPost(post._id);
      setComments(cs);
      resolveNicks(cs);
      success("Comentario publicado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al comentar");
    } finally {
      setSubmitting(false);
    }
  };

  const preview = comments.slice(0, 2);
  const remaining = comments.length - preview.length;

  if (removed) return null;

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (editing) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, form, input, textarea, [data-no-nav]")) return;
    navigate(`/post/${post._id}`);
  };

  return (
    <article
      className={`card post-card post-card-clickable${isNew ? " post-card-enter" : ""}`}
      onClick={handleCardClick}
    >
      <header className="post-head">
        <Link to={`/u/${postOwnerId}`} className="post-head-link">
          <div className="avatar">{userObj?.nickname?.[0]?.toUpperCase() ?? "?"}</div>
          <div>
            <div className="post-user-row">
              <span className="post-user">@{userObj?.nickname ?? "anon"}</span>
              {(post.fechaPublicacion ?? post.createdAt) && (
                <span className="post-time">
                  · {relativeTime(post.fechaPublicacion ?? post.createdAt)}
                </span>
              )}
            </div>
          </div>
        </Link>
        {!editing && (
          <div className="post-menu" ref={menuRef}>
            <button
              type="button"
              className="icon-btn small"
              onClick={() => setMenuOpen((v) => !v)}
              title="Opciones"
              aria-label="Opciones"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {menuOpen && (
              <div className="post-menu-pop" role="menu">
                <button
                  type="button"
                  className="post-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/post/${post._id}`);
                  }}
                >
                  Ver más
                </button>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      className="post-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        startEdit();
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="post-menu-item danger"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                      disabled={deleting}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="post-edit">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={255}
            rows={3}
            autoFocus
            disabled={savingPost}
          />
          {allTags.length > 0 && (
            <div className="tag-picker">
              {allTags.map((t) => (
                <button
                  type="button"
                  key={t._id}
                  className={`tag-chip ${selectedTagIds.includes(t._id) ? "active" : ""}`}
                  onClick={() => toggleTag(t._id)}
                  disabled={savingPost}
                >
                  #{t.nombre}
                </button>
              ))}
            </div>
          )}
          {postError && <div className="alert alert-error">{postError}</div>}
          <div className="post-edit-actions">
            <span className="muted small">{draft.length}/255</span>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={cancelEdit}
              disabled={savingPost}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={savePost}
              disabled={savingPost}
            >
              {savingPost ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <p className="post-text">{postText}</p>
      )}

      {images.length > 0 && (
        <ImageCarousel
          urls={images.map((i) => i.url_image)}
          height={460}
          onDelete={isOwner && editing ? handleDeleteImage : undefined}
        />
      )}

      {isOwner && editing && (
        <form className="add-image" onSubmit={handleAddImage}>
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="URL de imagen"
            disabled={addingImage}
          />
          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={addingImage || !newImageUrl.trim()}
          >
            {addingImage ? "..." : "Agregar"}
          </button>
          {imageError && <div className="alert alert-error">{imageError}</div>}
        </form>
      )}

      {postTags.length > 0 && (
        <div className="tags">
          {postTags.map((t) => (
            <span className="tag" key={t._id}>#{t.nombre}</span>
          ))}
        </div>
      )}

      <footer className="post-foot">
        <span className="muted">{comments.length} comentarios</span>
      </footer>

      {preview.length > 0 && (
        <ul className="comment-preview">
          {preview.map((c) => {
            const nick = nickById[c.user] ?? "anon";
            return (
              <li key={c._id} className="comment-preview-item">
                <Link to={`/u/${c.user}`} className="comment-preview-link">
                  <div className="avatar small">{nick[0].toUpperCase()}</div>
                </Link>
                <div className="comment-preview-body">
                  <Link to={`/u/${c.user}`} className="comment-preview-user">
                    @{nick}
                  </Link>
                  <span className="comment-preview-text">{c.texto}</span>
                </div>
              </li>
            );
          })}
          {remaining > 0 && (
            <li>
              <Link to={`/post/${post._id}`} className="muted small">
                Ver {remaining} comentario{remaining > 1 ? "s" : ""} más
              </Link>
            </li>
          )}
        </ul>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar publicación"
        message="¿Seguro que querés eliminar este post? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setConfirmOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={async () => {
          await handleDelete();
          setConfirmOpen(false);
        }}
      />
      {deleteError && <div className="alert alert-error">{deleteError}</div>}

      <form onSubmit={handleSubmit} className="inline-comment">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Escribí un comentario..." : "Iniciá sesión para comentar"}
          disabled={!user || submitting}
          maxLength={255}
        />
        <EmojiPicker
          onSelect={(em) =>
            setText((t) => (t.length + em.length <= 255 ? t + em : t))
          }
        />
        <button
          type="submit"
          className="btn btn-primary btn-small btn-pill"
          disabled={!user || submitting || !text.trim()}
        >
          {submitting ? "..." : "Enviar"}
        </button>
      </form>
      {error && <div className="alert alert-error">{error}</div>}
    </article>
  );
}
