/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./**/*.js",
    "./app/**/*.py",
    "./templates/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        // Iterum Brand Colors
        'iterum-primary': '#10b981',
        'iterum-secondary': '#059669',
        'iterum-accent': '#7c3aed',
        'iterum-dark': '#064e3b',
        'iterum-light': '#ecfdf5',
        'iterum-warm': '#fef3c7',
        'iterum-orange': '#f97316',
        
        // Semantic Colors
        'success': {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d'
        },
        'error': {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c'
        },
        'warning': {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309'
        },
        'info': {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8'
        }
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
