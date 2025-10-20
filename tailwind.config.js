/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Custom colors based on your existing design system
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#667eea', // Main primary color
          600: '#5a67d8',
          700: '#4c51bf',
          800: '#434190',
          900: '#3c366b',
        },
        gray: {
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#a0aec0',
          500: '#718096',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        },
        // Custom colors from your existing CSS
        'canvas-bg': '#ffffff',
        'canvas-dark': '#1a202c',
        'header-bg': '#ffffff',
        'header-dark': '#2d3748',
        'toolbox-bg': 'rgba(255, 255, 255, 0.95)',
        'toolbox-dark': 'rgba(45, 55, 72, 0.95)',
      },
      // Custom spacing to match your design
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Custom font families
      fontFamily: {
        'mono': ['Monaco', 'SF Mono', 'Menlo', 'Ubuntu Mono', 'monospace'],
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Custom animations
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'toolbox-slide': 'toolboxSlideIn 0.3s ease-out',
        'text-fix': 'textFix 0.1s ease-in',
        'spin-slow': 'spin 20s linear infinite',
      },
      // Custom keyframes
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toolboxSlideIn: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        textFix: {
          '0%': { opacity: '0.99' },
          '100%': { opacity: '1' },
        },
      },
      // Custom backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
      // Custom box shadows
      boxShadow: {
        'toolbox': '2px 0 12px rgba(0, 0, 0, 0.08)',
        'toolbox-hover': '4px 0 16px rgba(0, 0, 0, 0.12)',
        'ai-panel': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'ai-panel-hover': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'auth-card': '0 20px 40px rgba(0, 0, 0, 0.1)',
        'dark-toolbox': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'dark-ai-panel': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      // Custom border radius
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      // Custom z-index
      zIndex: {
        '200': '200',
        '1000': '1000',
      },
    },
  },
  plugins: [],
}
