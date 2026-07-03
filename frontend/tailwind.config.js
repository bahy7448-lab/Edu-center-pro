/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#060B14',
          900: '#0A0F1E',
          800: '#0D1530',
          700: '#111B3A',
          600: '#1A2550',
          500: '#243068',
        },
        purple: {
          DEFAULT: '#6C5CE7',
          light: '#7D6EF0',
          dark: '#5A4BD1',
        },
        brand: {
          green: '#00B894',
          amber: '#FDCB6E',
          red: '#FF6B6B',
          cyan: '#00CEC9',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'scan': 'scanLine 2s ease-in-out infinite',
        'pulse-ring': 'pulseRing 1.5s ease infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scanLine: { '0%,100%': { top: '10%' }, '50%': { top: '80%' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(0,184,148,0.4)' }, '100%': { boxShadow: '0 0 0 10px rgba(0,184,148,0)' } },
      },
    },
  },
  plugins: [],
}
