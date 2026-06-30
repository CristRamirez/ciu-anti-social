import { useEffect, useState } from "react";
import { api } from "../api";
import type { Post, Tag, User } from "../types";

function getOwnerNick(user: Post["user"]): string {
  if (typeof user === "string") return user;
  return user?.nickname ?? "anon";
}

function getPostDate(p: Post): number {
  const raw = p.fechaPublicacion ?? p.createdAt;
  return raw ? new Date(raw).getTime() : 0;
}

function formatDate(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getPosts()
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => getPostDate(b) - getPostDate(a));
        setPosts(sorted);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error cargando posts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getTags()
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {
        // tags son auxiliares, no rompen la home
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="container feed">
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container feed">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container feed">
      <h1 className="feed-title">Feed</h1>
      {posts.length === 0 ? (
        <p className="muted">No hay posts todavía.</p>
      ) : (
        <ul className="feed-list">
          {posts.map((p) => (
            <li key={p._id} className="card feed-item">
              <div className="feed-item-head">
                <strong>@{getOwnerNick(p.user as User | string)}</strong>
                <span className="muted">{formatDate(p.fechaPublicacion ?? p.createdAt)}</span>
              </div>
              <p className="feed-item-text">{p.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
