/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1c1c1e',
          light: '#2c2c2e',
          muted: '#3a3a3c',
        },
        accent: {
          DEFAULT: '#89B9F6',
          dark: '#5a9ae8',
          light: '#b8d4fa',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f5f6f8',
        },
        canvas: '#eef0f4',
        landing: {
          bg: '#050508',
          surface: '#0f0f14',
          card: '#16161f',
          border: '#252530',
          muted: '#8b8b9a',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.1)',
        sidebar: '4px 0 24px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
