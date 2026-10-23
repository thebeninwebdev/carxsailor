export const canonicalOrigin = "https://carxsailor.com";
export const productionOrigins = [canonicalOrigin, "https://www.carxsailor.com"] as const;

type Environment = Record<string, string | undefined>;

function validOrigin(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.pathname === "/" && !url.search && !url.hash
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}

export function applicationOrigin(env: Environment = process.env) {
  return validOrigin(env.BETTER_AUTH_URL) || validOrigin(env.NEXT_PUBLIC_APP_URL) || (env.NODE_ENV === "production" ? canonicalOrigin : "http://localhost:3000");
}

export function authTrustedOrigins(env: Environment = process.env) {
  return env.NODE_ENV === "production" ? [...productionOrigins] : ["http://localhost:3000", ...productionOrigins];
}

export function shouldCanonicalizeHost(env: Environment = process.env) {
  return env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview";
}
