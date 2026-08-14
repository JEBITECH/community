import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface StandardCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'header' | 'metric' | 'interactive';
  colorScheme?: 'default' | 'blue' | 'green' | 'orange' | 'red' | 'slate';
}

interface StandardCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient';
}

interface StandardCardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'large' | 'small';
}

const getCardVariantClasses = (variant: StandardCardProps['variant'], colorScheme: StandardCardProps['colorScheme']) => {
  const baseClasses = 'border-0 shadow-lg transition-shadow duration-200';
  
  switch (variant) {
    case 'header':
      return cn(baseClasses, 'hover:shadow-xl');
    case 'metric':
      const gradientMap = {
        blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
        green: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
        orange: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
        red: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
        slate: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
        default: 'bg-gradient-to-br from-slate-50 to-background dark:from-slate-950/30 dark:to-background'
      };
      return cn(baseClasses, 'hover:shadow-xl', gradientMap[colorScheme || 'default']);
    case 'interactive':
      return cn(baseClasses, 'hover:shadow-md bg-card/80 backdrop-blur-sm border border-border');
    default:
      return baseClasses;
  }
};

const getHeaderVariantClasses = (variant: StandardCardHeaderProps['variant']) => {
  switch (variant) {
    case 'gradient':
      return 'bg-gradient-to-r from-muted/50 to-background border-b border-border';
    default:
      return '';
  }
};

const getPaddingClasses = (padding: StandardCardContentProps['padding']) => {
  switch (padding) {
    case 'large':
      return 'p-8';
    case 'small':
      return 'p-4';
    default:
      return 'p-6';
  }
};

export const StandardCard: React.FC<StandardCardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  colorScheme = 'default'
}) => {
  return (
    <Card className={cn(getCardVariantClasses(variant, colorScheme), className)}>
      {children}
    </Card>
  );
};

export const StandardCardHeader: React.FC<StandardCardHeaderProps> = ({ 
  children, 
  className, 
  variant = 'default' 
}) => {
  return (
    <CardHeader className={cn(getHeaderVariantClasses(variant), className)}>
      {children}
    </CardHeader>
  );
};

export const StandardCardContent: React.FC<StandardCardContentProps> = ({ 
  children, 
  className, 
  padding = 'default' 
}) => {
  return (
    <CardContent className={cn(getPaddingClasses(padding), className)}>
      {children}
    </CardContent>
  );
};

export const StandardCardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <CardTitle className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </CardTitle>
  );
};