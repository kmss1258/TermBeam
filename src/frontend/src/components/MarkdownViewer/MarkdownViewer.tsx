import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchFileContent } from '@/services/api';
import styles from './MarkdownViewer.module.css';

interface MarkdownViewerProps {
  sessionId: string;
  filePath: string;
  fileName: string;
  onClose: () => void;
}

export function MarkdownViewer({ sessionId, filePath, fileName, onClose }: MarkdownViewerProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchFileContent(sessionId, filePath)
      .then((data) => setContent(data.content))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load file'))
      .finally(() => setLoading(false));
  }, [sessionId, filePath]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} title="Back to files">
          ←
        </button>
        <span className={styles.fileName}>📄 {fileName}</span>
      </div>
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.markdown}>
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
