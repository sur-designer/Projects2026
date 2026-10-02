// AI provider layer. All providers below have a free option; calls go straight from the browser to the provider.
window.AI = (() => {
  const PROVIDERS = {
    gemini: {
      label: 'Google Gemini — free tier (recommended)',
      model: 'gemini-3.6-flash',
      keyUrl: 'https://aistudio.google.com/apikey',
      help: 'Sign in with a Google account at Google AI Studio and click "Create API key". No credit card needed.',
      needsKey: true
    },
    groq: {
      label: 'Groq — free tier, very fast',
      model: 'openai/gpt-oss-120b',
      base: 'https://api.groq.com/openai/v1',
      keyUrl: 'https://console.groq.com/keys',
      help: 'Create a free account at console.groq.com and generate an API key.',
      needsKey: true
    },
    openrouter: {
      label: 'OpenRouter — free models',
      model: 'google/gemma-4-31b-it:free',
      base: 'https://openrouter.ai/api/v1',
      keyUrl: 'https://openrouter.ai/keys',
      help: 'Create a free account at openrouter.ai. Only model names ending in ":free" cost nothing — the free list changes often, so use "Find models" below.',
      needsKey: true
    },
    ollama: {
      label: 'Ollama — runs on your own PC, 100% offline',
      model: 'llama3.1',
      base: 'http://localhost:11434/v1',
      keyUrl: 'https://ollama.com/download',
      help: 'Install Ollama, then run "ollama pull llama3.1" in a terminal. No key needed. Needs a reasonably powerful PC.',
      needsKey: false
    }
  };

  function current() {
    const s = Store.settings;
    const id = PROVIDERS[s.provider] ? s.provider : 'gemini';
    const p = PROVIDERS[id];
    return { id, p, key: (s.keys[id] || '').trim(), model: (s.models[id] || '').trim() || p.model };
  }

  function ready() {
    const { p, key } = current();
    return !p.needsKey || !!key;
  }

  // Providers dislike a conversation that starts with the assistant or has two turns from the same side in a row.
  function normalise(messages) {
    const out = [];
    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      if (!out.length && role === 'assistant') out.push({ role: 'user', content: '(The learner joins the conversation.)' });
      const last = out[out.length - 1];
      if (last && last.role === role) last.content += '\n' + m.content;
      else out.push({ role, content: m.content });
    }
    return out;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const BUSY = [500, 502, 503, 504];

  // Google retires model names over time; ask the API which "flash" text models this key can use, newest first.
  let geminiModels = null;
  async function listGeminiModels(key) {
    if (geminiModels) return geminiModels;
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const data = await res.json().catch(() => ({}));
    const ver = n => (n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1] * 1;
    const names = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''))
      .filter(n => /^gemini-[\d.]+-flash(-lite)?(-\d{3})?$|^gemini-flash(-lite)?-latest$/.test(n));
    // Newest first; full "flash" before "flash-lite" of the same version.
    names.sort((a, b) => ver(b) - ver(a) || /lite/.test(a) - /lite/.test(b));
    if (names.length) geminiModels = names;
    return names;
  }

  // Groq / OpenRouter / Ollama also retire models; list what this key can use and rank good chat models first.
  const modelCache = {};
  async function listModels(id, p, key) {
    if (id === 'gemini') return listGeminiModels(key);
    if (modelCache[id]) return modelCache[id];
    const res = await fetch(p.base + '/models', { headers: key ? { Authorization: 'Bearer ' + key } : {} });
    const data = await res.json().catch(() => ({}));
    let ids = (data.data || data.models || []).map(m => m.id || m.name).filter(Boolean);
    // Skip speech, safety-filter, embedding and image models: we need a text chat model.
    // Also skip specialised models (code-only, safety filters, finance/medical tunes).
    ids = ids.filter(n => !/whisper|tts|speech|audio|guard|safety|embed|vision|image|playai|orpheus|moderation|rerank|code|coder|-fin\b|-fin:|sante|medical|math/i.test(n));
    if (id === 'openrouter') ids = ids.filter(n => n.endsWith(':free'));
    const prefer = [/gpt-oss-120b/, /gemma-\d+-(2\d|3\d)b/, /llama-4-maverick/, /llama-3\.3-70b/, /qwen/, /glm/, /nemotron-.*super/, /deepseek/, /kimi/, /mistral/, /llama/, /gemma/, /nemotron/, /gpt-oss-20b/];
    const rank = n => { const i = prefer.findIndex(re => re.test(n.toLowerCase())); return i === -1 ? prefer.length : i; };
    const size = n => Math.max(0, ...(n.toLowerCase().match(/(\d+)b\b/g) || []).map(x => parseInt(x, 10)));
    ids.sort((a, b) => rank(a) - rank(b) || size(b) - size(a));
    if (ids.length) modelCache[id] = ids;
    return ids;
  }

  // A model name that no longer exists: Gemini/OpenRouter answer 404, Groq may answer 400 "model_decommissioned".
  const isRetired = r => r.status === 404 ||
    (r.status === 400 && /decommission|does not exist|not found|no longer (available|supported)|invalid model|not a valid model/i.test(JSON.stringify(r.data?.error || '')));

  const status = msg => { try { api.onStatus && api.onStatus(msg); } catch (e) { /* ignore */ } };

  async function chat({ system, messages, json = true, temperature = 0.7 }) {
    const { id, p, key, model } = current();
    if (p.needsKey && !key) throw new Error('NO_KEY');
    const body = { system, messages: normalise(messages), json, temperature };

    // Busy servers: retry the same model twice with a short wait.
    let r = await request(id, p, key, model, body);
    for (const wait of [1500, 4000]) {
      if (!BUSY.includes(r.status)) break;
      status('The AI server is busy — retrying…');
      await sleep(wait);
      r = await request(id, p, key, model, body);
    }

    // Model retired, or still overloaded → try other models this key can use.
    const retired = isRetired(r);
    if (retired || BUSY.includes(r.status)) {
      const others = (await listModels(id, p, key).catch(() => [])).filter(m => m !== model).slice(0, 4);
      for (const alt of others) {
        status(retired ? 'Updating to a newer AI model…' : 'Still busy — switching to a backup model…');
        const r2 = await request(id, p, key, alt, body);
        if (r2.ok) {
          if (retired) Store.setSettings({ models: { ...Store.settings.models, [id]: alt } }); // remember the working model
          r = r2;
          break;
        }
        if (r2.status === 429) continue; // this free model is rate-limited; try the next one
        if (!isRetired(r2) && !BUSY.includes(r2.status)) { r = r2; break; }
      }
    }

    const data = r.data;
    if (!r.ok) {
      const msg = data?.error?.message || data?.error || 'Request failed';
      if (r.status === 429) throw new Error('Free-tier rate limit reached. Wait a minute and try again, or switch provider in Settings.');
      if (BUSY.includes(r.status)) throw new Error('The free AI servers are very busy right now. Please try again in a minute, or pick Groq in Settings as a backup.');
      if (r.status === 401 || r.status === 403 || /api key/i.test(msg)) throw new Error('The API key was rejected. Check it in Settings.');
      throw new Error(`AI error (${r.status}): ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    }

    const text = id === 'gemini'
      ? (data.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || '').join('')
      : data.choices?.[0]?.message?.content || '';
    if (!text.trim()) throw new Error('The AI returned an empty answer. Please try again.');
    return text;
  }

  // One HTTP request to the provider. Returns { status, ok, data }; throws only on network failure.
  async function request(id, p, key, model, { system, messages: msgs, json, temperature }) {
    let res;
    try {
      if (id === 'gemini') {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) }
          })
        });
      } else {
        const headers = { 'Content-Type': 'application/json' };
        if (key) headers.Authorization = 'Bearer ' + key;
        res = await fetch(p.base + '/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ model, temperature, messages: [{ role: 'system', content: system }, ...msgs] })
        });
      }
    } catch (e) {
      throw new Error(id === 'ollama'
        ? 'Could not reach Ollama at localhost:11434. Is Ollama running?'
        : 'Network error — check your internet connection.');
    }

    return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) };
  }

  // Extracts a JSON object from a model answer, tolerating code fences and chatter.
  function parseJSON(text) {
    let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(t); } catch (e) { /* fall through */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('Could not read the AI answer.');
  }

  // Chat + JSON parse, with one retry if the model answers in the wrong format.
  async function chatJSON(opts) {
    const raw = await chat(opts);
    try { return parseJSON(raw); } catch (e) {
      const again = await chat({ ...opts, messages: [...opts.messages, { role: 'assistant', content: raw }, { role: 'user', content: 'Return ONLY the valid JSON object described in your instructions, nothing else.' }] });
      return parseJSON(again);
    }
  }

  // Models the current provider/key can use, best first (for the Settings "Find models" button).
  async function availableModels() {
    const { id, p, key } = current();
    if (p.needsKey && !key) throw new Error('NO_KEY');
    if (id === 'gemini') geminiModels = null; else delete modelCache[id];
    return listModels(id, p, key);
  }

  const api = { PROVIDERS, current, ready, chat, chatJSON, parseJSON, availableModels, onStatus: null };
  return api;
})();
