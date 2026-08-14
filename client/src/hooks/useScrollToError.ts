import { useRef, useCallback } from 'react';

interface UseScrollToErrorOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  focusDelay?: number;
}


export const useScrollToError = (options: UseScrollToErrorOptions = {}) => {
  const {
    behavior = 'smooth',
    block = 'center',
    focusDelay = 300,
  } = options;

  // Create refs for form fields
  const focusErrorRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToError = useCallback((errorKeys: string[]) => {
    if (errorKeys.length === 0) return;

    // Get the first error field
    const firstErrorField = errorKeys[0];
    const fieldElement = focusErrorRefs.current[firstErrorField];

    if (fieldElement) {
      // Scroll to the field
      fieldElement.scrollIntoView({ 
        behavior, 
        block 
      });

      // Optional: Focus on the input field if it's focusable
      const input = fieldElement.querySelector('input, select, textarea') as HTMLElement;
      if (input && focusDelay > 0) {
        setTimeout(() => {
          input.focus();
        }, focusDelay);
      } else if (input) {
        input.focus();
      }
    }
  }, [behavior, block, focusDelay]);

  return { focusErrorRefs, scrollToError };
};