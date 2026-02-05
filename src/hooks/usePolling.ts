import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, interval: number, enabled: boolean = true) {
  const savedCallback = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup interval
  useEffect(() => {
    if (!enabled) return;

    // Call immediately
    savedCallback.current();

    // Setup interval
    const id = setInterval(() => {
      savedCallback.current();
    }, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
}
