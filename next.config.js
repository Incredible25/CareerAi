/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Phase 6 Step 4 (reverse-proxy / production-hardening review): these
  // are safe defaults the app itself controls, independent of whatever
  // the production reverse proxy adds. HSTS is a no-op over plain HTTP
  // (browsers only honor it on HTTPS responses), so it's harmless in
  // local dev too. A Content-Security-Policy is deliberately not
  // included here — Next.js's own inline runtime scripts need a
  // nonce-based or hash-based CSP to avoid breaking the app, which is a
  // separate, carefully-tested change, not a drive-by header addition.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
