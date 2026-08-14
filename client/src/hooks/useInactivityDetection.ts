import { useEffect, useRef, useState } from 'react';

interface UseInactivityOptions {
  timeout: number; // milliseconds
  onInactive: () => void;
  onActive?: () => void;
  enabled?: boolean;
}

export function useInactivityDetection({
  timeout,
  onInactive,
  onActive,
  enabled = true,
}: UseInactivityOptions) {
  const [isInactive, setIsInactive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onInactiveRef = useRef(onInactive);
  const onActiveRef = useRef(onActive);

  // Keep refs updated
  useEffect(() => {
    onInactiveRef.current = onInactive;
    onActiveRef.current = onActive;
  }, [onInactive, onActive]);

  const resetTimer = () => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // If was inactive, mark as active again
    setIsInactive((wasInactive) => {
      if (wasInactive) {
        onActiveRef.current?.();
      }
      return false;
    });

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsInactive(true);
      onInactiveRef.current();
    }, timeout);
  };

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }


    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, enabled]); // Removed isInactive from dependencies

  return { isInactive, resetTimer };
}
