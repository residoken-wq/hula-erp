/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
};

module.exports = nextConfig;
