/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a0a', mid: '#111111', card: '#1a1a1a', hover: '#222222' },
        accent: { DEFAULT: '#E8FF47', dim: 'rgba(232,255,71,0.1)', mid: 'rgba(232,255,71,0.25)' },
        blue: { DEFAULT: '#6AB4FF', dim: 'rgba(106,180,255,0.1)', mid: 'rgba(106,180,255,0.25)' },
        muted: '#999999',
        dim: '#555555',
        border: '#222222',
        success: '#4ADE80',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
