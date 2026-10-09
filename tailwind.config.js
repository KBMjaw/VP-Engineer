/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#111111', 2: '#181818', soft: '#3a3a3a' },
        charcoal: '#161616',
        muted: '#5a5a5a',
        line: '#e4e4e4',
        paper: '#f5f5f5',
        brand: { DEFAULT: '#FFD400', dark: '#E6BE00' },
        wa: '#25D366',
      },
      fontFamily: {
        head: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl2: '14px' },
      boxShadow: { card: '0 18px 40px -18px rgba(17,17,17,.22)' },
    },
  },
  corePlugins: { container: false },
  plugins: [],
};
