import { useEffect, useMemo, useState } from "react";

interface Props {
  urls: string[];
  height?: number;
  onDelete?: (idx: number) => void;
}

const proxied = (url: string) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&default=blank`;

export function ImageCarousel({ urls, height = 320, onDelete }: Props) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [tried, setTried] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () =>
      urls
        .map((url, origIdx) => ({ url, origIdx }))
        .filter(({ url }) => !failed.has(url)),
    [urls, failed]
  );

  useEffect(() => {
    if (idx >= visible.length && visible.length > 0) setIdx(visible.length - 1);
  }, [visible.length, idx]);

  if (urls.length === 0) return null;
  if (visible.length === 0) {
    return (
      <div className="carousel carousel-broken" style={{ height: 64 }}>
        <div className="carousel-broken-msg">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Imagen no disponible (el sitio bloquea el hotlink).</span>
        </div>
        {onDelete && (
          <button
            type="button"
            className="carousel-delete"
            onClick={() => onDelete(0)}
            title="Eliminar imagen"
            aria-label="Eliminar imagen"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  const prev = () => setIdx((i) => (i === 0 ? visible.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === visible.length - 1 ? 0 : i + 1));

  return (
    <div className="carousel" style={{ height }}>
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {visible.map(({ url }, i) => (
          <div className="carousel-slide" key={`${url}-${i}`}>
            <img
              src={tried.has(url) ? proxied(url) : url}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => {
                if (!tried.has(url)) {
                  setTried((prev) => {
                    const next = new Set(prev);
                    next.add(url);
                    return next;
                  });
                  return;
                }
                setFailed((prev) => {
                  if (prev.has(url)) return prev;
                  const next = new Set(prev);
                  next.add(url);
                  return next;
                });
              }}
            />
          </div>
        ))}
      </div>

      {visible.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow left"
            onClick={prev}
            aria-label="Anterior"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="carousel-arrow right"
            onClick={next}
            aria-label="Siguiente"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="carousel-dots">
            {visible.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel-dot ${i === idx ? "active" : ""}`}
                onClick={() => setIdx(i)}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
          <div className="carousel-counter">
            {idx + 1}/{visible.length}
          </div>
        </>
      )}

      {onDelete && (
        <button
          type="button"
          className="carousel-delete"
          onClick={() => onDelete(visible[idx]?.origIdx ?? idx)}
          title="Eliminar imagen"
          aria-label="Eliminar imagen"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}
