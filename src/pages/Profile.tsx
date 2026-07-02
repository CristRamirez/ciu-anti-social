import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/Modal";
import { PostComposer } from "../components/PostComposer";
import { PostCard } from "../components/PostCard";
import type { Post, User } from "../types";

export function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const { user: authUser, logout, updateUser } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const targetId = routeId ?? authUser?._id ?? null;
  const isOwn = !!authUser && targetId === authUser._id;

  const [profileUser, setProfileUser] = useState<User | null>(
    isOwn ? authUser : null
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickError, setNickError] = useState<string | null>(null);

  const startEdit = () => {
    if (!authUser) return;
    setNickDraft(authUser.nickname);
    setNickError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setNickError(null);
  };

  const saveNick = async () => {
    if (!authUser) return;
    const value = nickDraft.trim();
    if (!value) {
      setNickError("El nickname no puede estar vacío.");
      return;
    }
    if (value === authUser.nickname) {
      setEditing(false);
      return;
    }
    setNickSaving(true);
    setNickError(null);
    try {
      const updated = await api.updateUser(authUser._id, value);
      updateUser({ nickname: updated.nickname });
      setProfileUser((prev) => (prev ? { ...prev, nickname: updated.nickname } : prev));
      success("Nickname modificado exitosamente");
      setEditing(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "No se pudo actualizar";
      const friendly = /E11000|duplicate key/i.test(raw)
        ? "Ese nickname ya está en uso"
        : raw;
      setNickError(friendly);
    } finally {
      setNickSaving(false);
    }
  };

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadUser = isOwn && authUser
      ? Promise.resolve(authUser)
      : api.getUser(targetId);

    Promise.all([loadUser, api.getPostsByUser(targetId)])
      .then(([u, ps]) => {
        if (cancelled) return;
        setProfileUser(u && u._id ? u : null);
        setPosts(ps);
      })
      .catch((e) =>
        !cancelled && setError(e instanceof Error ? e.message : "Error")
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [targetId, isOwn, authUser]);

  useEffect(() => {
    const baseTitle = "UnaHur Anti-Social Net";
    if (profileUser) document.title = `@${profileUser.nickname}`;
    else document.title = baseTitle;
    return () => {
      document.title = baseTitle;
    };
  }, [profileUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!targetId) return null;
  if (loading && !profileUser) return <div className="container muted">Cargando...</div>;
  if (!profileUser) {
    return (
      <div className="container">
        <div className="card ghost-user">
          <div className="ghost-avatar">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
          </div>
          <h1>Usuario no encontrado</h1>
          <Link to="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="profile-head card">
        <div className="avatar xl">{profileUser.nickname[0].toUpperCase()}</div>
        <div className="profile-info">
          {isOwn && editing ? (
            <div className="nick-edit">
              <span className="nick-at">@</span>
              <input
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNick();
                  if (e.key === "Escape") cancelEdit();
                }}
                disabled={nickSaving}
              />
              <button
                type="button"
                className="icon-btn small"
                onClick={saveNick}
                disabled={nickSaving}
                title="Guardar"
                aria-label="Guardar"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-btn small"
                onClick={cancelEdit}
                disabled={nickSaving}
                title="Cancelar"
                aria-label="Cancelar"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {nickError && <span className="nick-error">{nickError}</span>}
            </div>
          ) : (
            <div className="nick-row">
              <h1>@{profileUser.nickname}</h1>
              {isOwn && (
                <button
                  type="button"
                  className="icon-btn small"
                  onClick={startEdit}
                  title="Editar nickname"
                  aria-label="Editar nickname"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <p className="muted">
            {posts.length} {posts.length === 1 ? "publicación" : "publicaciones"}
          </p>
        </div>
        {isOwn && (
          <div className="profile-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setComposerOpen(true)}
              title="Crear post"
              aria-label="Crear post"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {isOwn && (
        <Modal
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          title="Nueva publicación"
        >
          <PostComposer
            onCreated={(p) => {
              setComposerOpen(false);
              setPosts((prev) => [p, ...prev]);
              window.dispatchEvent(new CustomEvent("post-created", { detail: p }));
            }}
          />
        </Modal>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="feed">
        {posts.map((p) => (
          <PostCard key={p._id} post={p} />
        ))}
        {!loading && posts.length === 0 && (
          <div className="muted center">
            {isOwn ? (
              <>Todavía no publicaste nada.</>
            ) : (
              <>@{profileUser.nickname} todavía no publicó nada.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
