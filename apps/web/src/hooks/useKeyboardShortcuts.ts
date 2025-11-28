import { useEffect } from 'react';

type ShortcutHandler = () => void;
type ShortcutConfig = {
  key: string;
  ctrlOrCmd?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description: string;
};

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const isCtrlOrCmdPressed = shortcut.ctrlOrCmd ? (e.ctrlKey || e.metaKey) : true;
        const isAltPressed = shortcut.alt ? e.altKey : !e.altKey;
        const isShiftPressed = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const isKeyPressed = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (isCtrlOrCmdPressed && isAltPressed && isShiftPressed && isKeyPressed) {
          // Prevent default for shortcuts that would conflict with browser
          if (shortcut.ctrlOrCmd || shortcut.alt) {
            e.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export type { ShortcutConfig };
