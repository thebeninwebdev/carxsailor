export function safeNext(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://carxsailor.local");
    if (url.origin !== "https://carxsailor.local" || /^\/(?:login|register|api)(?:\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
export function postLoginDestination(role: string, hasVendorProfile: boolean, callback?: unknown) {
  const fallback = role === "ADMIN" ? "/admin" : hasVendorProfile || role === "VENDOR" ? "/vendor" : "/dashboard";
  const path = safeNext(callback, fallback);
  if (role !== "ADMIN" && /^\/admin(?:[/?#]|$)/.test(path)) return fallback;
  if (role === "ADMIN" && /^\/vendor(?:[/?#]|$)/.test(path)) return "/admin";
  return path;
}
