import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    basePath: "",
    output: 'standalone',
    experimental: {
        externalDir: true,
    }
};


export default nextConfig;