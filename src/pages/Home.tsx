import { useEffect, useState } from "react";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import type { Post, Tag } from "../types";

function getPostDate(p: Post): number {
  const raw = p.fechaPublicacion ?? p.createdAt;
  return raw ? new Date(raw).getTime() : 0;
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
      <PostComposer onCreated={(post) => setPosts((prev) => [post, ...prev])} />
      {posts.length === 0 ? (
        <p className="muted">No hay posts todavía.</p>
      ) : (
        <ul className="feed-list">
          {posts.map((p) => (
            <li key={p._id}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
