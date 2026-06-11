import { useState, useCallback } from 'react';
import type { ContextData } from '../types/context.types';
import { buildLLMSystemPrompt } from '../utils/llm-context-formatter';

export const OPENAI_API_URL = 'http://127.0.0.1:1234/v1/chat/completions';
export const LLM_MODEL = 'qwen3.5-9b';

export interface UseLLMQueryReturn {
  ask: (question: string, contextData: ContextData) => Promise<void>;
  answer: string | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useLLMQuery(): UseLLMQueryReturn {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (question: string, contextData: ContextData) => {
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const systemPrompt = buildLLMSystemPrompt(contextData);

      const body = JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      });
      console.log(body);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      if (!response.ok) {
        throw new Error(`LLM server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content !== 'string') {
        throw new Error('Unexpected response format from LLM server');
      }

      setAnswer(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'LLM call failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnswer(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { ask, answer, isLoading, error, reset };
}
