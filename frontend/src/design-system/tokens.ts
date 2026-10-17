/**
 * LeetCode Practice Tracker - UI Design Tokens
 * Clean, consistent dark-first design system
 */

export const tokens = {
  colors: {
    // Surfaces
    canvas: '#090C15',         // Root background
    sidebar: '#0D111D',        // Navigation sidebar
    surface: '#111728',        // Cards, table headers, containers
    surfaceElevated: '#171F34',// Modals, dropdowns, tooltips
    surfaceHover: '#1B243B',   // Row hover, button hover

    // Borders
    borderSubtle: '#1C253B',   // Dividers, card borders
    borderMuted: '#25324D',    // Input borders, active borders
    borderHighlight: '#6366F1',// Focus rings, active selection

    // Text & Content
    textPrimary: '#F8FAFC',    // Headlines, titles, numbers
    textSecondary: '#94A3B8',  // Subtitles, metadata, table headers
    textMuted: '#64748B',      // Placeholders, disabled text

    // Accents
    accent: '#6366F1',         // Primary indigo
    accentHover: '#4F46E5',
    accentSubtle: 'rgba(99, 102, 241, 0.15)',

    // Difficulties
    easy: '#10B981',           // Emerald
    easyBg: 'rgba(16, 185, 129, 0.12)',
    easyBorder: 'rgba(16, 185, 129, 0.25)',

    medium: '#F59E0B',         // Amber
    mediumBg: 'rgba(245, 158, 11, 0.12)',
    mediumBorder: 'rgba(245, 158, 11, 0.25)',

    hard: '#EF4444',           // Red
    hardBg: 'rgba(239, 68, 68, 0.12)',
    hardBorder: 'rgba(239, 68, 68, 0.25)',

    // Statuses
    todo: '#64748B',
    todoBg: 'rgba(100, 116, 139, 0.15)',
    todoBorder: 'rgba(100, 116, 139, 0.3)',

    inProgress: '#38BDF8',     // Sky
    inProgressBg: 'rgba(56, 189, 248, 0.15)',
    inProgressBorder: 'rgba(56, 189, 248, 0.3)',

    solved: '#10B981',
    solvedBg: 'rgba(16, 185, 129, 0.15)',
    solvedBorder: 'rgba(16, 185, 129, 0.3)',

    starred: '#F59E0B',
  },
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  typography: {
    fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  }
} as const;
