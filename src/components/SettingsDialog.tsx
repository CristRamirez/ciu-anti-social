import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { Modal } from "./Modal";
import type { Theme } from "../context/ThemeContext";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "cuenta" | "aplicacion";

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("cuenta");
  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState(user?.nickname ?? "");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickError, setNickError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditNick = () => {
    setNickValue(user?.nickname ?? "");
    setNickError("");
    setEditingNick(true);
  };

  const cancelEditNick = () => {
    setEditingNick(false);
    setNickError("");
  };

  const saveNick = async () => {
    if (!user || !nickValue.trim()) return;
    setNickSaving(true);
    setNickError("");
    try {
      const updated = await api.updateUser(user._id, nickValue.trim());
      updateUser({ nickname: updated.nickname });
      setEditingNick(false);
      success("Nickname actualizado");
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

  const handleSetTheme = (next: Theme) => {
    if (next === theme) return;
    setTheme(next);
    success(next === "light" ? "Tema claro activado" : "Tema oscuro activado");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await api.deleteUser(user._id);
      setConfirmDeleteOpen(false);
      logout();
      navigate("/register");
    } catch (err) {
      setDeleting(false);
      setNickError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajustes">
      <div className="settings-dialog">
        <div className="settings-dialog-tabs">
          <button
            type="button"
            className={tab === "cuenta" ? "settings-dialog-tab active" : "settings-dialog-tab"}
            onClick={() => setTab("cuenta")}
          >
            Cuenta
          </button>
          <button
            type="button"
            className={tab === "aplicacion" ? "settings-dialog-tab active" : "settings-dialog-tab"}
            onClick={() => setTab("aplicacion")}
          >
            Aplicacion
          </button>
        </div>

        <div className="settings-dialog-content">
          {tab === "cuenta" && (
            <div className="settings-dialog-section">
              <label className="settings-dialog-label">Nickname</label>
              {editingNick ? (
                <div className="nick-row">
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
                  <button type="button" className="icon-btn" onClick={cancelEditNick} disabled={nickSaving} title="Cancelar">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="nick-row">
                  <span className="profile-nick">@{user?.nickname}</span>
                  <button type="button" className="icon-btn" onClick={startEditNick} title="Editar nickname">
                    ✏️
                  </button>
                </div>
              )}
              {nickError && <span className="nick-error">{nickError}</span>}

              <div className="settings-danger-zone">
                <label className="settings-dialog-label">Zona de peligro</label>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}

          {tab === "aplicacion" && (
            <div className="settings-dialog-section">
              <label className="settings-dialog-label">Tema</label>
              <div className="theme-picker">
                <button
                  type="button"
                  className={theme === "light" ? "theme-card active" : "theme-card"}
                  onClick={() => handleSetTheme("light")}
                >
                  <span className="theme-card-swatch theme-card-swatch-light" />
                  Claro
                </button>
                <button
                  type="button"
                  className={theme === "dark" ? "theme-card active" : "theme-card"}
                  onClick={() => handleSetTheme("dark")}
                >
                  <span className="theme-card-swatch theme-card-swatch-dark" />
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
        message="¿Seguro? Esta accion no se puede deshacer"
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Modal>
  );
}
