import { useCallback, useEffect, useRef, useState } from 'react';

export default function Dropdown({
  open: controlledOpen,
  onOpenChange,
  closeOnEscape = true,
  children
}) {
  const isControlled = typeof controlledOpen === 'boolean';
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback((next) => {
    if (isControlled) {
      onOpenChange?.(next);
      return;
    }
    setUncontrolledOpen(next);
  }, [isControlled, onOpenChange]);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const ref = useRef(null);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        close();
      }
    };

    const handleKeyDown = (event) => {
      if (!closeOnEscape) return;
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, closeOnEscape]);

  return children({ open, setOpen, toggle, close, ref });
}
