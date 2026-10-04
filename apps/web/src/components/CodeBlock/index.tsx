'use client';

import { useState } from 'react';
import styles from './styles.module.scss';
import IconButton from "@dival-sehgal/ui/icon-button";
import Tooltip from "@dival-sehgal/ui/tooltip";

import { CheckIcon, CopyIcon as ContentCopyIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";

/** How long the "Copied!" state stays visible. */
const COPIED_FEEDBACK_MS = 2000;

interface CodeBlockProps {
  children: React.ReactNode;
  content: string;
}

export function CodeBlock({ children, content }: Readonly<CodeBlockProps>) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <pre className={styles.pre}>
      <div className={styles.copyButtonWrapper}>
        <Tooltip title={t(copied ? "code.copied" : "code.copy")} side="left">
          <IconButton
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
            onClick={handleCopy}
            aria-label={t("code.copyLabel")}
            size="small"
          >
            {copied ? (
              <CheckIcon className={styles.copyIconDone} />
            ) : (
              <ContentCopyIcon className={styles.copyIcon} />
            )}
          </IconButton>
        </Tooltip>
      </div>
      <code>{children}</code>
    </pre>
  );
}
