import {describe, expect, it} from "vitest";
import {applicationOrigin, authTrustedOrigins, canonicalOrigin, shouldCanonicalizeHost} from "./origin";

describe("application origins", () => {
  it("uses localhost during development", () => expect(applicationOrigin({NODE_ENV: "development"})).toBe("http://localhost:3000"));
  it("uses the canonical origin in production", () => expect(applicationOrigin({NODE_ENV: "production"})).toBe(canonicalOrigin));
  it("uses a valid configured production origin", () => expect(applicationOrigin({BETTER_AUTH_URL: "https://carxsailor.com", NODE_ENV: "production"})).toBe(canonicalOrigin));
  it("trusts both production hosts and localhost outside production", () => expect(authTrustedOrigins({NODE_ENV: "development"})).toEqual(["http://localhost:3000", "https://carxsailor.com", "https://www.carxsailor.com"]));
  it("does not canonicalize Vercel previews", () => expect(shouldCanonicalizeHost({NODE_ENV: "production", VERCEL_ENV: "preview"})).toBe(false));
});
