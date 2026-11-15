/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      "images.unsplash.com",
      "plus.unsplash.com",
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/admin",
        destination: "/index.html",
      },
      {
        source: "/admin/login",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;
