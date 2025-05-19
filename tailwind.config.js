/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./sidebar/**/*.{js,jsx,ts,tsx}', './popup/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0071e3',
          light: '#5ca5ef',
          dark: '#0058b7'
        },
        success: '#34c759',
        warning: '#ff9500',
        error: '#ff3b30',
        background: '#f5f5f7',
        surface: '#ffffff',
        text: {
          primary: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b'
        },
        border: '#d2d2d7',
        divider: '#e5e5ea'
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        sm: '0 2px 6px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.12)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.16)'
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite'
      }
    },
  },
  plugins: [],
}