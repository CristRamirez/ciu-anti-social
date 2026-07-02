import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { PostComposer } from "../components/PostComposer";
import type { Post, Tag } from "../types";

const PAGE_SIZE = 10;

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<"latest" | "popular">("latest");
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getPosts(), api.getTags()])
      .then(async ([ps, ts]) => {
        if (cancelled) return;
        setPosts(ps);
        setTags(ts);
        const entries = await Promise.all(
          ps.map(async (p) => {
            try {
              const cs = await api.getCommentsByPost(p._id);
              return [p._id, cs.length] as const;
            } catch {
              return [p._id, 0] as const;
            }
          })
        );
        if (!cancelled) setCommentCounts(Object.fromEntries(entries));
      })
      .catch((e) =>
        !cancelled && setError(e instanceof Error ? e.message : "Error cargando feed")
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const created = (e: Event) => {
      const ev = e as CustomEvent<Post>;
      if (ev.detail) {
        setPosts((prev) => [ev.detail, ...prev]);
        setNewIds((prev) => new Set(prev).add(ev.detail._id));
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            next.delete(ev.detail._id);
            return next;
          });
        }, 600);
      }
    };
    const deleted = (e: Event) => {
      const ev = e as CustomEvent<string>;
      if (ev.detail) setPosts((prev) => prev.filter((p) => p._id !== ev.detail));
    };
    window.addEventListener("post-created", created as EventListener);
    window.addEventListener("post-deleted", deleted as EventListener);
    return () => {
      window.removeEventListener("post-created", created as EventListener);
      window.removeEventListener("post-deleted", deleted as EventListener);
    };
  }, []);

  const filtered = useMemo(() => {
    const base = tagFilter
      ? posts.filter((p) => p.tags?.some((t) => t._id === tagFilter))
      : posts;
    if (sortMode === "popular") {
      return [...base].sort(
        (a, b) => (commentCounts[b._id] ?? 0) - (commentCounts[a._id] ?? 0)
      );
    }
    return [...base].sort((a, b) => {
      const da = new Date(a.fechaPublicacion ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.fechaPublicacion ?? b.createdAt ?? 0).getTime();
      return db - da;
    });
  }, [posts, tagFilter, sortMode, commentCounts]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tagFilter, sortMode]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="home">
      <PostComposer
        onCreated={(p) => {
          setPosts((prev) => [p, ...prev]);
          setNewIds((prev) => new Set(prev).add(p._id));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(p._id);
              return next;
            });
          }, 600);
        }}
      />

      <section className="feed-section">
        <header className="feed-head">
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
          <div className="filter">
            <label htmlFor="tag-filter">Etiqueta</label>
            <select
              id="tag-filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {tags.map((t) => (
                <option key={t._id} value={t._id}>#{t.nombre}</option>
              ))}
            </select>
          </div>
        </header>

        {loading && <div className="muted">Cargando feed...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="muted">No hay publicaciones todavía.</div>
        )}

        <div className="feed">
          {visible.map((p) => (
            <PostCard key={p._id} post={p} isNew={newIds.has(p._id)} />
          ))}
        </div>

        {hasMore && (
          <div className="load-more">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Cargar más ({filtered.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
