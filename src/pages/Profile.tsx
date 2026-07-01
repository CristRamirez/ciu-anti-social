import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post, User } from "../types";
import { PostCard } from "../components/PostCard";

export function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState("");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickError, setNickError] = useState("");

  const isOwn = !routeId || routeId === user?._id;
  const targetId = isOwn ? user?._id : routeId;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);

    if (isOwn) {
      api.getPostsByUser(targetId)
        .then((data) => {
          setProfileUser(user);
          setPosts(data);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    } else {
      Promise.all([api.getUser(targetId), api.getPostsByUser(targetId)])
        .then(([u, p]) => {
          setProfileUser(u);
          setPosts(p);
        })
        .catch(() => {
          setProfileUser(null);
          setPosts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [targetId, isOwn, user]);

  if (!user && !routeId) {
    navigate("/login");
    return null;
  }

  if (loading) return <div className="container feed"><p className="muted">Cargando...</p></div>;

  const displayUser = isOwn ? user : profileUser;
  if (!displayUser) return null;

  const startEditNick = () => {
    setNickValue(displayUser.nickname);
    setNickError("");
    setEditingNick(true);
  };

  const cancelEditNick = () => {
    setEditingNick(false);
    setNickValue("");
  };

  const saveNick = async () => {
    if (!user || !nickValue.trim()) return;
    setNickSaving(true);
    setNickError("");
    try {
      const updated = await api.updateUser(user._id, nickValue.trim());
      updateUser({ nickname: updated.nickname });
      setEditingNick(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/E11000|duplicate key/i.test(msg)) {
        setNickError("Ese nickname ya esta en uso");
      } else {
        setNickError(msg || "Error al guardar");
      }
    } finally {
      setNickSaving(false);
    }
  };

  const handleNickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveNick();
    if (e.key === "Escape") cancelEditNick();
  };

  return (
    <div className="container feed">
      <div className="profile-head">
        <div className="profile-avatar-xl">
          {displayUser.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="nick-row">
            {editingNick ? (
              <>
                <input
                  className="nick-input"
                  value={nickValue}
                  onChange={(e) => setNickValue(e.target.value)}
                  onKeyDown={handleNickKeyDown}
                  disabled={nickSaving}
                  autoFocus
                />
                <button type="button" className="icon-btn" onClick={saveNick} disabled={nickSaving} title="Guardar">
                  ✓
                </button>
                <button type="button" className="icon-btn" onClick={cancelEditNick} title="Cancelar">
                  ✕
                </button>
                {nickError && <span className="nick-error">{nickError}</span>}
              </>
            ) : (
              <>
                <h1 className="profile-nick">@{displayUser.nickname}</h1>
                {isOwn && (
                  <button type="button" className="icon-btn" onClick={startEditNick} title="Editar nickname">
                    ✏️
                  </button>
                )}
              </>
            )}
          </div>
          <span className="muted">
            {posts.length} {posts.length === 1 ? "publicacion" : "publicaciones"}
          </span>
        </div>
        {isOwn && user && (
          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/")}
            >
              + Crear post
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { logout(); navigate("/login"); }}
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="muted">No hay publicaciones todavia.</p>
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
