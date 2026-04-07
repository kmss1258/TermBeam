import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  const toggleMobileInput = useUIStore((s) => s.toggleMobileInput);

  useEffect(() => {
    if (open) {
      setClosing(false);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

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
      toggleMobileInput();
      setClosing(false);
      setText('');
    }, CLOSE_ANIM_MS);
  }, [toggleMobileInput]);

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
      sendInput(text + '\r');
      setText('');
    }
    inputRef.current?.focus();
  }, [text, sendInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
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
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}
        onClick={(e) => e.stopPropagation()}
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
          <button className={styles.sendBtn} onClick={handleSend} aria-label="Send">
            ↵
          </button>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.specialKeys}>
          <button onClick={() => handleSpecialKey('\x1b')}>Esc</button>
          <button onClick={() => handleSpecialKey('\x09')}>Tab</button>
          <button onClick={() => handleSpecialKey('\x03')} className={styles.danger}>
            ^C
          </button>
          <button onClick={() => handleSpecialKey('\x02')}>^B</button>
          <button onClick={() => handleSpecialKey('\x1b[D')}>←</button>
          <button onClick={() => handleSpecialKey('\x1b[A')}>↑</button>
          <button onClick={() => handleSpecialKey('\x1b[B')}>↓</button>
          <button onClick={() => handleSpecialKey('\x1b[C')}>→</button>
        </div>

        <div className={styles.numberRow}>
          {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button key={n} onClick={() => handleSpecialKey(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
