/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        brand: 'var(--brand)',
        'brand-strong': 'var(--brand-strong)',
        'brand-wash': 'var(--brand-wash)',
        team: 'var(--team)',
        po: 'var(--po)',
        well: 'var(--well)',
        improve: 'var(--improve)',
        park: 'var(--park)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', 'serif'],
        body: ['"Karla"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(20,30,26,.07)',
      },
    },
  },
  plugins: [],
};
