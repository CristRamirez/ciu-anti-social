import { useEffect, useState } from "react";

interface Props {
  urls: string[];
  height?: number;
  onDelete?: (idx: number) => void;
}

export function ImageCarousel({ urls, height = 320, onDelete }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= urls.length && urls.length > 0) setIdx(urls.length - 1);
  }, [urls.length, idx]);

  if (urls.length === 0) return null;

  const prev = () => setIdx((i) => (i === 0 ? urls.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === urls.length - 1 ? 0 : i + 1));

  return (
    <div className="carousel" style={{ height }}>
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {urls.map((url, i) => (
          <div className="carousel-slide" key={i}>
            <img
              src={url}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ))}
      </div>

      {urls.length > 1 && (
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
            {urls.map((_, i) => (
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
            {idx + 1}/{urls.length}
          </div>
        </>
      )}

      {onDelete && (
        <button
          type="button"
          className="carousel-delete"
          onClick={() => onDelete(idx)}
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
