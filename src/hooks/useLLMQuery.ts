import { useState, useCallback } from 'react';
import type { ContextData } from '../types/context.types';
import { buildLLMSystemPrompt } from '../utils/llm-context-formatter';

export const OPENAI_API_URL = 'http://127.0.0.1:1234/v1/chat/completions';
export const LLM_MODEL = 'qwen3.5-9b';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface UseLLMQueryReturn {
  ask: (question: string, contextData: ContextData) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useLLMQuery(): UseLLMQueryReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (question: string, contextData: ContextData) => {
      if (!question.trim()) {
        return;
      }

      const userMessage: Message = { role: 'user', content: question };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const systemPrompt = buildLLMSystemPrompt(contextData);

        // Build full thread: system prompt + all prior messages + new user message
        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: question },
        ];

        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: LLM_MODEL, messages: apiMessages }),
        });

        if (!response.ok) {
          throw new Error(`LLM server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (typeof content !== 'string') {
          throw new Error('Unexpected response format from LLM server');
        }

        setMessages((prev) => [...prev, { role: 'assistant', content }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'LLM call failed');
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return { ask, messages, isLoading, error, reset };
}
