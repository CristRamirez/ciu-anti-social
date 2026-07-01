import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";
import { relativeTime } from "../utils/time";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .getPostsByUser(user._id)
      .then((data) => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container feed">
      <div className="profile-head">
        <div className="profile-avatar-xl">
          {user.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1 className="profile-nick">@{user.nickname}</h1>
          <span className="muted">
            {posts.length} {posts.length === 1 ? "publicacion" : "publicaciones"}
          </span>
        </div>
        <div className="profile-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/")}
            title="Crear post"
          >
            + Crear post
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
      </div>

      {loading ? (
        <p className="muted">Cargando publicaciones...</p>
      ) : posts.length === 0 ? (
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
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="post-head-meta">
                      <span className="post-nick">@{user.nickname}</span>
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
