import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeDebug: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-card border border-border rounded-lg shadow-lg">
      <div className="text-sm">
        <p className="text-card-foreground">Current theme: <strong>{theme}</strong></p>
        <p className="text-muted-foreground">HTML class: {document.documentElement.className}</p>
        <div className="mt-2 space-y-1">
          <div className="w-4 h-4 bg-background border border-border inline-block mr-2"></div>
          <span className="text-foreground">Background</span>
        </div>
        <div className="mt-1">
          <div className="w-4 h-4 bg-card border border-border inline-block mr-2"></div>
          <span className="text-card-foreground">Card</span>
        </div>
        <div className="mt-1">
          <div className="w-4 h-4 bg-primary border border-border inline-block mr-2"></div>
          <span className="text-primary-foreground">Primary</span>
        </div>
      </div>
    </div>
  );
};