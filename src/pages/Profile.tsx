import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post, User } from "../types";
import { relativeTime } from "../utils/time";

export function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwn = !routeId || routeId === user?._id;
  const targetId = isOwn ? user?._id : routeId;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);

    const fetchProfile = isOwn
      ? Promise.resolve(user)
      : api.getUser(targetId);

    Promise.all([fetchProfile, api.getPostsByUser(targetId)])
      .then(([u, p]) => {
        setProfileUser(u);
        setPosts(p);
      })
      .catch(() => {
        setProfileUser(null);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [targetId, isOwn, user]);

  if (!isOwn && !routeId) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="container feed">
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  const displayUser = isOwn ? user : profileUser;
  if (!displayUser) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container feed">
      <div className="profile-head">
        <div className="profile-avatar-xl">
          {displayUser.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1 className="profile-nick">@{displayUser.nickname}</h1>
          <span className="muted">
            {posts.length} {posts.length === 1 ? "publicacion" : "publicaciones"}
          </span>
        </div>
        {isOwn && (
          <div className="profile-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate("/")}title="Crear post"
            >
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
              title="Cerrar sesion"
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
          {posts.map((p) => {
            const fecha = p.fechaPublicacion ?? p.createdAt;
            return (
              <li key={p._id}>
                <article className="card post-card">
                  <header className="post-head">
                    <div className="post-avatar" aria-hidden>
                      {displayUser.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="post-head-meta">
                      <span className="post-nick">@{displayUser.nickname}</span>
                      <span className="post-date muted">
                        {relativeTime(fecha)}
                      </span>
                    </div>
                  </header>
                  <p className="post-text">{p.texto}</p>
                  {p.tags && p.tags.length > 0 && (
                    <ul className="post-tags">
                      {p.tags.map((t) => (
                        <li key={t._id} className="post-tag">
                          #{t.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
