import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: let phones on the same Wi-Fi open the dev server (e.g. http://192.168.0.105:3000).
  allowedDevOrigins: ["192.168.*.*"],
  // Build with a few workers instead of one per CPU core; with 15 workers the
  // build runs out of memory on an 8 GB machine.
  experimental: { cpus: 3 },
};

export default nextConfig;
