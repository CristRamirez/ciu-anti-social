import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import type { Post, Tag } from "../types";

type SortMode = "latest" | "popular";

function getPostDate(p: Post): number {
  const raw = p.fechaPublicacion ?? p.createdAt;
  return raw ? new Date(raw).getTime() : 0;
}

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

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
    if (posts.length === 0) return;
    let cancelled = false;
    Promise.all(
      posts.map((p) =>
        api
          .getComments(p._id)
          .then((cs) => [p._id, cs.length] as const)
          .catch(() => [p._id, 0] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setCommentCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [posts]);

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

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    if (sortMode === "popular") {
      copy.sort((a, b) => (commentCounts[b._id] ?? 0) - (commentCounts[a._id] ?? 0));
    } else {
      copy.sort((a, b) => getPostDate(b) - getPostDate(a));
    }
    return copy;
  }, [posts, sortMode, commentCounts]);

  return (
    <div className="container feed">
      <h1 className="feed-title">Feed</h1>
      <PostComposer onCreated={(post) => setPosts((prev) => [post, ...prev])} />

      <div className="feed-tabs">
        <button
          type="button"
          className={`feed-tab ${sortMode === "latest" ? "active" : ""}`}
          onClick={() => setSortMode("latest")}
        >
          Últimos
        </button>
        <button
          type="button"
          className={`feed-tab ${sortMode === "popular" ? "active" : ""}`}
          onClick={() => setSortMode("popular")}
        >
          Populares
        </button>
      </div>

      {sortedPosts.length === 0 ? (
        <p className="muted">No hay posts todavía.</p>
      ) : (
        <ul className="feed-list">
          {sortedPosts.map((p) => (
            <li key={p._id}>
              <PostCard post={p} commentsCount={commentCounts[p._id] ?? 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
