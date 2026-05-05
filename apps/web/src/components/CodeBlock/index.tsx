'use client';

import { useState } from 'react';
import styles from './styles.module.scss';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CodeBlockProps {
  children: React.ReactNode;
  content: string;
}

export function CodeBlock({ children, content }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <pre className={styles.pre}>
      <div className={styles.copyButtonWrapper}>
        <Tooltip 
          title={copied ? "Copied!" : "Copy code"} 
          placement="left"
          arrow
        >
          <IconButton
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            size="small"
          >
            {copied ? (
              <CheckIcon sx={{ color: 'var(--t-colors-background-primary)', fontSize: 24 }} />
            ) : (
              <ContentCopyIcon sx={{ color: 'var(--t-colors-primary-default)', fontSize: 24 }} />
            )}
          </IconButton>
        </Tooltip>
      </div>
      <code>{children}</code>
    </pre>
  );
}
