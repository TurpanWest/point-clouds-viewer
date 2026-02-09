import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader'],
    });
    return config;
  },
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.vert': {
          loaders: ['raw-loader'],
          as: '*.js',
      },
      '*.frag': {
          loaders: ['raw-loader'],
          as: '*.js',
      },
    }
  },
};

export default nextConfig;
