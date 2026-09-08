export function safeNext(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  try { const url = new URL(value, "https://carxsailor.local"); return url.origin === "https://carxsailor.local" ? url.pathname + url.search + url.hash : "/dashboard"; } catch { return "/dashboard"; }
}
