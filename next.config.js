import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/elcbodhxzvoqpzamgown\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elcbodhxzvoqpzamgown.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default pwaConfig(nextConfig);