/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0f1e',
        'bg-secondary': '#111827',
        'bg-card': '#1a2235',
        'accent': '#e8451a',
        'accent-hover': '#ff5a2c',
        'accent-muted': 'rgba(232, 69, 26, 0.15)',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
        'border-color': '#1e2d45',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'danger': '#ef4444',
      },
      fontFamily: {
        mono: ['DM Mono', 'Courier New', 'monospace'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontVariantNumeric: ['tabular-nums'],
    },
  },
  plugins: [],
}
