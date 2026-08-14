/**
 * Unified Color System for ERP Application
 * 
 * This file provides consistent color utilities and mappings
 * that align with our Tailwind theme and CSS variables.
 */

// Status color mappings
export const statusColors = {
  success: {
    bg: 'bg-success',
    text: 'text-success-foreground',
    border: 'border-success',
    badge: 'bg-success/10 text-success border-success/20',
    card: 'bg-success/5 border-success/20',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-warning-foreground',
    border: 'border-warning',
    badge: 'bg-warning/10 text-warning border-warning/20',
    card: 'bg-warning/5 border-warning/20',
  },
  error: {
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    border: 'border-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    card: 'bg-destructive/5 border-destructive/20',
  },
  info: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    border: 'border-primary',
    badge: 'bg-primary/10 text-primary border-primary/20',
    card: 'bg-primary/5 border-primary/20',
  },
  neutral: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-muted',
    badge: 'bg-muted/10 text-muted-foreground border-muted/20',
    card: 'bg-muted/5 border-muted/20',
  },
} as const;

// Account type color mappings for accounting module
export const accountTypeColors = {
  ASSET: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    icon: 'text-success',
    badge: 'bg-success/10 text-success border-success/20',
  },
  LIABILITY: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
    icon: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  EQUITY: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    icon: 'text-secondary',
    badge: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  REVENUE: {
    bg: 'bg-chart-2/10',
    text: 'text-chart-2',
    border: 'border-chart-2/20',
    icon: 'text-chart-2',
    badge: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  },
  EXPENSE: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    icon: 'text-warning',
    badge: 'bg-warning/10 text-warning border-warning/20',
  },
} as const;

// Payment method color mappings
export const paymentMethodColors = {
  BANK_TRANSFER: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary border-primary/20',
  },
  CHECK: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    badge: 'bg-warning/10 text-warning border-warning/20',
  },
  CREDIT_CARD: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    badge: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  CASH: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    badge: 'bg-success/10 text-success border-success/20',
  },
  OTHER: {
    bg: 'bg-muted/10',
    text: 'text-muted-foreground',
    border: 'border-muted/20',
    badge: 'bg-muted/10 text-muted-foreground border-muted/20',
  },
} as const;

// Tax type color mappings
export const taxTypeColors = {
  sales: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary border-primary/20',
  },
  vat: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    badge: 'bg-success/10 text-success border-success/20',
  },
  income: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    badge: 'bg-warning/10 text-warning border-warning/20',
  },
  payroll: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    badge: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  property: {
    bg: 'bg-chart-4/10',
    text: 'text-chart-4',
    border: 'border-chart-4/20',
    badge: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  },
  excise: {
    bg: 'bg-chart-5/10',
    text: 'text-chart-5',
    border: 'border-chart-5/20',
    badge: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  },
  import: {
    bg: 'bg-chart-3/10',
    text: 'text-chart-3',
    border: 'border-chart-3/20',
    badge: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  },
  other: {
    bg: 'bg-muted/10',
    text: 'text-muted-foreground',
    border: 'border-muted/20',
    badge: 'bg-muted/10 text-muted-foreground border-muted/20',
  },
} as const;

// Utility functions
export const getStatusColor = (status: keyof typeof statusColors) => {
  return statusColors[status] || statusColors.neutral;
};

export const getAccountTypeColor = (type: keyof typeof accountTypeColors) => {
  return accountTypeColors[type] || accountTypeColors.ASSET;
};

export const getPaymentMethodColor = (method: keyof typeof paymentMethodColors) => {
  return paymentMethodColors[method] || paymentMethodColors.OTHER;
};

export const getTaxTypeColor = (type: keyof typeof taxTypeColors) => {
  return taxTypeColors[type] || taxTypeColors.other;
};

// Common color combinations for quick access
export const colorCombinations = {
  // Card backgrounds with consistent styling
  cardPrimary: 'bg-primary/5 border-primary/20 hover:bg-primary/10',
  cardSecondary: 'bg-secondary/5 border-secondary/20 hover:bg-secondary/10',
  cardSuccess: 'bg-success/5 border-success/20 hover:bg-success/10',
  cardWarning: 'bg-warning/5 border-warning/20 hover:bg-warning/10',
  cardError: 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10',
  
  // Button variants
  buttonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  buttonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  buttonSuccess: 'bg-success text-success-foreground hover:bg-success/90',
  buttonWarning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  buttonError: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  
  // Text variants
  textPrimary: 'text-primary',
  textSecondary: 'text-secondary',
  textSuccess: 'text-success',
  textWarning: 'text-warning',
  textError: 'text-destructive',
  textMuted: 'text-muted-foreground',
} as const;

export type StatusColorKey = keyof typeof statusColors;
export type AccountTypeColorKey = keyof typeof accountTypeColors;
export type PaymentMethodColorKey = keyof typeof paymentMethodColors;
export type TaxTypeColorKey = keyof typeof taxTypeColors;