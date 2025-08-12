const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    // Fix for Supabase module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Optimize Supabase dependencies
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/realtime-js': require.resolve('@supabase/realtime-js'),
        '@supabase/supabase-js': require.resolve('@supabase/supabase-js'),
      }
    }

    // Handle dynamic imports properly
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })

    return config
  },
  serverExternalPackages: ['@supabase/supabase-js'],
}

module.exports = withNextIntl(nextConfig)