export type OllamaGenerateChunk = {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
};

export type OllamaGenerateFinal = OllamaGenerateChunk & {
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

export type OllamaGenerateOptions = {
  temperature?: number;
  num_predict?: number;
};

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, "") + path;
}

export async function ollamaGetVersion(endpoint: string): Promise<string> {
  const res = await fetch(joinUrl(endpoint, "/api/version"), { method: "GET" });
  if (!res.ok) throw new Error(`Ollama version check failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { version: string };
  return data.version;
}

export async function ollamaGenerateNonStreaming(args: {
  endpoint: string;
  model: string;
  prompt: string;
  system?: string;
  options?: OllamaGenerateOptions;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(joinUrl(args.endpoint, "/api/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      model: args.model,
      prompt: args.prompt,
      system: args.system,
      stream: false,
      options: args.options ?? {}
    })
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(`Ollama error: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = (await res.json()) as OllamaGenerateFinal;
  return data.response ?? "";
}

export async function ollamaGenerateStreaming(args: {
  endpoint: string;
  model: string;
  prompt: string;
  system?: string;
  options?: OllamaGenerateOptions;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(joinUrl(args.endpoint, "/api/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: args.signal,
    body: JSON.stringify({
      model: args.model,
      prompt: args.prompt,
      system: args.system,
      stream: true,
      options: args.options ?? {}
    })
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(`Ollama error: ${res.status} ${res.statusText}\n${text}`);
  }

  if (!res.body) throw new Error("Ollama streaming response has no body.");

  // Ollama streams newline-delimited JSON (NDJSON).
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let final = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // process complete lines
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);

      if (!line) continue;

      let obj: OllamaGenerateChunk;
      try {
        obj = JSON.parse(line) as OllamaGenerateChunk;
      } catch {
        // ignore malformed partials
        continue;
      }

      const token = obj.response ?? "";
      if (token) {
        final += token;
        args.onToken(token);
      }

      if (obj.done) {
        return final;
      }
    }
  }

  // If stream ended without "done", return what we got
  return final;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
