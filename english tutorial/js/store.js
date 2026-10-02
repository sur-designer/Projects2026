// Local persistence: settings, history and progress live only in this browser (localStorage).
window.Store = (() => {
  const KEY = 'speakup.v1';
  const defaults = () => ({
    settings: {
      provider: 'gemini', keys: {}, models: {},
      lang: 'en-US', voiceURI: '', rate: 0.95,
      level: 'intermediate', nativeLang: '', name: '',
      handsFree: false, silenceSec: 2.5, speakCorrections: true,
      multiLang: false, learnLang: 'en', answerInEnglish: true
    },
    history: [], days: [], minutes: 0,
    pron: { attempts: 0, total: 0 }
  });

  let state = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    state = { ...state, ...saved, settings: { ...state.settings, ...(saved.settings || {}) } };
  } catch (e) { /* storage blocked or corrupt: fall back to defaults */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function today(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function markActive() {
    const t = today();
    if (!state.days.includes(t)) state.days.push(t);
    if (state.days.length > 400) state.days = state.days.slice(-400);
  }

  function streak() {
    const days = new Set(state.days);
    const d = new Date();
    if (!days.has(today(d))) d.setDate(d.getDate() - 1); // today not practised yet: streak still alive from yesterday
    let n = 0;
    while (days.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  return {
    get settings() { return state.settings; },
    setSettings(patch) { Object.assign(state.settings, patch); save(); },
    // The language being practised: English unless "Multiple languages" is on and another one is picked.
    learnLang() {
      const langs = TutorData.languages;
      return (state.settings.multiLang && langs.find(l => l.code === state.settings.learnLang)) || langs[0];
    },
    // BCP-47 code for speech recognition and synthesis.
    speechLang() { return this.learnLang().speech || state.settings.lang; },
    get history() { return state.history; },
    addHistory(entry) {
      state.history.push(entry);
      if (state.history.length > 150) state.history = state.history.slice(-150);
      markActive(); save();
    },
    addMinutes(sec) { if (sec > 0) { state.minutes += sec / 60; markActive(); save(); } },
    addPron(score) { state.pron.attempts++; state.pron.total += score; markActive(); save(); },
    stats() {
      const scored = state.history.filter(h => typeof h.score100 === 'number');
      return {
        sessions: state.history.length,
        minutes: Math.round(state.minutes),
        streak: streak(),
        avg: scored.length ? Math.round(scored.reduce((a, h) => a + h.score100, 0) / scored.length) : null,
        pronAttempts: state.pron.attempts,
        pronAvg: state.pron.attempts ? Math.round(state.pron.total / state.pron.attempts) : null
      };
    },
    clearProgress() {
      const settings = state.settings;
      state = { ...defaults(), settings };
      save();
    }
  };
})();
