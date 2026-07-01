import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextState {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => number;
  success: (message: string) => number;
  error: (message: string) => number;
  info: (message: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextState | undefined>(undefined);
const DISMISS_DELAY = 3200;

const toastColors: Record<ToastType, string> = {
  success: "var(--ok)",
  error: "var(--danger)",
  info: "var(--accent)",
};

const viewportStyle: CSSProperties = {
  position: "fixed",
  top: 16,
  left: 16,
  zIndex: 1000,
  width: "min(360px, calc(100vw - 32px))",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  pointerEvents: "none",
};

const iconStyle: CSSProperties = {
  width: 22,
  height: 22,
  flex: "0 0 auto",
  marginTop: 1,
};

const messageStyle: CSSProperties = {
  margin: 0,
  color: "var(--text)",
  fontSize: "0.92rem",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
  if (type === "success") {
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M8 12.4 10.7 15 16 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="m9 9 6 6m0-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill={color} />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    const timer = timers.current.get(id);

    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();

      setToasts((current) => [...current, { id, message, type }]);

      const timer = window.setTimeout(() => dismiss(id), DISMISS_DELAY);
      timers.current.set(id, timer);

      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string) => toast(message, "success"), [toast]);
  const error = useCallback((message: string) => toast(message, "error"), [toast]);
  const info = useCallback((message: string) => toast(message, "info"), [toast]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ toasts, toast, success, error, info, dismiss }),
    [toasts, toast, success, error, info, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div style={viewportStyle}>
            {toasts.map((toastItem) => {
              const color = toastColors[toastItem.type];

              return (
                <div
                  key={toastItem.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: `4px solid ${color}`,
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow)",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    pointerEvents: "auto",
                  }}
                  role={toastItem.type === "error" ? "alert" : "status"}
                  aria-live={toastItem.type === "error" ? "assertive" : "polite"}
                >
                  <ToastIcon type={toastItem.type} color={color} />
                  <p style={messageStyle}>{toastItem.message}</p>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}