import type { NextConfig } from "next";

// Security headers on every page and API answer. Razorpay's checkout runs in its own window or
// iframe from checkout.razorpay.com / api.razorpay.com, so the Payment Request API is allowed
// only for this site and Razorpay. Photo search uses a file picker (the phone offers its camera
// there), not in-page camera access, so camera=() does not affect it.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
  },
];

const nextConfig: NextConfig = {
  // Development only: let phones on the same Wi-Fi open the dev server (e.g. http://192.168.0.105:3000).
  allowedDevOrigins: ["192.168.*.*"],
  // Build with a few workers instead of one per CPU core; with 15 workers the
  // build runs out of memory on an 8 GB machine.
  experimental: { cpus: 3 },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
