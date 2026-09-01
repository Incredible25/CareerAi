import { afterEach, describe, expect, it } from "vitest";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

function requestWithForwardedFor(ip: string): Request {
  return new Request("http://localhost/test", { headers: { "x-forwarded-for": ip } });
}

describe("getClientIp", () => {
  const originalEnv = process.env.TRUST_PROXY_HEADERS;
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.TRUST_PROXY_HEADERS;
    else process.env.TRUST_PROXY_HEADERS = originalEnv;
  });

  it("ignores a client-supplied X-Forwarded-For header by default (TRUST_PROXY_HEADERS unset)", () => {
    delete process.env.TRUST_PROXY_HEADERS;
    expect(getClientIp(requestWithForwardedFor("10.0.0.1"))).toBe("unknown");
    expect(getClientIp(requestWithForwardedFor("10.0.0.2"))).toBe("unknown");
  });

  it("still ignores the header when TRUST_PROXY_HEADERS is set to anything other than the literal string 'true'", () => {
    process.env.TRUST_PROXY_HEADERS = "1";
    expect(getClientIp(requestWithForwardedFor("10.0.0.1"))).toBe("unknown");
  });

  it("reads the header once TRUST_PROXY_HEADERS=true, for deployments whose proxy overwrites it", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    expect(getClientIp(requestWithForwardedFor("203.0.113.5"))).toBe("203.0.113.5");
  });
});

describe("isRateLimited — spoofed-header bypass is closed by getClientIp's default", () => {
  it("a rotating X-Forwarded-For no longer buys a fresh bucket: every spoofed request shares the same 'unknown' key", () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const key = (ip: string) => `probe:${getClientIp(requestWithForwardedFor(ip))}`;
    for (let i = 0; i < 5; i++) {
      isRateLimited(key(`10.0.0.${i}`), 5, 60_000);
    }
    // A 6th request, with yet another spoofed IP, still lands in the same
    // shared bucket and trips the limit — proving the header rotation
    // trick no longer resets the count.
    expect(isRateLimited(key("10.0.0.99"), 5, 60_000)).toBe(true);
  });
});
