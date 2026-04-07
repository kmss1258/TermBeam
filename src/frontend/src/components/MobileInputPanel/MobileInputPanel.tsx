import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import styles from './MobileInputPanel.module.css';

export default function MobileInputPanel() {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const open = useUIStore((s) => s.mobileInputOpen);
  const toggleMobileInput = useUIStore((s) => s.toggleMobileInput);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={toggleMobileInput}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
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
          <button className={styles.closeBtn} onClick={toggleMobileInput} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.specialKeys}>
          <button onClick={() => handleSpecialKey('\x1b')}>Esc</button>
          <button onClick={() => handleSpecialKey('\x09')}>Tab</button>
          <button onClick={() => handleSpecialKey('\x03')} className={styles.danger}>
            ^C
          </button>
          <button onClick={() => handleSpecialKey('\x1b[D')}>←</button>
          <button onClick={() => handleSpecialKey('\x1b[A')}>↑</button>
          <button onClick={() => handleSpecialKey('\x1b[B')}>↓</button>
          <button onClick={() => handleSpecialKey('\x1b[C')}>→</button>
          <button onClick={() => handleSpecialKey('\x1b[H')}>Home</button>
          <button onClick={() => handleSpecialKey('\x1b[F')}>End</button>
        </div>
      </div>
    </div>
  );
}
