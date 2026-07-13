/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },

  allowedDevOrigins: [
    "https://app.javehandmade.store",
  ],
};

export default nextConfig;