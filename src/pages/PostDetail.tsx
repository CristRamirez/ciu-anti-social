import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImageCarousel } from "../components/ImageCarousel";
import { relativeTime } from "../utils/time";
import type { Comment, Post, PostImage, User } from "../types";

function getOwnerNick(user: Post["user"], users: User[]): string {
  if (typeof user === "object" && user !== null) return user.nickname;
  const found = users.find((u) => u._id === user);
  return found ? found.nickname : String(user);
}

function getAvatarLetter(nick: string): string {
  return nick.charAt(0).toUpperCase() || "?";
}


interface CommentItemProps {
  comment: Comment;
  nick: string;
  isOwn: boolean;
  postId: string;
  userId: string;
  onUpdated: (c: Comment) => void;
  onDeleted: (id: string) => void;
}

function CommentItem({ comment, nick, isOwn, postId, userId, onUpdated, onDeleted }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.texto);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateComment(userId, postId, comment._id, editText);
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteComment(userId, postId, comment._id);
      onDeleted(comment._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="comment-item card">
      <div className="comment-head">
        <span className="post-nick">@{nick}</span>
        <span className="post-date muted">{relativeTime(comment.createdAt)}</span>
        {isOwn && !editing && (
          <div className="comment-actions">
            <button type="button" className="post-edit-btn" onClick={() => { setEditText(comment.texto); setEditing(true); }} title="Editar">✏️</button>
            <button type="button" className="post-delete-btn" onClick={() => setConfirmDel(true)} title="Eliminar">🗑️</button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="post-edit-form">
          <textarea
            className="post-edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="post-edit-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-text">{comment.texto}</p>
      )}

      <ConfirmDialog
        open={confirmDel}
        title="Eliminar comentario"
        message="¿Seguro que querés eliminar este comentario?"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </li>
  );
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allTags, setAllTags] = useState<import("../types").Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageAdding, setImageAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getPosts(),
      api.getPostImages(id),
      api.getComments(id),
      api.getUsers(),
      api.getTags(),
    ])
      .then(([posts, imgs, cmts, usrs, tags]) => {
        const found = posts.find((p) => p._id === id);
        if (!found) { setError("Post no encontrado"); return; }
        setPost(found);
        setImages(imgs);
        setComments(cmts);
        setUsers(usrs);
        setAllTags(tags);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container feed"><p className="muted">Cargando...</p></div>;
  if (error || !post) return <div className="container feed"><div className="alert alert-error">{error ?? "No encontrado"}</div></div>;

  const ownerNick = getOwnerNick(post.user, users);
  const fecha = post.fechaPublicacion ?? post.createdAt;
  const ownerId = typeof post.user === "object" ? post.user._id : post.user;
  const isOwner = !!user && user._id === ownerId;

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await api.deletePost(post._id);
      navigate("/");
    } finally {
      setDeleting(false);
    }
  };

  const toggleEditTag = (tagId: string) => {
    setEditTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteImage = async (imgIdx: number) => {
    if (!user) return;
    const img = images[imgIdx];
    if (!img) return;
    try {
      await api.deletePostImage(user._id, post._id, img._id);
      setImages((prev) => prev.filter((_, i) => i !== imgIdx));
    } catch {
      // ignore
    }
  };

  const handleAddImage = async () => {
    if (!user || !newImageUrl.trim()) return;
    setImageAdding(true);
    try {
      const img = await api.addPostImage(user._id, post._id, newImageUrl.trim());
      setImages((prev) => [...prev, img]);
      setNewImageUrl("");
    } finally {
      setImageAdding(false);
    }
  };

  const handleEditSave = async () => {
    if (!user) return;
    setEditSaving(true);
    try {
      const updated = await api.updatePost(user._id, post._id, { texto: editText, tags: editTags });
      setPost(updated);
      setEditing(false);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="container feed">
      <button type="button" className="btn btn-ghost detail-back" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <article className="card post-detail-card">
        <header className="post-head">
          <div className="post-avatar">{getAvatarLetter(ownerNick)}</div>

          <div className="post-head-meta">
            <span className="post-nick">@{ownerNick}</span>
            <span className="post-date muted">{relativeTime(fecha)}</span>
          </div>
          {isOwner && !editing && (
            <>
              <button
                type="button"
                className="post-edit-btn"
                onClick={() => { setEditText(post.texto); setEditTags(post.tags.map((t) => t._id)); setEditing(true); }}
                title="Editar"
              >
                ✏️
              </button>
              <button
                type="button"
                className="post-delete-btn"
                onClick={() => setConfirmDelete(true)}
                title="Eliminar"
              >
                🗑️
              </button>
            </>
          )}
        </header>

        {images.length > 0 && (
          <ImageCarousel
            urls={images.map((i) => i.url_image)}
            height={560}
            onDelete={editing ? handleDeleteImage : undefined}
          />
        )}

        {editing && (
          <div className="image-add-row">
            <input
              className="image-add-input"
              type="url"
              placeholder="URL de imagen..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleAddImage}
              disabled={imageAdding || !newImageUrl.trim()}
            >
              {imageAdding ? "..." : "Agregar"}
            </button>
          </div>
        )}

        {editing ? (
          <div className="post-edit-form">
            <textarea
              className="post-edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              autoFocus
            />
            {allTags.length > 0 && (
              <div className="edit-tag-picker">
                {allTags.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    className={`edit-tag-chip${editTags.includes(t._id) ? " selected" : ""}`}
                    onClick={() => toggleEditTag(t._id)}
                  >
                    #{t.nombre}
                  </button>
                ))}
              </div>
            )}
            <div className="post-edit-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="post-text detail-text">{post.texto}</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <ul className="post-tags">
            {post.tags.map((t) => (
              <li key={t._id} className="post-tag">#{t.nombre}</li>
            ))}
          </ul>
        )}
      </article>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar post"
        message="¿Seguro que querés eliminar este post?"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />

      <section className="detail-comments">
        <h2 className="detail-comments-title">
          {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
        </h2>

        {user && (
          <form
            className="comment-form card"
            onSubmit={async (e) => {
              e.preventDefault();
              const texto = commentText.trim();
              if (!texto) return;
              setCommentSending(true);
              setCommentError(null);
              try {
                await api.createComment(user._id, id!, texto);
                setCommentText("");
                const fresh = await api.getComments(id!);
                setComments(fresh);
                textareaRef.current?.focus();
              } catch (err) {
                setCommentError(err instanceof Error ? err.message : "Error");
              } finally {
                setCommentSending(false);
              }
            }}
          >
            <textarea
              ref={textareaRef}
              className="comment-textarea"
              placeholder="Escribí un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 255))}
              rows={3}
              maxLength={255}
            />
            {commentError && <p className="alert alert-error">{commentError}</p>}
            <div className="comment-form-foot">
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {commentText.length}/255
              </span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={commentSending || !commentText.trim()}
              >
                {commentSending ? "Enviando..." : "Comentar"}
              </button>
            </div>
          </form>
        )}

        {!user && (
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Iniciá sesión para comentar.
          </p>
        )}

        {comments.length === 0 && <p className="muted">Sin comentarios todavía.</p>}

        <ul className="comment-list">
          {comments.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              nick={users.find((u) => u._id === c.user)?.nickname ?? c.user}
              isOwn={!!user && user._id === c.user}
              postId={id!}
              userId={user?._id ?? ""}
              onUpdated={(updated) =>
                setComments((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
              }
              onDeleted={(cid) =>
                setComments((prev) => prev.filter((x) => x._id !== cid))
              }
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
