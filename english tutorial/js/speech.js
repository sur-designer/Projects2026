// Browser speech: recognition (speech-to-text) with fluency metrics, and speech synthesis (text-to-speech).
window.Speech = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supported = { stt: !!SR, tts: 'speechSynthesis' in window };

  // ---------- Text-to-speech ----------
  let voices = [];
  const voiceListeners = [];
  function loadVoices() {
    if (!supported.tts) return;
    voices = speechSynthesis.getVoices();
    voiceListeners.forEach(fn => fn(voices));
  }
  if (supported.tts) {
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  function pickVoice() {
    const s = Store.settings;
    const lang = Store.speechLang().toLowerCase();
    const prefix = lang.split('-')[0];
    const norm = v => v.lang.toLowerCase().replace('_', '-');
    if (s.voiceURI) {
      const v = voices.find(v => v.voiceURI === s.voiceURI);
      if (v && norm(v).startsWith(prefix)) return v; // ignore a chosen voice that belongs to another language
    }
    const nice = v => /natural|neural|online|google|premium|enhanced/i.test(v.name);
    const best = list => list.find(nice) || list[0];
    const alt = Store.learnLang().voiceFallback; // e.g. Marathi falls back to a Hindi voice (same script)
    return best(voices.filter(v => norm(v) === lang)) ||
      best(voices.filter(v => norm(v).startsWith(prefix))) ||
      (alt && best(voices.filter(v => norm(v).startsWith(alt)))) || null;
  }

  let speakToken = 0;
  let pendingResolve = null;

  // Speaks text sentence by sentence (Chrome cuts off long utterances). Resolves when finished or interrupted.
  function speak(text, opts = {}) {
    stopSpeaking();
    if (!supported.tts || !text) return Promise.resolve();
    const token = ++speakToken;
    const chunks = String(text).match(/[^.!?]+[.!?]*["')\]]*\s*|.+$/g) || [text];
    return new Promise(resolve => {
      pendingResolve = resolve;
      let i = 0;
      const next = () => {
        if (token !== speakToken) return;
        if (i >= chunks.length) { pendingResolve = null; return resolve(); }
        const u = new SpeechSynthesisUtterance(chunks[i++].trim());
        const v = pickVoice();
        if (v) u.voice = v;
        u.lang = v ? v.lang : Store.speechLang();
        u.rate = opts.rate || Store.settings.rate || 1;
        u.onend = next;
        u.onerror = next;
        speechSynthesis.speak(u);
      };
      next();
    });
  }

  function stopSpeaking() {
    speakToken++;
    if (supported.tts) speechSynthesis.cancel();
    if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(); }
  }

  // ---------- Speech-to-text ----------
  const PAUSE_MS = 2500;

  class Recorder {
    constructor({ onUpdate, onSilence, onError, silenceMs = 0, lang = '' } = {}) {
      this.lang = lang; // overrides the practised language, e.g. a beginner answering in English
      this.onUpdate = onUpdate || (() => {});
      this.onSilence = onSilence;
      this.onError = onError || (() => {});
      this.silenceMs = silenceMs;
      this.finals = [];
      this.interim = '';
      this.longPauses = 0;
    }

    start() {
      this.active = true;
      this.startedAt = Date.now();
      this.firstAt = null;
      this.lastAt = null;
      this._spawn();
    }

    _spawn() {
      const r = new SR();
      r.lang = this.lang || Store.speechLang();
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = e => {
        this.gotResult = true;
        const now = Date.now();
        if (this.lastAt && now - this.lastAt > PAUSE_MS) this.longPauses++;
        if (!this.firstAt) this.firstAt = now;
        this.lastAt = now;
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            const t = res[0].transcript.trim();
            if (t) this.finals.push({ text: t, confidence: res[0].confidence });
          } else {
            interim += res[0].transcript;
          }
        }
        this.interim = interim.trim();
        this.onUpdate(this.text(), this.interim);
        this._armSilence();
      };
      r.onerror = e => {
        if (e.error !== 'aborted') this.lastError = e.error;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.active = false;
          this.onError('Microphone access was blocked. Allow the microphone in your browser\'s address bar and try again.');
        } else if (e.error === 'network') {
          this.active = false;
          this.onError('Speech recognition needs an internet connection (Chrome/Edge send audio to their speech service).');
        } else if (e.error === 'audio-capture') {
          this.active = false;
          this.onError('No microphone found. Please connect a microphone.');
        }
        // 'no-speech' and 'aborted' are handled by onend restarting.
      };
      r.onend = () => {
        if (this.active) {
          // Chrome stops continuous recognition after a silence; keep listening until we're told to stop.
          setTimeout(() => { if (this.active) { try { this._spawn(); } catch (err) { /* ignore */ } } }, 150);
        } else {
          this._finish();
        }
      };
      this.rec = r;
      try { r.start(); } catch (err) { /* already started */ }
    }

    _armSilence() {
      clearTimeout(this.silenceTimer);
      if (!this.silenceMs || !this.onSilence) return;
      this.silenceTimer = setTimeout(() => {
        if (this.active && (this.finals.length || this.interim)) this.onSilence();
      }, this.silenceMs);
    }

    text() { return this.finals.map(f => f.text).join(' ').replace(/\s+/g, ' ').trim(); }

    // Stops listening and resolves with the transcript + metrics.
    stop() {
      clearTimeout(this.silenceTimer);
      this.active = false;
      this.stoppedAt = Date.now();
      return new Promise(resolve => {
        this._resolve = resolve;
        try { this.rec.stop(); } catch (err) { this._finish(); }
        setTimeout(() => this._finish(), 1500); // safety net if onend never fires
      });
    }

    abort() {
      clearTimeout(this.silenceTimer);
      this.active = false;
      this._resolve = null;
      try { this.rec.abort(); } catch (err) { /* ignore */ }
    }

    _finish() {
      if (!this._resolve) return;
      const resolve = this._resolve;
      this._resolve = null;
      if (this.interim) { this.finals.push({ text: this.interim, confidence: 0 }); this.interim = ''; }
      resolve(this.result());
    }

    result() {
      const text = this.text();
      const words = text ? text.split(/\s+/).length : 0;
      const speakingSec = this.firstAt ? Math.max(2, (this.lastAt - this.firstAt) / 1000 + 1) : 0;
      const confs = this.finals.map(f => f.confidence).filter(c => c > 0);
      return {
        text,
        words,
        gotResult: !!this.gotResult,
        error: this.lastError || null,
        durationSec: Math.round(speakingSec),
        wpm: speakingSec ? Math.round(words / (speakingSec / 60)) : 0,
        fillers: countFillers(text),
        longPauses: this.longPauses,
        clarity: confs.length ? Math.round(100 * confs.reduce((a, b) => a + b, 0) / confs.length) : null
      };
    }
  }

  function countFillers(text) {
    const t = ' ' + text.toLowerCase().replace(/[^a-z' ]/g, ' ') + ' ';
    const found = {};
    let total = 0;
    TutorData.fillers.forEach(f => {
      const m = t.match(new RegExp(' ' + f + '(?= )', 'g'));
      if (m) { found[f] = m.length; total += m.length; }
    });
    return { total, found };
  }

  // Combines metrics of several answers into one summary.
  function combine(results) {
    const list = results.filter(Boolean).filter(r => r.words > 0);
    if (!list.length) return null;
    const words = list.reduce((a, r) => a + r.words, 0);
    const sec = list.reduce((a, r) => a + r.durationSec, 0);
    const found = {};
    list.forEach(r => Object.entries(r.fillers.found).forEach(([k, v]) => { found[k] = (found[k] || 0) + v; }));
    const clar = list.map(r => r.clarity).filter(c => c != null);
    return {
      answers: list.length,
      words,
      durationSec: sec,
      wpm: sec ? Math.round(words / (sec / 60)) : 0,
      fillers: { total: Object.values(found).reduce((a, b) => a + b, 0), found },
      longPauses: list.reduce((a, r) => a + r.longPauses, 0),
      clarity: clar.length ? Math.round(clar.reduce((a, b) => a + b, 0) / clar.length) : null
    };
  }

  // Live microphone level (0–1) so the learner can see whether the mic hears them. Returns a handle with stop().
  async function meter(onLevel) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Started without a click (e.g. hands-free mode) the context may be suspended and would read pure silence.
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    const buf = new Float32Array(an.fftSize);
    const handle = { peak: 0, device: stream.getAudioTracks()[0]?.label || 'Default microphone', stopped: false, reliable: ctx.state === 'running' };
    const loop = () => {
      if (handle.stopped) return;
      an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 6);
      handle.peak = Math.max(handle.peak, level);
      onLevel(level);
      requestAnimationFrame(loop);
    };
    loop();
    handle.stop = () => {
      handle.stopped = true;
      stream.getTracks().forEach(t => t.stop());
      ctx.close().catch(() => {});
    };
    return handle;
  }

  // Browsers that expose the speech API but whose speech service doesn't actually work.
  function browserProblem() {
    const ua = navigator.userAgent;
    if (navigator.brave) return 'Brave';
    if (/OPR\/|Opera/.test(ua)) return 'Opera';
    if (/Vivaldi/.test(ua)) return 'Vivaldi';
    if (/YaBrowser/.test(ua)) return 'Yandex';
    if (!SR) return 'this browser';
    return null;
  }

  // Explains why a recording came back empty, in plain words.
  function explainEmpty(r, m) {
    const b = browserProblem();
    if (b) return `${b} doesn't support speech recognition properly. Please open this page in Google Chrome or Microsoft Edge.`;
    if (r.error === 'network') return 'The speech service could not be reached. Check your internet connection (Chrome/Edge send audio to their speech service).';
    if (r.error === 'not-allowed' || r.error === 'service-not-allowed') return 'Microphone access is blocked. Click the 🔒 icon in the address bar and allow the microphone.';
    if (m && m.reliable && m.peak < 0.04) return `Your microphone isn't picking up any sound (using "${m.device}"). It may be muted: press your laptop's mic-mute key, or open Windows Settings → System → Sound → Input and click Unmute.`;
    if (m && m.reliable) return 'I could hear sound but couldn\'t make out any words. Speak a bit closer to the mic, and check the Accent setting matches how you speak.';
    return "I didn't catch that. Please try again, a little louder. Tip: use Settings → Test microphone to check your mic.";
  }

  return {
    supported,
    meter,
    browserProblem,
    explainEmpty,
    speak,
    stopSpeaking,
    Recorder,
    combine,
    voices: () => voices,
    onVoices(fn) { voiceListeners.push(fn); if (voices.length) fn(voices); }
  };
})();
