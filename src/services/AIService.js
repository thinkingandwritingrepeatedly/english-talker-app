import { DEFAULTS, SYSTEM_PROMPT } from '../constants/config';

export function createAIService({ baseURL, apiKey, model }) {
  let currentAbort = null;

  async function* streamChat(messages) {
    if (currentAbort) {
      currentAbort.abort();
    }
    currentAbort = new AbortController();

    const body = {
      model: model || DEFAULTS.MODEL,
      max_tokens: DEFAULTS.MAX_TOKENS,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-DEFAULTS.MAX_HISTORY * 2),
      ],
    };

    try {
      const resp = await fetch(`${baseURL || DEFAULTS.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: currentAbort.signal,
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`API ${resp.status}: ${errText}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {}
        }
      }
    } finally {
      currentAbort = null;
    }
  }

  function abort() {
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
  }

  return { streamChat, abort };
}
