/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Set NEXT_PUBLIC_BASE_PATH=/<repo> when deploying to GitHub Pages project pages.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
};

export default nextConfig;
