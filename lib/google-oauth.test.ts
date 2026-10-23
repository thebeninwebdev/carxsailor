import {describe, expect, it} from "vitest";
import {isGoogleAuthorizationUrl} from "./google-oauth";

describe("Google OAuth authorization URLs", () => {
  it("accepts Google's HTTPS authorization origin", () => expect(isGoogleAuthorizationUrl("https://accounts.google.com/o/oauth2/v2/auth?client_id=test")).toBe(true));
  it.each(["http://accounts.google.com/o/oauth2/auth", "https://accounts.google.com.evil.test/oauth", "https://evil.test/oauth", "/oauth", undefined])("rejects untrusted URL %s", value => expect(isGoogleAuthorizationUrl(value)).toBe(false));
});
