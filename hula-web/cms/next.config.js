/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    env: {
        API_URL: process.env.API_URL || 'http://localhost:3000',
    },
    transpilePackages: [
        '@ant-design/pro-components',
        '@ant-design/pro-layout',
        'antd',
        '@ant-design/icons',
        'rc-util',
        'rc-pagination',
        'rc-picker',
    ],
    experimental: {
        optimizePackageImports: ['antd', '@ant-design/icons', '@ant-design/pro-components', '@ant-design/pro-layout'],
    },
};

module.exports = nextConfig;
