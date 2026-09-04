import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactCompiler: true,
    output: 'standalone',
    productionBrowserSourceMaps: true,
    experimental: {
        externalDir: true,
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },
    images: {
        qualities: [75, 80],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.dicebear.com"
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com"
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com"
            },
            {
                protocol: "https",
                hostname: "images.pexels.com"
            }
        ]
    },
};



export default nextConfig;