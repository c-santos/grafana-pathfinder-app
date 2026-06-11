import React, { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { useContextPanel } from '../../../context-engine/context.hook';
import { useLLMQuery } from '../../../hooks/useLLMQuery';

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      padding: theme.spacing(1.5),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      height: '100%',
      overflow: 'hidden',
    }),
    label: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightMedium,
      flexShrink: 0,
    }),
    messageList: css({
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: theme.spacing(0.5, 0),
    }),
    userBubble: css({
      alignSelf: 'flex-end',
      background: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      padding: theme.spacing(0.75, 1),
      maxWidth: '85%',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }),
    assistantBubble: css({
      alignSelf: 'flex-start',
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      padding: theme.spacing(0.75, 1),
      maxWidth: '85%',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }),
    inputRow: css({
      display: 'flex',
      gap: theme.spacing(0.5),
      flexShrink: 0,
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
    error: css({
      color: theme.colors.error.text,
      fontSize: theme.typography.bodySmall.fontSize,
      flexShrink: 0,
    }),
    loading: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      flexShrink: 0,
    }),
  };
}

export function LLMChatBox() {
  const styles = useStyles2(getStyles);
  const { contextData } = useContextPanel();
  const { ask, messages, isLoading, error, reset } = useLLMQuery();
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) {
      return;
    }
    setQuestion('');
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

  return (
    <div className={styles.container}>
      <span className={styles.label}>Ask AI about your Grafana context</span>
      <div className={styles.messageList} ref={messageListRef}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
            {msg.content}
          </div>
        ))}
        {isLoading && <span className={styles.loading}>Thinking…</span>}
      </div>
      {error && <span className={styles.error}>{error}</span>}
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
        {messages.length > 0 && (
          <button className={styles.button} onClick={handleReset} disabled={isLoading}>
            New conversation
          </button>
        )}
      </div>
    </div>
  );
}
