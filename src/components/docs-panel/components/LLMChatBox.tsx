import React, { useState, useCallback, useRef } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { useContextPanel } from '../../../context-engine/context.hook';
import { useLLMQuery } from '../../../hooks/useLLMQuery';
import { useInteractiveElements } from '../../../interactive-engine';

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      borderTop: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1.5),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    label: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    inputRow: css({
      display: 'flex',
      gap: theme.spacing(0.5),
    }),
    input: css({
      flex: 1,
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.medium}`,
      borderRadius: theme.shape.radius.default,
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
      padding: theme.spacing(0.5, 1),
      outline: 'none',
      '&:focus': {
        borderColor: theme.colors.primary.border,
      },
      '&::placeholder': {
        color: theme.colors.text.disabled,
      },
    }),
    button: css({
      background: theme.colors.primary.main,
      border: 'none',
      borderRadius: theme.shape.radius.default,
      color: theme.colors.primary.contrastText,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      padding: theme.spacing(0.5, 1.5),
      whiteSpace: 'nowrap',
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    }),
    answer: css({
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      padding: theme.spacing(1),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      maxHeight: '240px',
      overflowY: 'auto',
    }),
    error: css({
      color: theme.colors.error.text,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    loading: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
}

export function LLMChatBox() {
  const styles = useStyles2(getStyles);
  const { contextData } = useContextPanel();
  const { ask, answer, isLoading, error, reset } = useLLMQuery();
  const { executeInteractiveAction } = useInteractiveElements();
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) {
      return;
    }
    await ask(trimmed, contextData);
  }, [ask, question, contextData, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAsk();
      }
    },
    [handleAsk]
  );

  const handleReset = useCallback(() => {
    reset();
    setQuestion('');
    inputRef.current?.focus();
  }, [reset]);

  const handleHighlightDemo = useCallback(async () => {
    await executeInteractiveAction(
      'highlight',
      'input[placeholder="Ask a question…"]',
      undefined,
      'show',
      'This is the LLM chat input'
    );
  }, [executeInteractiveAction]);

  return (
    <div className={styles.container}>
      <span className={styles.label}>Ask Ollama about your Grafana context</span>
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Ask a question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button className={styles.button} onClick={handleAsk} disabled={isLoading || !question.trim()}>
          {isLoading ? '…' : 'Ask'}
        </button>
        <button className={styles.button} onClick={handleHighlightDemo} disabled={isLoading}>
          Highlight input
        </button>
        {(answer || error) && (
          <button className={styles.button} onClick={handleReset} disabled={isLoading}>
            Clear
          </button>
        )}
      </div>
      {isLoading && <span className={styles.loading}>Thinking…</span>}
      {error && <span className={styles.error}>{error}</span>}
      {answer && <div className={styles.answer}>{answer}</div>}
    </div>
  );
}
