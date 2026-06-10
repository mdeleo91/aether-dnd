/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          900: '#08070f',
          800: '#0c0a16',
          700: '#12101f',
          600: '#1a1730',
          500: '#241f42',
        },
        aether: {
          50: '#e9fbff',
          100: '#c7f3fb',
          200: '#8fe6f5',
          300: '#4fd2ec',
          400: '#27b6d8',
          500: '#1796b8',
          600: '#147a98',
        },
        rune: {
          100: '#fce9c8',
          200: '#f5d28f',
          300: '#eab559',
          400: '#d99a2c',
          500: '#b87d18',
        },
        amethyst: {
          300: '#c4a6ff',
          400: '#a47cf3',
          500: '#8a5cf0',
          600: '#6f3fd6',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(79, 210, 236, 0.45)',
        'glow-violet': '0 0 50px -12px rgba(138, 92, 240, 0.5)',
        panel: '0 20px 60px -20px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(138,92,240,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(79,210,236,0.12), transparent 50%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
}
