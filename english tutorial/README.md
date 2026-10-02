# SpeakUp: free AI English speaking tutor

A free AI speaking coach that runs entirely in the browser: conversations with instant corrections, pronunciation practice, a job interview simulator, IELTS speaking mock tests and a CEFR level test. There is no server, database or build step. It's plain HTML, CSS and JavaScript.

## Run it
- **Online:** publish it with GitHub Pages (see below) and open the link in **Chrome or Edge**.
- **Locally:** put the folder in any web server (e.g. WAMP's `www` folder) and open `http://localhost/<folder>/`.
  Opening `index.html` directly as a file won't give microphone access.

## One-time setup (free)
1. Go to https://aistudio.google.com/apikey, sign in with Google and click **Create API key**.
2. In the app, open **Settings** and paste the key, then click **Test connection**.

Free alternatives: Groq (console.groq.com), OpenRouter (`:free` models; use **Find models** in Settings), or Ollama, which runs fully offline on your PC.

## Publish on GitHub Pages
1. Create a new repository on GitHub and upload these files, with `index.html` at the top level.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)` and click **Save**.
3. After about a minute the app is live at `https://<your-username>.github.io/<repo-name>/`.

## Features
- **AI Conversation:** 12 scenarios (free talk, café, travel, doctor, business meeting, custom role-play…). You get voice replies and a teacher mode that explains your mistakes out loud before the next question. There are also answer ideas, adjustable speed and a hands-free mode.
- **Job Interview Simulator:** questions and follow-ups for any role.
- **IELTS Speaking Mock:** timed Parts 1, 2 and 3 with an examiner voice and an optional webcam (nothing is recorded). You get band scores for the 4 official criteria and a model answer.
- **Level Test:** 5 questions give your CEFR level (A1–C2).
- **Pronunciation Coach:** read sentences aloud and see which words were understood. Works without an AI key.
- **Multiple languages:** you can also practise Spanish, French, Hindi or Marathi.
- **Progress:** streak, minutes spoken, score chart, and saved reports.

## Privacy & keys
- Each user enters **their own** free API key. It's stored only in their browser's localStorage and sent only to the AI provider they choose.
- **Never put an API key in the code.** Anyone can read files on a public site or repository.
- Settings, history and progress also stay in the user's browser.

## Notes
- Voice input uses the browser's built-in speech recognition. It needs Chrome or Edge, an internet connection, and `localhost` or HTTPS for microphone access. GitHub Pages uses HTTPS, so it works there.
- The pronunciation score is estimated from how well speech recognition understood you. It is not phoneme-level analysis.
- Ollama from the GitHub Pages site: start Ollama with `OLLAMA_ORIGINS=https://<your-username>.github.io` so the browser is allowed to reach it.
- After changing JS or CSS files, bump the `?v=` numbers in `index.html` so browsers load the new versions.
