import { AISettings, AIModelInfo, AIChatMessage } from '../types/index.js';

export class UniversalAIClient {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = { ...settings };
  }

  public updateSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): AISettings {
    return { ...this.settings };
  }

  private getBaseUrl(): string {
    let url = this.settings.baseUrl.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.settings.customHeaders || {}),
    };

    const baseUrl = this.getBaseUrl();

    if (this.settings.apiKey && this.settings.apiKey.trim()) {
      const cleanKey = this.settings.apiKey.trim();
      headers['Authorization'] = `Bearer ${cleanKey}`;
      if (baseUrl.includes('generativelanguage.googleapis.com')) {
        headers['x-goog-api-key'] = cleanKey;
      }
    }

    if (baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://neironoboock.app';
      headers['X-Title'] = 'NeironoBoock';
    }

    return headers;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number; modelsCount?: number }> {
    const start = Date.now();
    const baseUrl = this.getBaseUrl();
    const apiKey = (this.settings.apiKey || '').trim();

    if (!apiKey && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      return {
        success: false,
        message: 'Введите API ключ для проверки подключения',
        latencyMs: 0,
      };
    }

    try {
      // Fast path for Google Gemini (direct ping)
      if (baseUrl.includes('generativelanguage.googleapis.com')) {
        const testModel = (this.settings.model || 'gemini-2.5-flash').replace('models/', '');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
              generationConfig: { maxOutputTokens: 2 },
            }),
            signal: AbortSignal.timeout(6000),
          });

          if (res.ok) {
            const latencyMs = Date.now() - start;
            return {
              success: true,
              message: `Подключение успешно! Нейросеть отвечает (пинг: ${latencyMs}мс)`,
              latencyMs,
            };
          }
        } catch {}
      }

      // Fast models fetch check
      const models = await this.fetchAvailableModels();
      const latencyMs = Date.now() - start;
      return {
        success: true,
        message: `Подключение успешно! Доступно моделей: ${models.length} (пинг: ${latencyMs}мс)`,
        latencyMs,
        modelsCount: models.length,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        message: err?.message || 'Не удалось подключиться к API',
        latencyMs,
      };
    }
  }

  public async fetchAvailableModels(): Promise<AIModelInfo[]> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Укажите Base URL для API');
    }

    const apiKey = (this.settings.apiKey || '').trim();
    let endpoint = `${baseUrl}/models`;
    if (baseUrl.includes('generativelanguage.googleapis.com') && apiKey && !endpoint.includes('key=')) {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Ошибка HTTP ${res.status}: ${res.statusText || errTxt}`);
      }

      const data = (await res.json()) as any;

      // 1. Standard OpenAI format { data: [{ id, name }] }
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
        }));
      }

      // 2. Google Native format { models: [{ name: 'models/gemini-1.5-flash', displayName }] }
      if (Array.isArray(data.models) && data.models.length > 0) {
        return data.models
          .filter((m: any) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => {
            const cleanId = (m.name || '').replace('models/', '');
            return {
              id: cleanId,
              name: m.displayName || cleanId,
            };
          });
      }

      return [{ id: this.settings.model || 'gemini-2.5-flash' }];
    } catch (err) {
      throw err;
    }
  }

  private async generateGoogleNativeCompletion(
    messages: AIChatMessage[],
    temperature?: number
  ): Promise<string> {
    const apiKey = (this.settings.apiKey || '').trim();
    let initialModel = (this.settings.model || '').trim();
    if (initialModel.startsWith('models/')) initialModel = initialModel.replace('models/', '');

    // List of candidate models to try in order of modern preference
    const candidateModels = Array.from(
      new Set(
        [
          initialModel,
          'gemini-2.5-flash',
          'gemini-3.7-flash',
          'gemini-3.5-flash',
          'gemini-3.1-pro',
        ].filter(Boolean)
      )
    );

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: {
        temperature: temperature ?? this.settings.temperature ?? 0.7,
      },
    };

    let lastErrorText = '';

    // 1. Try candidates in list
    for (const cand of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cand}:generateContent?key=${apiKey}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === 'string') {
            this.settings.model = cand;
            return text.trim();
          }
        } else {
          lastErrorText = await res.text().catch(() => '');
          if (res.status === 401 || res.status === 403) {
            throw new Error(`Неверный Google API ключ (код ${res.status}). Проверьте правильность скопированного ключа.`);
          }
        }
      } catch (err: any) {
        if (err.message.includes('Google API ключ')) throw err;
      }
    }

    // 2. Dynamic fallback: fetch live models from user's account and try them
    try {
      const liveModels = await this.fetchAvailableModels();
      for (const liveM of liveModels.slice(0, 3)) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${liveM.id}:generateContent?key=${apiKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000),
          });

          if (res.ok) {
            const data = (await res.json()) as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof text === 'string') {
              this.settings.model = liveM.id;
              return text.trim();
            }
          }
        } catch {}
      }
    } catch {}

    throw new Error(`Google Gemini Native error: ${lastErrorText || 'Модель не найдена'}`);
  }

  public async generateCompletion(
    messages: AIChatMessage[],
    temperature?: number
  ): Promise<string> {
    const baseUrl = this.getBaseUrl();

    // Priority for Google Gemini: try Native Google Endpoint first for 100% stability
    if (baseUrl.includes('generativelanguage.googleapis.com') && this.settings.apiKey) {
      try {
        return await this.generateGoogleNativeCompletion(messages, temperature);
      } catch (nativeErr: any) {
        // Fall back to OpenAI compatibility endpoint
      }
    }

    const endpoint = `${baseUrl}/chat/completions`;

    let model = (this.settings.model || 'gpt-4o-mini').trim();
    if (baseUrl.includes('generativelanguage.googleapis.com')) {
      if (model === 'gemini-2.0-flash') {
        model = 'gemini-1.5-flash';
      }
    }

    const payload = {
      model,
      messages,
      temperature: temperature ?? this.settings.temperature ?? 0.7,
      stream: false,
    };

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      if (baseUrl.includes('generativelanguage.googleapis.com') || baseUrl.includes('openai.com')) {
        throw new Error(
          `Сетевой сбой при подключении к ${baseUrl}. В некоторых регионах прямой доступ к серверам Google/OpenAI блокируется провайдером (SSL net_error -100). Рекомендуется использовать OpenRouter (работает без ограничений и дает доступ к Gemini, Claude и GPT по 1 ключу) или включить VPN.`
        );
      }
      throw new Error(`Сетевая ошибка подключения: ${networkErr?.message || networkErr}`);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      let parsedMessage = errorText;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error?.message) {
          parsedMessage = errJson.error.message;
        } else if (Array.isArray(errJson) && errJson[0]?.error?.message) {
          parsedMessage = errJson[0].error.message;
        }
      } catch {}

      if (parsedMessage.includes('gemini-2.0-flash is no longer available')) {
        throw new Error(
          `Модель gemini-2.0-flash устарела в Google API. Переключитесь на «Gemini 1.5 Flash» или «Gemini 1.5 Pro».`
        );
      }
      if (res.status === 404) {
        throw new Error(
          `Модель «${model}» не найдена (404). Выберите модель из списка или нажмите «Загрузить список из API» (рекомендуется: gemini-1.5-flash).`
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Неверный или неактивный API ключ (код ${res.status}). Убедитесь, что скопировали верный ключ из личного кабинета.`
        );
      }
      throw new Error(`AI API error (${res.status}): ${parsedMessage}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new Error('Invalid response structure from AI endpoint');
    }

    return text.trim();
  }

  public async *streamCompletion(
    messages: AIChatMessage[],
    temperature?: number
  ): AsyncGenerator<string, void, unknown> {
    const baseUrl = this.getBaseUrl();
    const endpoint = `${baseUrl}/chat/completions`;

    const payload = {
      model: this.settings.model || 'gpt-4o-mini',
      messages,
      temperature: temperature ?? this.settings.temperature ?? 0.7,
      stream: true,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API stream error (${res.status}): ${err}`);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
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
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        if (trimmed === 'data: [DONE]') return;

        try {
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          const chunk = JSON.parse(jsonStr) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Ignore incomplete JSON chunks in stream
        }
      }
    }
  }
}
