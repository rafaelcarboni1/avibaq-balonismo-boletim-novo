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
  // Configurações de API para evitar timeouts
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Aumenta limite de tamanho
    },
    responseLimit: false, // Remove limite de resposta
    externalResolver: true, // Permite resolvers externos
  },
};

module.exports = nextConfig;