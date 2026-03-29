import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Không dùng output: 'export' - sử dụng next-on-pages để build
};

// Chỉ chạy trong môi trường dev
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

export default nextConfig;
