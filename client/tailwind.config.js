/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0c16',
        card: '#121528',
        'card-hover': '#1a1e38',
        'neon-purple': '#a855f7',
        'neon-pink': '#ec4899',
        'neon-cyan': '#06b6d4',
        'neon-blue': '#3b82f6',
        'neon-amber': '#f59e0b',
        'neon-green': '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.45)',
        'glow-pink': '0 0 25px rgba(236, 72, 153, 0.45)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.45)',
        'glow-blue': '0 0 25px rgba(59, 130, 246, 0.45)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
