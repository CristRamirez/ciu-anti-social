export function relativeTime(input?: string | Date | null): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  const ms = date.getTime();
  if (isNaN(ms)) return "";
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 5) return "hace un instante";
  if (diff < 60) return `hace ${diff} s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `hace ${w} sem`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `hace ${mo} mes${mo > 1 ? "es" : ""}`;
  const y = Math.floor(d / 365);
  return `hace ${y} a`;
}
