import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Comment, Post, PostImage, User } from "../types";

function getOwnerNick(user: Post["user"], users: User[]): string {
  if (typeof user === "object" && user !== null) return user.nickname;
  const found = users.find((u) => u._id === user);
  return found ? found.nickname : String(user);
}

function getAvatarLetter(nick: string): string {
  return nick.charAt(0).toUpperCase() || "?";
}

function formatDate(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getPosts(),
      api.getPostImages(id),
      api.getComments(id),
      api.getUsers(),
    ])
      .then(([posts, imgs, cmts, usrs]) => {
        const found = posts.find((p) => p._id === id);
        if (!found) { setError("Post no encontrado"); return; }
        setPost(found);
        setImages(imgs);
        setComments(cmts);
        setUsers(usrs);
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
            <span className="post-date muted">{formatDate(fecha)}</span>
          </div>
        </header>

        {images.length > 0 && (
          <div className="detail-images">
            {images.map((img) => (
              <img key={img._id} src={img.url_image} alt="" className="detail-img" />
            ))}
          </div>
        )}

        <p className="post-text detail-text">{post.texto}</p>

        {post.tags && post.tags.length > 0 && (
          <ul className="post-tags">
            {post.tags.map((t) => (
              <li key={t._id} className="post-tag">#{t.nombre}</li>
            ))}
          </ul>
        )}
      </article>

      <section className="detail-comments">
        <h2 className="detail-comments-title">
          {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
        </h2>

        {comments.length === 0 && <p className="muted">Sin comentarios todavía.</p>}

        <ul className="comment-list">
          {comments.map((c) => {
            const nick = users.find((u) => u._id === c.user)?.nickname ?? c.user;
            return (
              <li key={c._id} className="comment-item card">
                <div className="comment-head">
                  <span className="post-nick">@{nick}</span>
                  <span className="post-date muted">{formatDate(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.texto}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
