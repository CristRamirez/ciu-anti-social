import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Comment, Post, PostImage, Tag, User } from "../types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImageCarousel } from "../components/ImageCarousel";
import { EmojiPicker } from "../components/EmojiPicker";
import { relativeTime } from "../utils/time";

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickById, setNickById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [commentEditError, setCommentEditError] = useState<string | null>(null);

  const startEditComment = (id: string, current: string) => {
    setEditingCommentId(id);
    setCommentDraft(current);
    setCommentEditError(null);
  };

  const handleDeleteComment = async (id: string) => {
    if (!user || !post) return;
    if (!confirm("¿Eliminar este comentario?")) return;
    try {
      await api.deleteComment(user._id, post._id, id);
      setComments((prev) => prev.filter((c) => c._id !== id));
      success("Comentario eliminado");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setCommentEditError(null);
  };
  const saveEditComment = async (id: string) => {
    if (!user || !post) return;
    const value = commentDraft.trim();
    if (!value) {
      setCommentEditError("No puede quedar vacío.");
      return;
    }
    setSavingCommentId(id);
    setCommentEditError(null);
    try {
      await api.updateComment(user._id, post._id, id, value);
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, texto: value } : c))
      );
      setEditingCommentId(null);
      success("Comentario actualizado");
    } catch (err) {
      setCommentEditError(
        err instanceof Error ? err.message : "No se pudo actualizar"
      );
    } finally {
      setSavingCommentId(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getPosts()
      .then(async (posts) => {
        const found = posts.find((p) => p._id === id);
        if (!found) throw new Error("Publicación no encontrada");
        if (cancelled) return;
        setPost(found);

        const userObj = typeof found.user === "object" ? (found.user as User) : null;
        const userId = userObj?._id ?? (found.user as string);

        const [imgs, cs] = await Promise.all([
          api.getPostImages(userId, found._id).catch(() => []),
          api.getCommentsByPost(found._id).catch(() => []),
        ]);
        if (cancelled) return;
        setImages(imgs);
        setComments(cs);

        const ids = Array.from(new Set(cs.map((c) => c.user)));
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
        if (!cancelled) {
          setNickById(Object.fromEntries(entries));
        }
      })
      .catch((e) =>
        !cancelled &&
        setError(e instanceof Error ? e.message : "Error cargando post")
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refreshComments = async () => {
    if (!post) return;
    const cs = await api.getCommentsByPost(post._id);
    setComments(cs);
    const missing = cs.filter((c) => !nickById[c.user]);
    if (missing.length > 0) {
      const entries = await Promise.all(
        Array.from(new Set(missing.map((m) => m.user))).map(async (uid) => {
          try {
            const u = await api.getUser(uid);
            return [uid, u?.nickname ?? "anon"] as const;
          } catch {
            return [uid, "anon"] as const;
          }
        })
      );
      setNickById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setOkMsg(null);
    if (!user) {
      setFormError("Iniciá sesión para comentar.");
      return;
    }
    if (!text.trim()) {
      setFormError("El comentario no puede estar vacío.");
      return;
    }
    if (!post) return;
    setSubmitting(true);
    try {
      await api.createComment(user._id, post._id, text.trim());
      setText("");
      setOkMsg("Comentario publicado.");
      success("Comentario publicado");
      await refreshComments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al comentar");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container muted">Cargando...</div>;
  if (error) return <div className="container alert alert-error">{error}</div>;
  if (!post) return null;

  const userObj = typeof post.user === "object" ? (post.user as User) : null;
  const ownerId = userObj?._id ?? (post.user as string);
  const isOwner = !!user && ownerId === user._id;

  const startEdit = () => {
    setDraft(post.texto);
    setSelectedTagIds((post.tags ?? []).map((t) => t._id));
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
    if (!user || !post) return;
    const value = draft.trim();
    if (!value) {
      setPostError("No puede quedar vacío.");
      return;
    }
    const currentTagIds = (post.tags ?? []).map((t) => t._id).sort().join(",");
    const newTagIds = [...selectedTagIds].sort().join(",");
    const textChanged = value !== post.texto;
    const tagsChanged = currentTagIds !== newTagIds;
    if (!textChanged && !tagsChanged) {
      setEditing(false);
      return;
    }
    setSavingPost(true);
    setPostError(null);
    try {
      const updated = await api.updatePost(user._id, post._id, value, selectedTagIds);
      setPost({ ...post, texto: updated.texto, tags: updated.tags ?? [] });
      success("Post actualizado");
      setEditing(false);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePost(post._id);
      success("Post eliminado");
      window.dispatchEvent(
        new CustomEvent("post-deleted", { detail: post._id })
      );
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar");
      setDeleting(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post) return;
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
    if (!user || !post) return;
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

  return (
    <div className="container detail">
      <Link to="/" className="link-back">← Volver al feed</Link>

      <article className="card">
        <header className="post-head">
          <Link to={`/u/${ownerId}`} className="post-head-link">
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
          {isOwner && !editing && (
            <div className="post-owner-actions">
              <button
                type="button"
                className="icon-btn small post-edit-btn"
                onClick={startEdit}
                title="Editar post"
                aria-label="Editar post"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-btn small danger"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                title="Eliminar post"
                aria-label="Eliminar post"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          )}
        </header>

        {editing ? (
          <div className="post-edit">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={255}
              rows={4}
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
          <p className="post-text big">{post.texto}</p>
        )}

        {images.length > 0 && (
          <ImageCarousel
            urls={images.map((i) => i.url_image)}
            height={560}
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

        {post.tags?.length > 0 && (
          <div className="tags">
            {post.tags.map((t) => (
              <span className="tag" key={t._id}>#{t.nombre}</span>
            ))}
          </div>
        )}
      </article>

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
        onConfirm={handleDelete}
      />
      {deleteError && <div className="alert alert-error">{deleteError}</div>}

      <section className="card">
        <h2>Comentarios ({comments.length})</h2>

        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              user ? "Escribí un comentario..." : "Iniciá sesión para comentar"
            }
            disabled={!user || submitting}
            maxLength={255}
            rows={3}
          />
          {formError && <div className="alert alert-error">{formError}</div>}
          {okMsg && <div className="alert alert-ok">{okMsg}</div>}
          <div className="comment-form-foot">
            <EmojiPicker
              onSelect={(em) =>
                setText((t) => (t.length + em.length <= 255 ? t + em : t))
              }
            />
            <span className="muted">{text.length}/255</span>
            <button
              className="btn btn-primary btn-pill"
              disabled={!user || submitting}
            >
              {submitting ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </form>

        {comments.length === 0 && (
          <div className="muted">Todavía no hay comentarios.</div>
        )}

        <ul className="comment-list">
          {comments.map((c) => {
            const isCommentOwner = !!user && c.user === user._id;
            const isEditing = editingCommentId === c._id;
            return (
              <li key={c._id} className="comment">
                <Link to={`/u/${c.user}`} className="comment-avatar-link">
                  <div className="avatar small">
                    {(nickById[c.user] ?? "?")[0].toUpperCase()}
                  </div>
                </Link>
                <div className="comment-body">
                  <div className="comment-row">
                    <Link to={`/u/${c.user}`} className="comment-user">
                      @{nickById[c.user] ?? "anon"}
                    </Link>
                    {isCommentOwner && !isEditing && (
                      <div className="comment-actions">
                        <button
                          type="button"
                          className="icon-btn small"
                          onClick={() => startEditComment(c._id, c.texto)}
                          title="Editar comentario"
                          aria-label="Editar comentario"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="icon-btn small danger"
                          onClick={() => handleDeleteComment(c._id)}
                          title="Eliminar comentario"
                          aria-label="Eliminar comentario"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="comment-edit">
                      <textarea
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        maxLength={255}
                        rows={2}
                        autoFocus
                        disabled={savingCommentId === c._id}
                      />
                      {commentEditError && (
                        <div className="alert alert-error">{commentEditError}</div>
                      )}
                      <div className="comment-edit-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={cancelEditComment}
                          disabled={savingCommentId === c._id}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => saveEditComment(c._id)}
                          disabled={savingCommentId === c._id}
                        >
                          {savingCommentId === c._id ? "..." : "Guardar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-text">{c.texto}</div>
                  )}
                  {c.createdAt && (
                    <div className="post-date">{relativeTime(c.createdAt)}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
