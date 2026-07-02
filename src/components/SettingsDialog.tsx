import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";

type Tab = "cuenta" | "app";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("cuenta");

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    try {
      await api.deleteUser(user._id);
      success("Cuenta eliminada");
      logout();
      setConfirmDeleteOpen(false);
      onClose();
      navigate("/register");
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (open) {
      setNickname(user?.nickname ?? "");
      setError(null);
      setTab("cuenta");
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    const value = nickname.trim();
    if (!value) {
      setError("El nickname no puede estar vacío.");
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      setError("Solo letras y números, sin espacios.");
      return;
    }
    if (value.length > 20) {
      setError("Máximo 20 caracteres.");
      return;
    }
    if (value === user.nickname) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateUser(user._id, value);
      updateUser({ nickname: updated.nickname });
      success("Nickname modificado exitosamente");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "No se pudo actualizar";
      const friendly = /E11000|duplicate key/i.test(raw)
        ? "Ese nickname ya está en uso"
        : raw;
      setError(friendly);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajustes">
      <div className="settings-layout">
        <nav className="settings-tabs">
          <button
            type="button"
            className={`settings-tab ${tab === "cuenta" ? "active" : ""}`}
            onClick={() => setTab("cuenta")}
          >
            Cuenta
          </button>
          <button
            type="button"
            className={`settings-tab ${tab === "app" ? "active" : ""}`}
            onClick={() => setTab("app")}
          >
            Aplicación
          </button>
        </nav>

        <div className="settings-panel">
          {tab === "cuenta" && (
            <div className="settings-section">
              <h3>Editar nickname</h3>
              <div className="edit-profile-nick">
                <span className="nick-at">@</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <button
                  type="button"
                  className="icon-btn small"
                  onClick={handleSave}
                  disabled={saving}
                  title="Guardar"
                  aria-label="Guardar"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
              {error && <div className="alert alert-error">{error}</div>}

              <hr className="settings-divider" />

              <h3 className="danger-zone-title">Zona de peligro</h3>
              <p className="muted small">
                Al eliminar tu cuenta perdés acceso a tus publicaciones.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Eliminar cuenta
              </button>
            </div>
          )}

          {tab === "app" && (
            <div className="settings-section">
              <h3>Tema</h3>
              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-option ${theme === "light" ? "active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                  Claro
                </button>
                <button
                  type="button"
                  className={`theme-option ${theme === "dark" ? "active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Oscuro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar cuenta"
        message="¿Seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deletingAccount}
        onCancel={() => {
          if (!deletingAccount) setConfirmDeleteOpen(false);
        }}
        onConfirm={handleDeleteAccount}
      />
    </Modal>
  );
}
