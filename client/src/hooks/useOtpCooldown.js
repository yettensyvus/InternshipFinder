import { useEffect, useMemo, useRef, useState } from 'react';

export function useOtpCooldown(storageKey, cooldownSeconds = 60) {
  const key = useMemo(() => storageKey || '', [storageKey]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const prevKeyRef = useRef('');
  const removeTimeoutRef = useRef(null);

  useEffect(() => {
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;

    if (prevKeyRef.current && prevKeyRef.current !== key && storage) {
      storage.removeItem(prevKeyRef.current);
    }
    prevKeyRef.current = key;

    if (removeTimeoutRef.current) {
      window.clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }

    if (!key || !storage) {
      setRemainingSeconds(0);
      return;
    }

    const readRemaining = () => {
      const raw = storage.getItem(key);
      const untilMs = raw ? Number(raw) : 0;
      if (!Number.isFinite(untilMs) || untilMs <= 0) {
        return 0;
      }
      const diffMs = untilMs - Date.now();
      return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
    };

    const tick = () => {
      const next = readRemaining();
      setRemainingSeconds(next);
      if (next <= 0) {
        storage.removeItem(key);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
      if (removeTimeoutRef.current) {
        window.clearTimeout(removeTimeoutRef.current);
        removeTimeoutRef.current = null;
      }
    };
  }, [key]);

  const startCooldown = () => {
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    if (!key || !storage) return;
    const untilMs = Date.now() + cooldownSeconds * 1000;
    storage.setItem(key, String(untilMs));
    setRemainingSeconds(cooldownSeconds);

    if (removeTimeoutRef.current) {
      window.clearTimeout(removeTimeoutRef.current);
    }
    removeTimeoutRef.current = window.setTimeout(() => {
      storage.removeItem(key);
    }, cooldownSeconds * 1000 + 250);
  };

  const clearCooldown = () => {
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    if (!key || !storage) return;
    storage.removeItem(key);
    setRemainingSeconds(0);

    if (removeTimeoutRef.current) {
      window.clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
  };

  return {
    remainingSeconds,
    isCoolingDown: remainingSeconds > 0,
    startCooldown,
    clearCooldown
  };
}
