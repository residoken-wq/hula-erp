/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e8f7fc',
                    100: '#c6ecf8',
                    200: '#91d9f2',
                    300: '#5bc6eb',
                    400: '#35b5e3',
                    500: '#23A7D3',
                    600: '#1e8fb5',
                    700: '#197697',
                    800: '#145e79',
                    900: '#0f465b',
                },
                secondary: {
                    50: '#fffef9',
                    100: '#fefcf0',
                    200: '#fdf9e1',
                    300: '#FCF6E0',
                    400: '#f5ebb8',
                    500: '#ede090',
                    600: '#d4c66e',
                    700: '#b3a74e',
                    800: '#918834',
                    900: '#706a20',
                },
                section: {
                    blue: '#B9E5FB',
                    gray: '#E6E7E8',
                },
                accent: '#F3CB58',
            },
            fontFamily: {
                heading: ['var(--font-main)', 'Be Vietnam Pro', 'sans-serif'],
                body: ['var(--font-main)', 'Be Vietnam Pro', 'sans-serif'],
                sans: ['var(--font-main)', 'Be Vietnam Pro', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '12px',
                sm: '8px',
                md: '12px',
                lg: '16px',
                xl: '20px',
                '2xl': '24px',
                pill: '999px',
            },
            boxShadow: {
                soft: '0 2px 16px rgba(0, 0, 0, 0.06)',
                'soft-md': '0 4px 24px rgba(0, 0, 0, 0.08)',
                'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.10)',
            },
        },
    },
    plugins: [],
};
