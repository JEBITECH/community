/**
 * Typography System
 * Consistent font sizes, weights, and line heights across the application
 */

export const typography = {
  // Display text (for hero sections, major headings)
  display: {
    large: "text-4xl font-bold leading-tight tracking-tight", // 36px
    medium: "text-3xl font-bold leading-tight tracking-tight", // 30px
    small: "text-2xl font-bold leading-tight tracking-tight", // 24px
  },
  
  // Headings (for page titles, section headers)
  heading: {
    h1: "text-2xl font-semibold leading-tight", // 24px - Page titles
    h2: "text-xl font-semibold leading-tight", // 20px - Section headers
    h3: "text-lg font-semibold leading-normal", // 18px - Subsection headers
    h4: "text-base font-semibold leading-normal", // 16px - Card titles
    h5: "text-sm font-semibold leading-normal", // 14px - Small headers
    h6: "text-xs font-semibold leading-normal uppercase tracking-wide", // 12px - Labels
  },
  
  // Body text (for paragraphs, descriptions)
  body: {
    large: "text-lg leading-relaxed", // 18px - Large body text
    medium: "text-base leading-relaxed", // 16px - Default body text
    small: "text-sm leading-relaxed", // 14px - Small body text
  },
  
  // UI text (for buttons, labels, captions)
  ui: {
    button: "text-sm font-medium leading-none", // 14px - Button text
    label: "text-sm font-medium leading-none", // 14px - Form labels
    caption: "text-xs leading-normal", // 12px - Captions, help text
    overline: "text-xs font-medium uppercase tracking-wide leading-none", // 12px - Overlines
  },
  
  // Data display (for metrics, numbers)
  data: {
    metric: "text-2xl font-bold font-mono leading-none", // 24px - Large metrics
    number: "text-lg font-semibold font-mono leading-none", // 18px - Numbers
    code: "text-sm font-mono leading-normal", // 14px - Code, IDs
  },
  
  // Utility classes
  utility: {
    muted: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    truncate: "truncate",
    ellipsis: "text-ellipsis overflow-hidden",
  }
} as const;

/**
 * Helper function to combine typography classes
 */
export function combineTypography(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Common typography combinations
 */
export const typographyPresets = {
  // Page headers
  pageTitle: combineTypography(typography.heading.h1, typography.utility.primary),
  pageSubtitle: combineTypography(typography.body.small, typography.utility.muted),
  
  // Card headers
  cardTitle: combineTypography(typography.heading.h4),
  cardDescription: combineTypography(typography.body.small, typography.utility.muted),
  
  // Form elements
  formLabel: combineTypography(typography.ui.label),
  formHelp: combineTypography(typography.ui.caption, typography.utility.muted),
  formError: combineTypography(typography.ui.caption, typography.utility.destructive),
  
  // Data display
  metricValue: combineTypography(typography.data.metric),
  metricLabel: combineTypography(typography.ui.caption, typography.utility.muted),
  
  // Navigation
  navItem: combineTypography(typography.ui.button),
  navLabel: combineTypography(typography.ui.overline, typography.utility.muted),
  
  // Status and badges
  badgeText: combineTypography(typography.ui.caption, "font-medium"),
  statusText: combineTypography(typography.ui.caption),
  
  // Tables
  tableHeader: combineTypography(typography.ui.label, typography.utility.muted),
  tableCell: combineTypography(typography.body.small),
  
  // Lists
  listItem: combineTypography(typography.body.small),
  listLabel: combineTypography(typography.ui.label),
} as const;

export default typography;