(() => {
  const D = window.TutorData;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.ceil(s) % 60).padStart(2, '0')}`;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));

  const LEVELS = {
    beginner: 'beginner (CEFR A1–A2): use very simple, common words and short sentences',
    intermediate: 'intermediate (CEFR B1–B2): use everyday natural language, explain any idioms you use',
    advanced: 'advanced (CEFR C1+): speak naturally with idioms, phrasal verbs and richer vocabulary'
  };

  // Language being practised (English unless "Multiple languages" is on).
  const learnLang = () => Store.learnLang();
  const isEnglish = () => learnLang().code === 'en';
  // How the AI should write a sound guide for learners who can't read the language yet.
  const sayGuide = () => ['hi', 'mr'].includes(learnLang().code)
    ? 'a simple romanisation in English letters, e.g. "namaste, aap kaise hain?"'
    : 'an English-style respelling with the stressed syllable in capitals, e.g. "OH-lah, KOH-moh ehs-TAHS"';

  // Converts English text into the practised language, with a sound guide. Returns { t, en, say }.
  async function toTarget(english) {
    const L = learnLang().name;
    const r = await AI.chatJSON({
      system: `You help an English speaker who is a complete beginner in ${L}. Translate their English into natural, simple spoken ${L}. Return ONLY valid JSON: {"text": "the ${L} translation, in ${L} script", "say": "how to pronounce it: ${sayGuide()}", "english": "the English meaning"}`,
      messages: [{ role: 'user', content: english }],
      temperature: 0.2
    });
    return { t: String(r.text || '').trim() || english, en: r.english || english, say: r.say || '' };
  }

  function requireEnglish(what) {
    if (isEnglish()) return true;
    toast(`The ${what} is in English only. Switch the language to English on the Home page to take it.`, 'error');
    return false;
  }

  // ---------- UI helpers ----------
  let toastTimer;
  function toast(msg, kind = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, kind === 'error' ? 6000 : 3500);
  }

  function busy(on, msg = 'Working…') {
    $('#busyMsg').textContent = msg;
    $('#busy').classList.toggle('show', on);
  }

  function handleAIError(e) {
    if (e.message === 'NO_KEY') { toast('Connect a free AI key first — it takes 1 minute.', 'error'); showView('settings'); return; }
    toast(e.message, 'error');
  }

  function requireAI() {
    if (AI.ready()) return true;
    toast('Connect a free AI key first — it takes 1 minute.', 'error');
    showView('settings');
    return false;
  }

  function requireMic() {
    if (Speech.supported.stt) return true;
    toast('Voice input needs Google Chrome or Microsoft Edge. You can still type your answers.', 'error');
    return false;
  }

  function speakBtn(text, label = 'Listen') {
    return `<button class="icon-btn" data-say="${esc(text)}" title="${label}" aria-label="${label}">🔊</button>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (b) { e.preventDefault(); Speech.speak(b.dataset.say, b.dataset.slow ? { rate: 0.65 } : {}); }
  });

  function askInput(label, placeholder) {
    const dlg = $('#inputDialog');
    $('#inputLabel').textContent = label;
    const inp = $('#inputValue');
    inp.value = '';
    inp.placeholder = placeholder || '';
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); dlg.close('ok'); } };
    dlg.returnValue = '';
    dlg.showModal();
    inp.focus();
    return new Promise(resolve => {
      dlg.onclose = () => resolve(dlg.returnValue === 'ok' ? inp.value.trim() : null);
    });
  }

  // ---------- Navigation ----------
  let currentView = 'home';
  function showView(id, navId = id) {
    if (currentView === 'session' && id !== 'session') leaveSession();
    if (currentView === 'test' && id !== 'test' && run) abortRun();
    if (currentView === 'pron' && id !== 'pron') stopPronRecording();
    currentView = id;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
    $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === navId));
    document.body.dataset.view = id;
    window.scrollTo(0, 0);
    if (id === 'home') renderHome();
    if (id === 'progress') renderProgress();
    if (id === 'settings') renderSettings();
    if (id === 'pron') renderPron();
  }
  $$('.nav button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (!g) return;
    const [view, arg] = g.dataset.go.split(':');
    if (view === 'scenario') chooseScenario(arg);
    else if (view === 'ielts' && arg) startIelts(arg);
    else showView(view);
  });

  // ---------- Home ----------
  function renderHome() {
    const s = Store.stats();
    const name = Store.settings.name;
    const h = new Date().getHours();
    $('#greet').textContent = `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}${name ? ', ' + name : ''} 👋`;
    $('#heroStats').innerHTML = [
      ['🔥', s.streak, s.streak === 1 ? 'day streak' : 'day streak'],
      ['⏱️', s.minutes, 'minutes spoken'],
      ['⭐', s.avg ?? '–', 'avg score']
    ].map(([i, v, l]) => `<div class="stat"><span>${i}</span><strong>${v}</strong><small>${l}</small></div>`).join('');
    $('#setupBanner').classList.toggle('hidden', AI.ready());
    $('#browserBanner').classList.toggle('hidden', Speech.supported.stt);
    renderLangBar();
  }

  // ---------- Multiple languages ----------
  function renderLangBar() {
    const st = Store.settings;
    const L = learnLang();
    $('#multiLang').checked = st.multiLang;
    $('#heroTitle').textContent = `Speak ${L.name} with confidence.`;
    $('#langTabs').classList.toggle('hidden', !st.multiLang);
    $('#langTabs').innerHTML = D.languages.map(l => `<button class="tab ${l.code === L.code ? 'active' : ''}" data-lang="${l.code}" aria-pressed="${l.code === L.code}">${esc(l.native)}${l.native !== l.name ? ` · ${esc(l.name)}` : ''}</button>`).join('');
    $('#langNote').textContent = !st.multiLang ? ''
      : isEnglish() ? 'Pick a language to practise. Conversations and pronunciation work in every language.'
      : `Learning ${L.name} from English: every ${L.name} line shows its English meaning and how to say it. New to ${L.name}? Start with Pronounce → First words, and in Talk you can answer in English. (The IELTS and level tests stay in English.)`;
  }

  function setLearnLang(patch) {
    Speech.stopSpeaking();
    stopPronRecording();
    Store.setSettings(patch);
    Object.assign(pron, { set: 0, idx: 0, custom: null, result: null });
    renderLangBar();
  }
  $('#multiLang').addEventListener('change', e => setLearnLang({ multiLang: e.target.checked }));
  $('#langTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (b) setLearnLang({ learnLang: b.dataset.lang });
  });

  // ---------- Talk: scenarios ----------
  function renderScenarios() {
    $('#scenarioGrid').innerHTML = D.scenarios.map(sc => `
      <button class="card scenario" data-go="scenario:${sc.id}">
        <span class="card-icon">${sc.icon}</span>
        <span class="pill">${esc(sc.tag)}</span>
        <strong>${esc(sc.title)}</strong>
        <small>${esc(sc.desc)}</small>
      </button>`).join('');
  }

  async function chooseScenario(id) {
    const sc = D.scenarios.find(s => s.id === id);
    if (!sc || !requireAI()) return;
    let input = '';
    if (sc.input) {
      input = await askInput(sc.input.label, sc.input.placeholder);
      if (!input) return;
    }
    startSession(sc, input);
  }

  // ---------- Conversation session ----------
  let session = null;
  let micState = 'idle';

  function setMic(state) {
    micState = state;
    const b = $('#micBtn');
    b.className = 'mic ' + state;
    const labels = { idle: ['🎙️', 'Tap to speak'], listening: ['■', 'Tap when finished'], thinking: ['…', 'Thinking…'], speaking: ['🔊', 'Tap to interrupt'] };
    b.innerHTML = `<span>${labels[state][0]}</span>`;
    $('#micHint').textContent = labels[state][1];
    b.disabled = state === 'thinking';
  }

  async function startSession(sc, input) {
    const fill = t => t.replaceAll('{input}', input);
    const L = learnLang();
    const s = {
      sc, input,
      title: sc.title + (input ? ' · ' + input : '') + (isEnglish() ? '' : ' · ' + L.name),
      role: fill(sc.role),
      messages: [],
      turns: [],
      recorder: null
    };
    let opener = fill(sc.opener);
    let ideas = [];
    let help = {};
    if (!isEnglish()) {
      // The scenario openers are written in English: ask the tutor to open in the practised language instead.
      busy(true, `Preparing your ${L.name} tutor…`);
      try {
        const data = await AI.chatJSON({
          system: chatSystem(s),
          messages: [{ role: 'user', content: `(The learner has just joined. Say your opening line in ${L.name}, adapted from this English opener: "${opener}". Use null for "correction" and "better".)` }]
        });
        opener = String(data.reply || '').trim() || opener;
        ideas = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : [];
        help = { en: data.reply_en, say: data.reply_say };
      } catch (e) {
        handleAIError(e);
        return;
      } finally {
        busy(false);
      }
    }
    session = s;
    $('#sessTitle').textContent = session.title;
    $('#sessSub').textContent = `${isEnglish() ? '' : L.name + ' · '}${Store.settings.level[0].toUpperCase() + Store.settings.level.slice(1)} level · speak naturally, I'll correct you as we go`;
    $('#chat').innerHTML = '';
    $('#live').textContent = '';
    $('#handsFree').checked = Store.settings.handsFree;
    $('#rateQuick').value = String(Store.settings.rate);
    $('#answerEnWrap').classList.toggle('hidden', isEnglish());
    $('#answerEn').checked = !isEnglish() && Store.settings.answerInEnglish;
    $('#textInput').placeholder = isEnglish() ? '…or type your answer' : `…or type your answer (in ${L.name} or English)`;
    showView('session', 'talk');
    session.messages.push({ role: 'assistant', content: JSON.stringify({ reply: opener }) });
    addTutor(opener, ideas, help);
    tutorSpeaks(opener, session);
  }

  function leaveSession() {
    if (!session) return;
    session.recorder?.abort();
    stopMeter(session);
    session = null;
    Speech.stopSpeaking();
    setMic('idle');
  }

  function chatSystem(s) {
    const st = Store.settings;
    const L = learnLang().name;
    const other = !isEnglish();
    return `You are ${s.role}. At the same time you are an expert, encouraging ${L} speaking coach.
The learner is practising spoken ${L}. The learner is ${LEVELS[st.level]}.${st.name ? ' The learner\'s name is ' + st.name + '.' : ''}
Scenario: "${s.sc.title}" — ${s.sc.desc}
The learner's messages are speech-to-text transcripts: ignore missing punctuation, capital letters and obvious transcription glitches — never correct those.${other ? `
English is the learner's base language and they may know little or no ${L}. Always speak ${L} in "reply", "corrected", "better" and "suggestions", and keep it short and simple. The learner may answer in English: that is expected, never a mistake. When they do, put their message converted into ${L} in "learner_in_target", use null for "correction" and "better", and carry on the conversation in ${L}.` : ''}

For every learner message:
1. "reply": stay in character and keep the conversation natural. 1–3 short sentences (max ~45 words), matched to the learner's level, usually ending with a question so they keep talking. No markdown, emojis, lists or stage directions — it will be read aloud.
2. "correction": check ONLY the learner's latest message for real grammar, word-choice or vocabulary mistakes. If there are none, use null. Otherwise give the learner's words, the corrected sentence and a short friendly explanation${other ? ' written in English' : ''}${st.nativeLang ? `, followed by the same explanation in ${st.nativeLang} in brackets` : ''}.
3. "better": if a native speaker would phrase it more naturally, give that version; otherwise null.
4. "suggestions": two short example answers the learner could say next (at their level).${other ? `
5. "reply_en": the English meaning of "reply". "reply_say": how to pronounce "reply", as ${sayGuide()}.
6. Each suggestion is an object: {"text": "in ${L}", "en": "English meaning", "say": "sound guide"}.
7. "learner_in_target": null, or {"text": "the learner's English message said in ${L}", "say": "sound guide"}.` : ''}

Return ONLY valid JSON in exactly this shape:
${other
  ? '{"reply": "...", "reply_en": "...", "reply_say": "...", "learner_in_target": null or {"text": "...", "say": "..."}, "correction": null or {"original": "...", "corrected": "...", "explanation": "..."}, "better": null or "...", "suggestions": [{"text": "...", "en": "...", "say": "..."}, {"text": "...", "en": "...", "say": "..."}]}'
  : '{"reply": "...", "correction": null or {"original": "...", "corrected": "...", "explanation": "..."}, "better": null or "...", "suggestions": ["...", "..."]}'}`;
  }

  // English meaning and sound guide shown under a line in another language.
  function helpLines(en, say) {
    if (isEnglish()) return '';
    return (en ? `<small class="help-en">English: ${esc(en)}</small>` : '') + (say ? `<small class="help-say">Say it like: ${esc(say)}</small>` : '');
  }

  // help = { en, say } for other languages; suggestions are strings (English) or { text, en, say } objects.
  function addTutor(text, suggestions, help = {}) {
    const el = document.createElement('div');
    el.className = 'msg tutor';
    const idea = x => typeof x === 'string' ? { text: x } : (x || {});
    const ideas = (suggestions || []).map(idea).filter(x => x.text);
    el.innerHTML = `<div class="avatar-sm">🤖</div><div class="bubble"><p>${esc(text)}</p>${helpLines(help.en, help.say)}
      <div class="bubble-actions">${speakBtn(text, 'Replay')}<button class="icon-btn" data-say="${esc(text)}" data-slow="1" title="Replay slowly" aria-label="Replay slowly">🐢</button></div>
      ${ideas.length ? `<details class="ideas" ${isEnglish() ? '' : 'open'}><summary>💡 ${isEnglish() ? 'Need an idea?' : 'What you could say'}</summary>${ideas.map(x => `<button class="chip" data-say="${esc(x.text)}">${esc(x.text)}${x.en ? `<small>${esc(x.en)}${x.say ? ' · ' + esc(x.say) : ''}</small>` : ''}</button>`).join('')}<small>${isEnglish() ? 'Tap to hear it, then say it in your own words.' : `Tap to hear it, then say it. You can also answer in English and I'll show you how to say it in ${esc(learnLang().name)}.`}</small></details>` : ''}
    </div>`;
    $('#chat').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function addUser(text) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.innerHTML = `<div class="bubble"><p>${esc(text)}</p><div class="fb"></div></div>`;
    $('#chat').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'msg tutor';
    el.innerHTML = '<div class="avatar-sm">🤖</div><div class="bubble typing"><i></i><i></i><i></i></div>';
    $('#chat').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
  }

  // Teacher-style feedback that the tutor says out loud before continuing the conversation.
  function coachSpeech(data) {
    const c = data.correction;
    // Drop the bracketed native-language translation when speaking; it stays visible on screen.
    const plain = t => String(t || '').replace(/\s*[(\[][^)\]]*[)\]]\s*/g, ' ').trim().replace(/[.!?]+$/, '');
    // Other languages: the tutor voice speaks that language, so only say the corrected sentence; the English explanation stays on screen.
    if (!isEnglish()) return c && c.corrected ? plain(c.corrected) : plain(data.better);
    if (c && c.corrected) {
      return `Before we continue, a small correction. ${c.original ? `You said: "${plain(c.original)}". ` : ''}The correct way is: "${plain(c.corrected)}". ${plain(c.explanation)}`.trim();
    }
    if (data.better) return `Good, that was correct! A more natural way to say it is: "${plain(data.better)}".`;
    return '';
  }

  // A tutor bubble with the correction, shown before the next question.
  function addCoach(data) {
    const c = data.correction;
    const el = document.createElement('div');
    el.className = 'msg tutor';
    let body = '';
    if (c && c.corrected) {
      body = `<span class="tag">✏️ Let me correct that first</span>
        ${c.original ? `<div>You said: <s>${esc(c.original)}</s></div>` : ''}
        <div>Correct: <b>${esc(c.corrected)}</b> ${speakBtn(c.corrected)}<button class="icon-btn" data-say="${esc(c.corrected)}" data-slow="1" title="Hear it slowly" aria-label="Hear it slowly">🐢</button></div>
        ${c.explanation ? `<small>${esc(c.explanation)}</small>` : ''}
        ${data.better ? `<div class="coach-better">✨ Even more natural: ${esc(data.better)} ${speakBtn(data.better)}</div>` : ''}`;
    } else {
      body = `<span class="tag ok">✓ Correct!</span><div>More natural: <b>${esc(data.better)}</b> ${speakBtn(data.better)}</div>`;
    }
    el.innerHTML = `<div class="avatar-sm">👩‍🏫</div><div class="bubble coach">${body}</div>`;
    $('#chat').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  // Shows the learner's English message converted into the practised language.
  function addConverted(c) {
    const el = document.createElement('div');
    el.className = 'msg tutor';
    el.innerHTML = `<div class="avatar-sm">👩‍🏫</div><div class="bubble coach">
      <span class="tag ok">🔁 In ${esc(learnLang().name)} you say</span>
      <div><b>${esc(c.text)}</b> ${speakBtn(c.text)}<button class="icon-btn" data-say="${esc(c.text)}" data-slow="1" title="Hear it slowly" aria-label="Hear it slowly">🐢</button></div>
      ${helpLines('', c.say)}
      <small>Try saying it out loud now.</small></div>`;
    $('#chat').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function renderFeedback(el, data) {
    const fb = $('.fb', el);
    const c = data.correction;
    let html = '';
    if (Store.settings.speakCorrections) {
      // The correction gets its own tutor bubble; just mark the answer here.
      fb.innerHTML = c && c.corrected
        ? '<div class="fb-item fix"><span class="tag">✏️ See correction below</span></div>'
        : data.better ? '<div class="fb-item ok">✓ Correct</div>' : '<div class="fb-item ok">✓ Great — no mistakes!</div>';
      return;
    }
    if (c && c.corrected) {
      html += `<div class="fb-item fix"><span class="tag">✏️ Correction</span>
        <div>${c.original ? `<s>${esc(c.original)}</s> → ` : ''}<b>${esc(c.corrected)}</b> ${speakBtn(c.corrected)}</div>
        ${c.explanation ? `<small>${esc(c.explanation)}</small>` : ''}</div>`;
    }
    if (data.better) {
      html += `<div class="fb-item tip"><span class="tag">✨ Sounds more natural</span><div>${esc(data.better)} ${speakBtn(data.better)}</div></div>`;
    }
    if (!html) html = '<div class="fb-item ok">✓ Great — no mistakes!</div>';
    fb.innerHTML = html;
  }

  // Speaks one or more texts in order; tapping the mic while speaking skips the rest.
  async function tutorSpeaks(texts, s) {
    setMic('speaking');
    s.interrupted = false;
    for (const t of [].concat(texts).filter(Boolean)) {
      await Speech.speak(t);
      if (session !== s || s.interrupted) break;
    }
    if (session !== s) return;
    if ($('#handsFree').checked && Speech.supported.stt) startListening();
    else setMic('idle');
  }

  // Shows the live mic volume in a bar; returns a promise of the meter handle (or null if unavailable).
  function startMeter(barSel) {
    const bar = $(barSel);
    return Speech.meter(l => { bar.style.width = Math.round(l * 100) + '%'; })
      .catch(() => null);
  }
  function stopMeter(holder) {
    const m = holder.meter;
    holder.meter = null;
    if (m) m.then(h => { h?.stop(); });
    $$('.level i').forEach(i => { i.style.width = '0'; });
  }

  function startListening() {
    if (!session || !requireMic()) return;
    const bad = Speech.browserProblem();
    if (bad) { toast(Speech.explainEmpty({}, null), 'error'); return; }
    Speech.stopSpeaking();
    const s = session;
    const hands = $('#handsFree').checked;
    $('#live').innerHTML = '<span class="interim">Listening… speak now</span>';
    s.recorder = new Speech.Recorder({
      silenceMs: hands ? Store.settings.silenceSec * 1000 : 0,
      lang: !isEnglish() && $('#answerEn').checked ? Store.settings.lang : '',
      onUpdate: (fin, interim) => { $('#live').innerHTML = `${esc(fin)} <span class="interim">${esc(interim)}</span>`; },
      onSilence: () => { if (session === s && micState === 'listening') stopAndSend(); },
      onError: msg => { toast(msg, 'error'); if (session === s) { s.recorder = null; stopMeter(s); setMic('idle'); $('#live').textContent = ''; } }
    });
    s.recorder.start();
    s.meter = startMeter('#micLevel i');
    setMic('listening');
  }

  async function stopAndSend() {
    const s = session;
    if (!s || !s.recorder) return;
    const rec = s.recorder;
    s.recorder = null;
    setMic('thinking');
    const meterP = s.meter;
    stopMeter(s);
    const r = await rec.stop();
    if (session !== s) return;
    $('#live').textContent = '';
    if (!r.text) {
      const m = meterP ? await meterP : null;
      toast(Speech.explainEmpty(r, m), 'error');
      setMic('idle');
      return;
    }
    Store.addMinutes(r.durationSec);
    await userTurn(r.text, r);
  }

  async function userTurn(text, metrics) {
    const s = session;
    const el = addUser(text);
    s.turns.push({ text, metrics });
    s.messages.push({ role: 'user', content: text });
    setMic('thinking');
    const typing = addTyping();
    try {
      const data = await AI.chatJSON({ system: chatSystem(s), messages: s.messages });
      if (session !== s) return;
      typing.remove();
      const reply = String(data.reply || '').trim() || 'Sorry, could you say that again?';
      s.messages.push({ role: 'assistant', content: JSON.stringify(data) });
      const conv = !isEnglish() && data.learner_in_target && data.learner_in_target.text ? data.learner_in_target : null;
      if (conv) {
        // The learner answered in English: show and say how it sounds in the practised language, then continue.
        $('.fb', el).innerHTML = `<div class="fb-item tip"><span class="tag">🔁 See it in ${esc(learnLang().name)} below</span></div>`;
        addConverted(conv);
        setMic('speaking');
        s.interrupted = false;
        await Speech.speak(conv.text);
        if (session !== s) return;
        if (!s.interrupted) await new Promise(r => setTimeout(r, 400));
      } else renderFeedback(el, data);
      const coach = !conv && Store.settings.speakCorrections ? coachSpeech(data) : '';
      if (coach) {
        // Teacher first: show and say the correction, then continue with the next question.
        addCoach(data);
        setMic('speaking');
        s.interrupted = false;
        await Speech.speak(coach);
        if (session !== s) return;
        if (!s.interrupted) await new Promise(r => setTimeout(r, 400));
      }
      addTutor(reply, Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : [], { en: data.reply_en, say: data.reply_say });
      await tutorSpeaks(reply, s); // tapping during the correction skips straight to the question
    } catch (e) {
      if (session !== s) return;
      typing.remove();
      el.remove();
      s.turns.pop();
      s.messages.pop();
      $('#textInput').value = text;
      setMic('idle');
      handleAIError(e);
    }
  }

  $('#micBtn').addEventListener('click', () => {
    if (micState === 'idle') startListening();
    else if (micState === 'listening') stopAndSend();
    else if (micState === 'speaking') { if (session) session.interrupted = true; Speech.stopSpeaking(); }
  });

  $('#textForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = $('#textInput').value.trim();
    if (!t || !session || micState === 'thinking') return;
    if (session.recorder) { session.recorder.abort(); session.recorder = null; stopMeter(session); $('#live').textContent = ''; }
    Speech.stopSpeaking();
    $('#textInput').value = '';
    userTurn(t, null);
  });

  $('#handsFree').addEventListener('change', e => {
    Store.setSettings({ handsFree: e.target.checked });
    if (e.target.checked && micState === 'idle') startListening();
  });
  $('#rateQuick').addEventListener('change', e => Store.setSettings({ rate: Number(e.target.value) }));
  $('#answerEn').addEventListener('change', e => Store.setSettings({ answerInEnglish: e.target.checked }));
  $('#sessBack').addEventListener('click', () => showView('talk'));
  $('#sessEnd').addEventListener('click', endSession);

  async function endSession() {
    const s = session;
    if (!s) return;
    if (s.turns.length < 2) { toast('Say at least two things first, so I have something to give feedback on.'); return; }
    s.recorder?.abort();
    s.recorder = null;
    stopMeter(s);
    Speech.stopSpeaking();
    setMic('idle');
    const metrics = Speech.combine(s.turns.map(t => t.metrics));
    const transcript = s.turns.map((t, i) => `${i + 1}. ${t.metrics ? '' : '(typed) '}${t.text}`).join('\n');
    busy(true, 'Analysing your speaking…');
    try {
      const rep = await AI.chatJSON({
        system: evalSystem('conversation'),
        messages: [{ role: 'user', content: `Scenario: ${s.title}\nLearner level setting: ${Store.settings.level}\n\nLearner's turns:\n${transcript}\n\n${metricsText(metrics)}` }],
        temperature: 0.3
      });
      if (session !== s) return;
      const report = buildReport('conversation', s.title, rep, metrics, s.turns.map(t => ({ q: null, a: t.text })));
      saveReport(report);
      session = null;
      showReport(report);
    } catch (e) {
      handleAIError(e);
    } finally {
      busy(false);
    }
  }

  // ---------- Evaluation prompts ----------
  function metricsText(m) {
    if (!m) return 'Measured speech metrics: none (the learner typed all answers, so judge fluency and pronunciation as "not assessed" and give them 0).';
    return `Measured speech metrics (from the microphone):
- Speaking rate: ${m.wpm} words per minute over ${m.durationSec}s (natural conversation is roughly 110–160 wpm)
- Filler words: ${m.fillers.total}${m.fillers.total ? ' (' + Object.entries(m.fillers.found).map(([k, v]) => `${k}×${v}`).join(', ') + ')' : ''}
- Long pauses (>2.5s): ${m.longPauses}
- Speech-recognition clarity: ${m.clarity == null ? 'unknown' : m.clarity + '%'} (a rough proxy for how clearly the learner pronounces words)`;
  }

  function evalSystem(kind) {
    const nl = Store.settings.nativeLang ? ` Write "summary" in English, then repeat it in ${Store.settings.nativeLang}.` : '';
    const L = kind === 'ielts' ? 'English' : learnLang().name;
    const lang = L === 'English' ? '' : ` The learner is practising ${L} with English as their base language: "better" and "example" must be in ${L}; write all explanations, "summary", "strengths" and "improvements" in English. Turns in English are a beginner asking how to say something: never list them as mistakes, but encourage answering more in ${L} next time.`;
    const common = `Answers are speech-to-text transcripts: ignore punctuation and capitalisation. You cannot hear the audio, so estimate pronunciation from the clarity metric and from words that look mis-recognised (a sign of mispronunciation); be conservative. Be honest and specific, and quote the learner's real words.${lang}${nl}
"mistakes": up to 6 real mistakes, each {"said": exact learner words, "better": corrected version, "why": short reason}.
"vocabulary": up to 4 upgrades, each {"basic": a simple word/phrase they used, "better": a more precise or advanced alternative, "example": a sentence using it}.
"strengths" and "improvements": 2–4 short, concrete bullet points each.`;

    if (kind === 'ielts') {
      return `You are a strict, experienced IELTS Speaking examiner. Score using the official public IELTS Speaking band descriptors for the four criteria: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation. Bands go from 0 to 9 in 0.5 steps; the overall band is the average of the four, rounded to the nearest 0.5. Very short, off-topic or missing answers must lower the scores.
${common}
"parts": one short comment for each part that was taken.
"model_answer": pick the learner's weakest answer and write a band-8 model answer for that question (natural spoken style, 60–120 words).
Return ONLY valid JSON:
{"overall_band": 6.5, "bands": {"fluency": 6.5, "lexical": 6, "grammar": 6.5, "pronunciation": 6}, "cefr": "B2", "summary": "...", "strengths": [], "improvements": [], "parts": [{"part": "Part 1", "comment": "..."}], "mistakes": [], "vocabulary": [], "model_answer": {"question": "...", "answer": "..."}}`;
    }
    const who = kind === 'level'
      ? 'You are an expert Cambridge-trained English speaking assessor running a placement test. Map the learner to a CEFR level (A1, A2, B1, B2, C1, C2) based on the full set of answers.'
      : `You are an expert ${L} speaking coach reviewing a practice conversation in ${L}.`;
    return `${who} Score each skill from 0 to 100 (50 ≈ B1, 65 ≈ B2, 80 ≈ C1, 90+ ≈ C2).
${common}
Return ONLY valid JSON:
{"overall": 0-100, "cefr": "B1", "scores": {"fluency": 0-100, "grammar": 0-100, "vocabulary": 0-100, "pronunciation": 0-100}, "summary": "2–3 sentences", "strengths": [], "improvements": [], "mistakes": [], "vocabulary": []}`;
  }

  // ---------- Reports ----------
  function buildReport(kind, title, r, metrics, qa) {
    const arr = x => Array.isArray(x) ? x : [];
    const report = {
      id: Date.now(), kind, title, date: new Date().toISOString(),
      cefr: typeof r.cefr === 'string' ? r.cefr.toUpperCase().slice(0, 2) : null,
      summary: r.summary || '',
      strengths: arr(r.strengths), improvements: arr(r.improvements),
      mistakes: arr(r.mistakes).filter(m => m && m.said), vocabulary: arr(r.vocabulary).filter(v => v && v.better),
      parts: arr(r.parts), modelAnswer: r.model_answer && r.model_answer.answer ? r.model_answer : null,
      metrics, qa
    };
    if (kind === 'ielts') {
      const band = x => Math.round(clamp(x, 0, 9) * 2) / 2;
      const b = r.bands || {};
      report.subs = [['Fluency & Coherence', band(b.fluency)], ['Lexical Resource', band(b.lexical)], ['Grammar Range & Accuracy', band(b.grammar)], ['Pronunciation', band(b.pronunciation)]];
      const overall = r.overall_band != null ? band(r.overall_band) : band(report.subs.reduce((a, x) => a + x[1], 0) / 4);
      report.headline = { value: overall.toFixed(1), max: 9, label: 'Overall band' };
      report.subMax = 9;
      report.score100 = Math.round(overall / 9 * 100);
    } else {
      const sc = r.scores || {};
      report.subs = [['Fluency', sc.fluency], ['Grammar', sc.grammar], ['Vocabulary', sc.vocabulary], ['Pronunciation', sc.pronunciation]].map(([l, v]) => [l, Math.round(clamp(v, 0, 100))]);
      const overall = Math.round(clamp(r.overall ?? report.subs.reduce((a, x) => a + x[1], 0) / 4, 0, 100));
      report.headline = { value: String(overall), max: 100, label: kind === 'level' ? 'Speaking score' : 'Session score' };
      report.subMax = 100;
      report.score100 = overall;
    }
    return report;
  }

  function saveReport(report) {
    Store.addHistory({ id: report.id, date: report.date, kind: report.kind, title: report.title, score100: report.score100, headline: report.headline, cefr: report.cefr, report });
  }

  function ring(value, max, label) {
    const pct = clamp(Number(value) / max, 0, 1);
    const C = 2 * Math.PI * 52;
    return `<div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
      <div class="ring-text"><strong>${esc(value)}</strong><small>${esc(label)}</small></div></div>`;
  }

  function showReport(r) {
    const m = r.metrics;
    const kindLabel = { conversation: 'Conversation feedback', ielts: 'IELTS Speaking mock test', level: 'Speaking level test' }[r.kind];
    const again = { conversation: 'talk', ielts: 'ielts', level: 'level' }[r.kind];
    $('#reportBody').innerHTML = `
      <div class="report-head card">
        ${ring(r.headline.value, r.headline.max, r.headline.label)}
        <div class="report-title">
          <p class="eyebrow">${esc(kindLabel)} · ${new Date(r.date).toLocaleDateString()}</p>
          <h1>${esc(r.title)}</h1>
          ${r.cefr ? `<span class="cefr">CEFR ${esc(r.cefr)}</span>` : ''}
          <p>${esc(r.summary)}</p>
        </div>
      </div>
      <div class="grid two">
        <div class="card"><h3>Skill breakdown</h3>
          ${r.subs.map(([l, v]) => `<div class="bar-row"><span>${esc(l)}</span><div class="bar"><i style="width:${clamp(v / r.subMax * 100, 0, 100)}%"></i></div><b>${r.subMax === 9 ? Number(v).toFixed(1) : v}</b></div>`).join('')}
        </div>
        <div class="card"><h3>Measured from your voice</h3>
          ${m ? `<div class="metrics">
            <div><strong>${m.wpm}</strong><small>words / min</small></div>
            <div><strong>${m.fillers.total}</strong><small>filler words</small></div>
            <div><strong>${m.longPauses}</strong><small>long pauses</small></div>
            <div><strong>${m.clarity == null ? '–' : m.clarity + '%'}</strong><small>clarity</small></div>
          </div>
          <p class="muted small">Aim for 110–160 words/min with few fillers (${Object.keys(m.fillers.found).join(', ') || 'none detected'}). Clarity is how confidently the speech engine understood you.</p>`
          : '<p class="muted">You typed your answers, so speed and clarity were not measured. Try speaking next time!</p>'}
        </div>
      </div>
      <div class="grid two">
        <div class="card"><h3>✅ What went well</h3><ul class="list">${r.strengths.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
        <div class="card"><h3>🎯 Focus on next</h3><ul class="list">${r.improvements.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
      </div>
      ${r.parts.length ? `<div class="card"><h3>Feedback by part</h3>${r.parts.map(p => `<p><b>${esc(p.part)}:</b> ${esc(p.comment)}</p>`).join('')}</div>` : ''}
      ${r.mistakes.length ? `<div class="card"><h3>✏️ Corrections</h3><div class="corrections">${r.mistakes.map(x => `
        <div class="correction"><div><s>${esc(x.said)}</s></div><div><b>${esc(x.better)}</b> ${speakBtn(x.better || '')}</div><small>${esc(x.why)}</small></div>`).join('')}</div></div>` : ''}
      ${r.vocabulary.length ? `<div class="card"><h3>📚 Vocabulary upgrades</h3><div class="vocab">${r.vocabulary.map(v => `
        <div class="vocab-item"><div><span class="muted">${esc(v.basic)}</span> → <b>${esc(v.better)}</b> ${speakBtn(v.better)}</div><small>“${esc(v.example)}”</small></div>`).join('')}</div></div>` : ''}
      ${r.modelAnswer ? `<div class="card"><h3>🏆 Model answer</h3><p class="muted">${esc(r.modelAnswer.question)}</p><p>${esc(r.modelAnswer.answer)} ${speakBtn(r.modelAnswer.answer)}</p></div>` : ''}
      <details class="card transcript"><summary><h3>Your transcript</h3></summary>
        ${r.qa.map(x => `${x.q ? `<p class="muted small">${esc(x.q)}</p>` : ''}<p>${esc(x.a || '(no answer)')}</p>`).join('')}
      </details>
      <div class="row center"><button class="btn primary" data-go="${again}">Practise again</button><button class="btn" data-go="progress">See my progress</button></div>`;
    showView('report', again);
  }

  // ---------- Timed tests (IELTS + level test) ----------
  let run = null;
  let camStream = null;

  function buildIelts(mode) {
    const items = [];
    const topics = shuffle(D.ielts.part1).slice(0, 2);
    const card = pick(D.ielts.part2);
    const full = mode === 'full';
    if (full || mode === 'p1') {
      topics.forEach((t, ti) => shuffle(t.questions).slice(0, 3).forEach((q, qi) => {
        let say = q;
        if (qi === 0) say = `Let's talk about ${t.topic}. ${q}`;
        if (ti === 0 && qi === 0) say = `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}. I'll be your examiner today. In this first part, I'd like to ask you some questions about yourself. ${say}`;
        items.push({ part: 'Part 1 · Introduction & interview', q, say, prep: 0, speak: 40 });
      }));
    }
    if (full || mode === 'p2') {
      items.push({
        part: 'Part 2 · Long turn', q: card.card, cue: card.points,
        say: `${full ? 'Now, ' : ''}I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. Here is your topic. ${card.card}`,
        prep: 60, speak: 120, prepSay: 'Alright. Remember, you have one to two minutes for this. Please start speaking now.'
      });
    }
    if (full || mode === 'p3') {
      card.part3.forEach((q, i) => items.push({
        part: 'Part 3 · Discussion', q,
        say: i === 0 ? `${full ? `We've been talking about ${card.topic}. ` : ''}I'd like to discuss with you some more general questions related to ${card.topic}. ${q}` : q,
        prep: 0, speak: 60
      }));
    }
    return items;
  }

  function startIelts(mode) {
    if (!mode || !requireEnglish('IELTS mock test') || !requireAI() || !requireMic()) return;
    const names = { full: 'IELTS Speaking · Full mock test', p1: 'IELTS Speaking · Part 1', p2: 'IELTS Speaking · Part 2', p3: 'IELTS Speaking · Part 3' };
    runTest('ielts', names[mode], buildIelts(mode), 'ielts');
  }

  $('#levelStart').addEventListener('click', () => {
    if (!requireEnglish('level test') || !requireAI() || !requireMic()) return;
    runTest('level', 'English Speaking Level Test', D.levelTest.map(x => ({ ...x, say: x.q, prepSay: 'Please start speaking now.' })), 'level');
  });

  function countdown(r, sec, label) {
    return new Promise(resolve => {
      const start = Date.now();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(iv);
        r.advance = null;
        resolve();
      };
      const tick = () => {
        const left = Math.max(0, sec - (Date.now() - start) / 1000);
        $('#timerFill').style.width = (100 * left / sec) + '%';
        $('#timerText').textContent = fmtTime(left);
        $('#timer').classList.toggle('low', left < 10);
        if (left <= 0) finish();
      };
      $('#timerLabel').textContent = label;
      r.advance = finish;
      const iv = setInterval(tick, 250);
      tick();
    });
  }

  function testPhase(phase) {
    run.phase = phase;
    const btn = $('#testNext');
    const txt = { examiner: 'Skip ▸', prep: 'I\'m ready — start speaking', speak: 'Finish answer →' };
    btn.textContent = txt[phase];
    $('#examiner').classList.toggle('talking', phase === 'examiner');
    $('#examinerState').textContent = phase === 'examiner' ? 'Speaking…' : phase === 'prep' ? 'Waiting while you prepare' : 'Listening to you';
    $('#timer').classList.toggle('hidden', phase === 'examiner');
    $('#recDot').classList.toggle('hidden', phase !== 'speak');
  }

  async function runTest(kind, title, items, navId) {
    const r = run = { kind, title, items, answers: [], aborted: false, advance: null, recorder: null };
    $('#testTitle').textContent = title;
    showView('test', navId);
    for (let i = 0; i < items.length; i++) {
      if (r.aborted) return;
      const it = items[i];
      $('#testProgressLabel').textContent = `Question ${i + 1} of ${items.length}`;
      $('#testProgressBar').style.width = (100 * i / items.length) + '%';
      $('#testPart').textContent = it.part;
      $('#testQuestion').textContent = it.q;
      $('#testCue').innerHTML = it.cue ? `<li class="muted">You should say:</li>${it.cue.map(p => `<li>${esc(p)}</li>`).join('')}` : '';
      $('#testLive').innerHTML = '';

      testPhase('examiner');
      await Speech.speak(it.say);
      if (r.aborted) return;

      if (it.prep) {
        testPhase('prep');
        $('#testLive').innerHTML = '<span class="interim">Think about what you will say. You can make notes on paper.</span>';
        await countdown(r, it.prep, 'Preparation time');
        if (r.aborted) return;
        testPhase('examiner');
        await Speech.speak(it.prepSay || 'Please start speaking now.');
        if (r.aborted) return;
      }

      testPhase('speak');
      $('#testLive').innerHTML = '<span class="interim">Listening… start speaking.</span>';
      r.recorder = new Speech.Recorder({
        onUpdate: (fin, interim) => { $('#testLive').innerHTML = `${esc(fin)} <span class="interim">${esc(interim)}</span>`; },
        onError: msg => { toast(msg, 'error'); abortRun(); showView('home'); }
      });
      r.recorder.start();
      await countdown(r, it.speak, 'Speaking time');
      const rec = r.recorder;
      r.recorder = null;
      if (r.aborted) return;
      const res = await rec.stop();
      Store.addMinutes(res.durationSec);
      r.answers.push({ part: it.part, q: it.q, a: res.text, metrics: res });
    }
    if (r.aborted) return;
    $('#testProgressBar').style.width = '100%';
    stopCamera();
    await Speech.speak(kind === 'ielts' ? 'Thank you. That is the end of the speaking test.' : 'Thank you. That is the end of the test.');
    if (r.aborted) return;
    evaluateTest(r);
  }

  async function evaluateTest(r) {
    const metrics = Speech.combine(r.answers.map(a => a.metrics));
    const transcript = r.answers.map((a, i) => `[${a.part}] Q${i + 1}: ${a.q}\nAnswer (${a.metrics.durationSec}s, ${a.metrics.words} words): ${a.a || '(no answer)'}`).join('\n\n');
    busy(true, r.kind === 'ielts' ? 'The examiner is scoring your test…' : 'Assessing your level…');
    try {
      const rep = await AI.chatJSON({
        system: evalSystem(r.kind),
        messages: [{ role: 'user', content: `${r.title}\n\n${transcript}\n\n${metricsText(metrics)}` }],
        temperature: 0.3
      });
      const report = buildReport(r.kind, r.title, rep, metrics, r.answers.map(a => ({ q: `${a.part} — ${a.q}`, a: a.a })));
      saveReport(report);
      run = null;
      showReport(report);
    } catch (e) {
      handleAIError(e);
      // Keep answers so the user can retry scoring.
      $('#testLive').innerHTML = '<button class="btn primary" id="retryScore">Retry scoring</button>';
      $('#retryScore').onclick = () => evaluateTest(r);
    } finally {
      busy(false);
    }
  }

  function abortRun() {
    if (!run) return;
    run.aborted = true;
    Speech.stopSpeaking();
    run.recorder?.abort();
    run.advance?.();
    run = null;
    stopCamera();
  }

  $('#testNext').addEventListener('click', () => {
    if (!run) return;
    if (run.phase === 'examiner') Speech.stopSpeaking();
    else run.advance?.();
  });

  $('#testExit').addEventListener('click', () => {
    if (!run || confirm('Leave the test? Your answers will not be scored.')) {
      const back = run?.kind === 'level' ? 'level' : 'ielts';
      abortRun();
      showView(back);
    }
  });

  async function startCamera() {
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      $('#camVideo').srcObject = camStream;
      $('#camBox').classList.add('on');
      $('#camBtn').textContent = '📷 Camera off';
    } catch (e) {
      toast('Could not open the camera. You can take the test without it.', 'error');
    }
  }
  function stopCamera() {
    camStream?.getTracks().forEach(t => t.stop());
    camStream = null;
    $('#camVideo').srcObject = null;
    $('#camBox').classList.remove('on');
    $('#camBtn').textContent = '📷 Camera on';
  }
  $('#camBtn').addEventListener('click', () => camStream ? stopCamera() : startCamera());

  // ---------- Pronunciation practice (works offline, no AI key) ----------
  const pron = { set: 0, idx: 0, custom: null, recorder: null, result: null };
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  // Unicode-aware so accented and Devanagari words compare too. Hindi/Marathi: treat ँ as ं and ignore the nukta, which recognisers use inconsistently.
  const normWord = w => {
    const x = w.normalize('NFC').toLowerCase().replace(/[’‘]/g, "'").replace(/ँ/g, 'ं').replace(/़/g, '').replace(/[^\p{L}\p{M}\p{N}']/gu, '');
    return isEnglish() && /^\d+$/.test(x) && NUM[+x] ? NUM[+x] : x;
  };
  const words = s => s.split(/\s+/).filter(w => normWord(w));
  const bareWord = w => w.replace(/[^\p{L}\p{M}\p{N}'’-]/gu, '');
  const pronSets = () => (isEnglish() ? null : D.pronunciationByLang[learnLang().code]) || D.pronunciation;

  // Longest-common-subsequence alignment: which target words were recognised in order.
  function alignWords(target, spoken) {
    const a = target.map(normWord), b = spoken.map(normWord);
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ok = new Array(a.length).fill(false);
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { ok[i] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return ok;
  }

  // A drill item is { t: text to say, en: English meaning, say: sound guide }. English drills are plain strings.
  function pronItem() {
    if (pron.custom) return pron.custom;
    const x = pronSets()[pron.set].sentences[pron.idx];
    return typeof x === 'string' ? { t: x } : { t: x[0], en: x[1], say: x[2] };
  }
  const pronSentence = () => pronItem().t;

  function renderPron() {
    const set = pronSets()[pron.set];
    const L = learnLang().name;
    $('#pronTabs').innerHTML = pronSets().map((p, i) => `<button class="tab ${i === pron.set && !pron.custom ? 'active' : ''}" data-set="${i}">${esc(p.title)}</button>`).join('');
    $('#pronTip').textContent = pron.custom ? 'Your own sentence. Listen first, then record.' : '💡 ' + set.tip;
    $('#pronCustom').placeholder = isEnglish()
      ? 'Practise your own sentence, e.g. a line from your presentation'
      : `Type anything in English and I'll turn it into ${L}, e.g. "Where is the bus stop?"`;
    $('#pronCustomBtn').textContent = isEnglish() ? 'Practise it' : `Convert to ${L}`;
    const item = pronItem();
    const ws = words(item.t);
    const ok = pron.result?.ok;
    $('#pronSentence').innerHTML = ws.map((w, i) => `<button class="word ${ok ? (ok[i] ? 'good' : 'bad') : ''}" data-say="${esc(bareWord(w))}" data-slow="1" title="Hear this word">${esc(w)}</button>`).join(' ');
    $('#pronHelp').innerHTML = (item.en ? `<p><span class="muted">English:</span> <b>${esc(item.en)}</b></p>` : '') +
      (item.say ? `<p><span class="muted">Say it like:</span> <i>${esc(item.say)}</i></p>` : '');
    $('#pronCount').textContent = pron.custom ? 'Custom' : `${pron.idx + 1} / ${set.sentences.length}`;
    const res = pron.result;
    $('#pronResult').innerHTML = res ? `
      <div class="pron-score ${res.score >= 85 ? 'good' : res.score >= 60 ? 'mid' : 'bad'}">${ring(res.score, 100, 'accuracy')}
        <div><strong>${res.score >= 90 ? 'Excellent! 🎉' : res.score >= 75 ? 'Very good!' : res.score >= 50 ? 'Good try — keep going' : 'Let\'s try that again'}</strong>
        <p class="muted small">I heard: “${esc(res.heard || '…')}”</p>
        ${res.missed.length ? `<p class="small">Practise: ${res.missed.map(w => `<button class="chip" data-say="${esc(w)}" data-slow="1">${esc(w)} 🔊</button>`).join(' ')}</p>` : ''}
        ${res.clarity != null ? `<p class="muted small">Clarity: ${res.clarity}%</p>` : ''}</div></div>` : '';
  }

  $('#pronTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-set]');
    if (!b) return;
    stopPronRecording();
    Object.assign(pron, { set: +b.dataset.set, idx: 0, custom: null, result: null });
    renderPron();
  });
  $('#pronPrev').addEventListener('click', () => { stopPronRecording(); pron.custom = null; const n = pronSets()[pron.set].sentences.length; pron.idx = (pron.idx + n - 1) % n; pron.result = null; renderPron(); });
  $('#pronNext').addEventListener('click', () => { stopPronRecording(); pron.custom = null; pron.idx = (pron.idx + 1) % pronSets()[pron.set].sentences.length; pron.result = null; renderPron(); });
  $('#pronListen').addEventListener('click', () => Speech.speak(pronSentence()));
  $('#pronSlow').addEventListener('click', () => Speech.speak(pronSentence(), { rate: 0.65 }));
  $('#pronCustomForm').addEventListener('submit', async e => {
    e.preventDefault();
    const t = $('#pronCustom').value.trim();
    if (!t) return;
    stopPronRecording();
    let item = { t };
    if (!isEnglish()) {
      // English is the base language: convert what the learner typed into the language they're practising.
      if (!requireAI()) return;
      busy(true, `Converting to ${learnLang().name}…`);
      try { item = await toTarget(t); } catch (err) { handleAIError(err); return; } finally { busy(false); }
    }
    pron.custom = item;
    pron.result = null;
    renderPron();
    Speech.speak(item.t);
  });

  $('#pronRec').addEventListener('click', async () => {
    if (pron.recorder) return finishPron();
    if (!requireMic()) return;
    Speech.stopSpeaking();
    pron.result = null;
    renderPron();
    pron.recorder = new Speech.Recorder({
      silenceMs: 1800,
      onUpdate: (fin, interim) => { $('#pronLive').textContent = (fin + ' ' + interim).trim(); },
      onSilence: () => finishPron(),
      onError: msg => { toast(msg, 'error'); stopPronRecording(); }
    });
    pron.recorder.start();
    $('#pronRec').classList.add('rec');
    $('#pronRec').textContent = '■ Stop';
    $('#pronLive').textContent = 'Listening… read the sentence aloud.';
  });

  async function finishPron() {
    const rec = pron.recorder;
    if (!rec) return;
    pron.recorder = null;
    $('#pronRec').classList.remove('rec');
    $('#pronRec').textContent = '🎙️ Record';
    const r = await rec.stop();
    $('#pronLive').textContent = '';
    if (!r.text) { toast(Speech.explainEmpty(r, null), 'error'); return; }
    const target = words(pronSentence());
    const ok = alignWords(target, words(r.text));
    const score = Math.round(100 * ok.filter(Boolean).length / target.length);
    pron.result = { ok, score, heard: r.text, clarity: r.clarity, missed: target.filter((w, i) => !ok[i]).map(bareWord) };
    Store.addPron(score);
    renderPron();
  }

  function stopPronRecording() {
    if (!pron.recorder) return;
    pron.recorder.abort();
    pron.recorder = null;
    $('#pronRec').classList.remove('rec');
    $('#pronRec').textContent = '🎙️ Record';
    $('#pronLive').textContent = '';
  }

  // ---------- Progress ----------
  function renderProgress() {
    const s = Store.stats();
    const h = Store.history;
    $('#progressStats').innerHTML = [
      ['🔥', s.streak, 'day streak'], ['⏱️', s.minutes, 'minutes spoken'], ['🗂️', s.sessions, 'sessions'],
      ['⭐', s.avg ?? '–', 'avg score'], ['🗣️', s.pronAvg == null ? '–' : s.pronAvg + '%', `pronunciation (${s.pronAttempts} tries)`]
    ].map(([i, v, l]) => `<div class="stat card"><span>${i}</span><strong>${v}</strong><small>${esc(l)}</small></div>`).join('');

    const pts = h.filter(x => typeof x.score100 === 'number').slice(-20);
    if (pts.length >= 2) {
      const W = 600, H = 180, P = 24;
      const x = i => P + i * (W - 2 * P) / (pts.length - 1);
      const y = v => H - P - v / 100 * (H - 2 * P);
      const line = pts.map((p, i) => `${x(i)},${y(p.score100)}`).join(' ');
      $('#progressChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Score trend">
        ${[25, 50, 75, 100].map(v => `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="0" y="${y(v) + 4}" class="axis">${v}</text>`).join('')}
        <polyline points="${P},${H - P} ${line} ${W - P},${H - P}" class="area"/>
        <polyline points="${line}" class="line"/>
        ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.score100)}" r="4" class="dot"><title>${esc(p.title)}: ${p.headline.value}</title></circle>`).join('')}
      </svg>`;
    } else {
      $('#progressChart').innerHTML = '<p class="muted">Complete two scored sessions to see your progress chart.</p>';
    }

    $('#historyList').innerHTML = h.length ? h.slice().reverse().map(x => `
      <button class="history-item" data-report="${x.id}">
        <span class="hi-icon">${x.kind === 'ielts' ? '🎓' : x.kind === 'level' ? '📊' : '💬'}</span>
        <span class="hi-main"><strong>${esc(x.title)}</strong><small>${new Date(x.date).toLocaleString()}</small></span>
        ${x.cefr ? `<span class="cefr small">${esc(x.cefr)}</span>` : ''}
        <span class="hi-score">${esc(x.headline.value)}<small>/${x.headline.max}</small></span>
      </button>`).join('') : '<p class="muted">No sessions yet. Start a conversation or a mock test!</p>';
  }
  $('#historyList').addEventListener('click', e => {
    const b = e.target.closest('[data-report]');
    if (!b) return;
    const item = Store.history.find(x => String(x.id) === b.dataset.report);
    if (item?.report) showReport(item.report);
  });
  $('#clearProgress').addEventListener('click', () => {
    if (confirm('Delete all your history and progress? Settings and your API key are kept.')) { Store.clearProgress(); renderProgress(); toast('Progress cleared.'); }
  });

  // ---------- Settings ----------
  function renderSettings() {
    const s = Store.settings;
    const { id, p } = AI.current();
    $('#setProvider').innerHTML = Object.entries(AI.PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === id ? 'selected' : ''}>${esc(v.label)}</option>`).join('');
    $('#setKey').value = s.keys[id] || '';
    $('#keyRow').classList.toggle('hidden', !p.needsKey);
    $('#setModel').value = s.models[id] || '';
    $('#setModel').placeholder = p.model;
    $('#providerHelp').innerHTML = `${esc(p.help)} <a href="${p.keyUrl}" target="_blank" rel="noopener">${p.needsKey ? 'Get a free key ↗' : 'Download Ollama ↗'}</a>`;
    $('#setName').value = s.name;
    $('#setLevel').value = s.level;
    $('#setNative').value = s.nativeLang;
    $('#setSpeakCorr').checked = s.speakCorrections;
    $('#setLang').value = s.lang;
    $('#setLang').disabled = !isEnglish(); // accents are for English; other languages use their own speech code
    $('#setLang').title = isEnglish() ? '' : `Accent applies to English. You're practising ${learnLang().name}.`;
    $('#setRate').value = s.rate;
    $('#rateVal').textContent = s.rate + '×';
    $('#setSilence').value = s.silenceSec;
    $('#silenceVal').textContent = s.silenceSec + 's';
    renderVoices();
  }

  function renderVoices() {
    const s = Store.settings;
    const lang = Store.speechLang();
    const list = Speech.voices().filter(v => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    const auto = list.length ? `Automatic (best ${lang} voice)` : `No ${learnLang().name} voice installed: using a fallback`;
    $('#setVoice').innerHTML = `<option value="">${esc(auto)}</option>` +
      list.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  }
  Speech.onVoices(() => { if (currentView === 'settings') renderVoices(); });

  $('#setProvider').addEventListener('change', e => { Store.setSettings({ provider: e.target.value }); renderSettings(); });
  $('#setKey').addEventListener('input', e => { const { id } = AI.current(); Store.setSettings({ keys: { ...Store.settings.keys, [id]: e.target.value.trim() } }); });
  $('#setModel').addEventListener('input', e => { const { id } = AI.current(); Store.setSettings({ models: { ...Store.settings.models, [id]: e.target.value.trim() } }); });
  $('#toggleKey').addEventListener('click', () => { const k = $('#setKey'); k.type = k.type === 'password' ? 'text' : 'password'; });
  $('#setName').addEventListener('input', e => Store.setSettings({ name: e.target.value.trim() }));
  $('#setLevel').addEventListener('change', e => Store.setSettings({ level: e.target.value }));
  $('#setSpeakCorr').addEventListener('change', e => Store.setSettings({ speakCorrections: e.target.checked }));
  $('#setNative').addEventListener('input', e => Store.setSettings({ nativeLang: e.target.value.trim() }));
  $('#setLang').addEventListener('change', e => { Store.setSettings({ lang: e.target.value, voiceURI: '' }); renderVoices(); });
  $('#setVoice').addEventListener('change', e => Store.setSettings({ voiceURI: e.target.value }));
  $('#setRate').addEventListener('input', e => { Store.setSettings({ rate: Number(e.target.value) }); $('#rateVal').textContent = e.target.value + '×'; });
  $('#setSilence').addEventListener('input', e => { Store.setSettings({ silenceSec: Number(e.target.value) }); $('#silenceVal').textContent = e.target.value + 's'; });
  $('#voiceTest').addEventListener('click', () => Speech.speak(isEnglish()
    ? `Hi${Store.settings.name ? ' ' + Store.settings.name : ''}! This is how I will sound when we practise English together.`
    : learnLang().sample));

  $('#findModels').addEventListener('click', async () => {
    const out = $('#findModelsResult');
    out.className = 'muted';
    out.textContent = 'Looking up models…';
    try {
      const list = await AI.availableModels();
      if (!list.length) { out.textContent = 'No suitable models found for this key.'; return; }
      $('#modelList').innerHTML = list.map(m => `<option value="${esc(m)}"></option>`).join('');
      const { id } = AI.current();
      $('#setModel').value = list[0];
      Store.setSettings({ models: { ...Store.settings.models, [id]: list[0] } });
      out.className = 'ok';
      out.textContent = `✓ Found ${list.length} models. Picked the best one: ${list[0]}. Click the Model box to choose another, then Test connection.`;
    } catch (e) {
      out.className = 'err';
      out.textContent = '✗ ' + (e.message === 'NO_KEY' ? 'Paste your API key first.' : 'Could not load the model list: ' + e.message);
    }
  });

  $('#testAI').addEventListener('click', async () => {
    const out = $('#testAIResult');
    out.className = 'muted small';
    out.textContent = 'Testing…';
    try {
      const r = await AI.chatJSON({ system: 'Reply with JSON only: {"ok": true, "message": "<a one-sentence cheerful greeting to an English learner>"}', messages: [{ role: 'user', content: 'Hello' }], temperature: 0.5 });
      out.className = 'ok small';
      out.textContent = '✓ Connected! ' + (r.message || '');
    } catch (e) {
      out.className = 'err small';
      out.textContent = '✗ ' + (e.message === 'NO_KEY' ? 'Paste your API key first.' : e.message);
    }
  });

  // Microphone check: shows the device, a live volume bar, and what the speech engine understood.
  const micTest = { running: false };
  $('#micTestBtn').addEventListener('click', async () => {
    if (micTest.running) return;
    const out = $('#micTestResult');
    const bad = Speech.browserProblem();
    if (bad) { out.className = 'err small'; out.textContent = '✗ ' + Speech.explainEmpty({}, null); return; }
    micTest.running = true;
    Speech.stopSpeaking();
    out.className = 'muted small';
    out.textContent = 'Say: "Hello, I am testing my microphone." (6 seconds)';
    let m = null;
    try { m = await Speech.meter(l => { $('#micTestLevel i').style.width = Math.round(l * 100) + '%'; }); }
    catch (e) {
      micTest.running = false;
      out.className = 'err small';
      out.textContent = '✗ Could not open the microphone: ' + (e.name === 'NotAllowedError' ? 'permission was blocked. Click the 🔒 icon in the address bar and allow the microphone.' : e.name === 'NotFoundError' ? 'no microphone found.' : e.message);
      return;
    }
    $('#micTestDevice').textContent = '🎙️ Using: ' + m.device;
    const rec = new Speech.Recorder({ onUpdate: (fin, interim) => { out.textContent = '…' + (fin + ' ' + interim).trim(); } });
    rec.start();
    await new Promise(r => setTimeout(r, 6000));
    const r = await rec.stop();
    m.stop();
    $('#micTestLevel i').style.width = '0';
    micTest.running = false;
    if (r.text) { out.className = 'ok small'; out.textContent = `✓ Your microphone works! I heard: "${r.text}"`; }
    else { out.className = 'err small'; out.textContent = '✗ ' + Speech.explainEmpty(r, m); }
  });

  // ---------- Boot ----------
  AI.onStatus = msg => toast(msg);
  renderScenarios();
  $('#rateQuick').value = String(Store.settings.rate);
  setMic('idle');
  showView('home');
})();
