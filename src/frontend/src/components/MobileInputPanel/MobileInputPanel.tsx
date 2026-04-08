import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import styles from './MobileInputPanel.module.css';

const CLOSE_ANIM_MS = 200;

export default function MobileInputPanel() {
  const [text, setText] = useState('');
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const open = useUIStore((s) => s.mobileInputOpen);
  const setMobileInputOpen = useUIStore((s) => s.setMobileInputOpen);
  const { keyboardOpen } = useMobileKeyboard();

  useEffect(() => {
    if (open) {
      setClosing(false);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !keyboardOpen) return;

    let frame1 = 0;
    let frame2 = 0;

    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
        panelRef.current?.scrollIntoView({ block: 'end', inline: 'nearest' });
        inputRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [open, keyboardOpen]);

  useEffect(() => {
    const root = document.documentElement;

    if (!open && !closing) {
      root.style.removeProperty('--mobile-input-height');
      return;
    }

    const updateHeight = () => {
      const height = panelRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--mobile-input-height', `${height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (panelRef.current) observer.observe(panelRef.current);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--mobile-input-height');
    };
  }, [open, closing]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setMobileInputOpen(false);
      setClosing(false);
      setText('');
    }, CLOSE_ANIM_MS);
  }, [setMobileInputOpen]);

  const sendInput = useCallback((data: string) => {
    const { sessions, activeId } = useSessionStore.getState();
    if (!activeId) return;
    const ms = sessions.get(activeId);
    if (ms?.send) {
      ms.send(data);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (text) {
      sendInput(`${text}\r`);
      setText('');
    }
    inputRef.current?.focus();
  }, [text, sendInput]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        const currentValue = inputRef.current?.value ?? text;
        if (currentValue) {
          sendInput(currentValue);
          setText('');
        } else {
          sendInput('\r');
        }
        inputRef.current?.focus();
      }
    },
    [text, sendInput],
  );

  const handleSpecialKey = useCallback(
    (data: string) => {
      sendInput(data);
      inputRef.current?.focus();
    },
    [sendInput],
  );

  if (!open && !closing) return null;

  return (
    <div className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}>
      <div
        ref={panelRef}
        className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}
        role="dialog"
        aria-modal="false"
        tabIndex={-1}
      >
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={styles.textInput}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type here..."
          />
          <button type="button" className={styles.sendBtn} onClick={handleSend} aria-label="Send">
            ↵
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.specialKeys}>
          <button type="button" onClick={() => handleSpecialKey('\x1b')}>
            Esc
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x09')}>
            Tab
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x03')} className={styles.danger}>
            ^C
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x02')}>
            ^B
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x14')}>
            ^T
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x1b[D')}>
            ←
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x1b[A')}>
            ↑
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x1b[B')}>
            ↓
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x1b[C')}>
            →
          </button>
          <button type="button" onClick={() => handleSpecialKey('\x7f')} aria-label="Backspace">
            ⌫
          </button>
        </div>

        <div className={styles.numberRow}>
          {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button type="button" key={n} onClick={() => handleSpecialKey(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
