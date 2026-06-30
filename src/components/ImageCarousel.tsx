import { useState } from "react";

interface ImageCarouselProps {
  urls: string[];
  height?: number;
}

export function ImageCarousel({ urls, height = 460 }: ImageCarouselProps) {
  const [idx, setIdx] = useState(0);

  if (urls.length === 0) return null;

  const single = urls.length === 1;

  const prev = () => setIdx((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setIdx((i) => (i + 1) % urls.length);

  return (
    <div className="carousel" style={{ height }}>
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" className="carousel-slide" />
        ))}
      </div>

      {!single && (
        <>
          <span className="carousel-counter">{idx + 1}/{urls.length}</span>
          <button type="button" className="carousel-arrow carousel-arrow-l" onClick={prev}>‹</button>
          <button type="button" className="carousel-arrow carousel-arrow-r" onClick={next}>›</button>
          <div className="carousel-dots">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`carousel-dot${i === idx ? " active" : ""}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
