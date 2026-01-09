"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaGetVersion = ollamaGetVersion;
exports.ollamaGenerateNonStreaming = ollamaGenerateNonStreaming;
exports.ollamaGenerateStreaming = ollamaGenerateStreaming;
function joinUrl(base, path) {
    return base.replace(/\/+$/, "") + path;
}
async function ollamaGetVersion(endpoint) {
    const res = await fetch(joinUrl(endpoint, "/api/version"), { method: "GET" });
    if (!res.ok)
        throw new Error(`Ollama version check failed: ${res.status} ${res.statusText}`);
    const data = (await res.json());
    return data.version;
}
async function ollamaGenerateNonStreaming(args) {
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
    const data = (await res.json());
    return data.response ?? "";
}
async function ollamaGenerateStreaming(args) {
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
    if (!res.body)
        throw new Error("Ollama streaming response has no body.");
    // Ollama streams newline-delimited JSON (NDJSON).
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let final = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        // process complete lines
        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line)
                continue;
            let obj;
            try {
                obj = JSON.parse(line);
            }
            catch {
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
async function safeReadText(res) {
    try {
        return await res.text();
    }
    catch {
        return "";
    }
}
