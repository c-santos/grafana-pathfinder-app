import { useState, useCallback } from 'react';
import type { ContextData } from '../types/context.types';
import { buildLLMSystemPrompt } from '../utils/llm-context-formatter';

// POC configuration — change OLLAMA_MODEL to match your local install.
// Run `ollama list` to see available models.
const OLLAMA_ENDPOINT = 'http://localhost:11434/v1/chat/completions';
const OLLAMA_MODEL = 'llama3.2';

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

      const response = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content !== 'string') {
        throw new Error('Unexpected response format from Ollama');
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
