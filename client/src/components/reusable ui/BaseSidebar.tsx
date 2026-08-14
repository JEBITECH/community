// components/shared/BaseSidebar.tsx - Simplified version
'use client';

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerContent?: ReactNode;
  width?: string;
  showBackdrop?: boolean;
  className?: string;
  closeButtonClass?: string;
  hideCloseButton?: boolean;
  disableBackdropClick?: boolean;
  position?: 'right' | 'left';
}

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerContent,
  width = 'w-full sm:w-96',
  showBackdrop = true,
  className = '',
  closeButtonClass = '',
  hideCloseButton = false,
  disableBackdropClick = false,
  position = 'right',
}) => {
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (!disableBackdropClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      {showBackdrop && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-screen z-50",
          width,
          className
        )}
      >
        <div className="h-full bg-card border-l border-border shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              {typeof title === 'string' ? (
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
              {headerContent && (
                <div className="mt-2">
                  {headerContent}
                </div>
              )}
            </div>
            
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0 ml-4",
                  closeButtonClass
                )}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};