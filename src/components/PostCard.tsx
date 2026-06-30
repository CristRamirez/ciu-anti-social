import type { Post, PostImage, User } from "../types";
import { ImageCarousel } from "./ImageCarousel";

interface PostCardProps {
  post: Post;
  images?: PostImage[];
  commentsCount?: number;
  onVerMas?: (postId: string) => void;
}

function getOwnerNick(user: Post["user"]): string {
  if (typeof user === "string") return user;
  return user?.nickname ?? "anon";
}

function getAvatarLetter(user: Post["user"]): string {
  const nick = getOwnerNick(user);
  return nick.charAt(0).toUpperCase() || "?";
}

function formatDate(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function PostCard({ post, images = [], commentsCount = 0, onVerMas }: PostCardProps) {
  const owner = post.user as User | string;
  const fecha = post.fechaPublicacion ?? post.createdAt;
  const urls = images.map((img) => img.url_image);

  return (
    <article className="card post-card">
      <header className="post-head">
        <div className="post-avatar" aria-hidden>
          {getAvatarLetter(owner)}
        </div>
        <div className="post-head-meta">
          <span className="post-nick">@{getOwnerNick(owner)}</span>
          <span className="post-date muted">{formatDate(fecha)}</span>
        </div>
      </header>

      {urls.length > 0 && <ImageCarousel urls={urls} height={460} />}

      <p className="post-text">{post.texto}</p>

      {post.tags && post.tags.length > 0 && (
        <ul className="post-tags">
          {post.tags.map((t) => (
            <li key={t._id} className="post-tag">
              #{t.nombre}
            </li>
          ))}
        </ul>
      )}

      <footer className="post-foot">
        <span className="muted">
          {commentsCount} {commentsCount === 1 ? "comentario" : "comentarios"}
        </span>
        <button
          type="button"
          className="post-ver-mas"
          onClick={() => onVerMas?.(post._id)}
        >
          Ver más
        </button>
      </footer>
    </article>
  );
}
