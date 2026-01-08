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
};

module.exports = nextConfig;
