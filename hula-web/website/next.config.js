/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        API_URL: process.env.API_URL || 'http://localhost:3000',
    },
    images: {
        domains: ['drive.google.com', 'lh3.googleusercontent.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
                module: false,
                os: false,
            };
        }
        
        config.module.rules.push({
            test: /\.mjs$/,
            include: /node_modules/,
            type: "javascript/auto",
        });

        // Ignore node-specific imports on client
        config.externals = [...(config.externals || []), 'onnxruntime-node'];

        // Silence warnings from onnxruntime-web
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            { module: /node_modules\/onnxruntime-web/ }
        ];

        return config;
    },
};

module.exports = nextConfig;
