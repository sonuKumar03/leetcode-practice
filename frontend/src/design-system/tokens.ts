/**
 * LeetCode Practice Tracker - Centralized UI Design Tokens
 * System color variables and typography for simple theme & font customization
 */

export const tokens = {
  colors: {
    // Dynamic CSS Variable Tokens (bound to :root and .dark in index.css)
    canvas: 'var(--bg-canvas)',
    sidebar: 'var(--bg-sidebar)',
    header: 'var(--bg-header)',
    surface: 'var(--bg-surface)',
    surfaceHover: 'var(--bg-surface-hover)',
    surfaceActive: 'var(--bg-surface-active)',
    elevated: 'var(--bg-elevated)',

    border: 'var(--border-subtle)',
    borderMuted: 'var(--border-muted)',

    textMain: 'var(--text-primary)',
    textMuted: 'var(--text-secondary)',
    textSubtle: 'var(--text-muted)',

    brand: 'var(--color-brand)',
    brandHover: 'var(--color-brand-hover)',
    brandSubtle: 'var(--color-brand-subtle)',

    // Difficulties
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
  },
  typography: {
    fontSans: 'var(--font-sans)',
    fontMono: 'var(--font-mono)',
  },
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
} as const;
