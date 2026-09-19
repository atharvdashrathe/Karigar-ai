/**
 * ai-tools.js — AI Tools page: Speech Transcription + Text Translation
 */

const AIToolsPage = {
  _mediaRecorder: null,
  _audioChunks: [],
  _isRecording: false,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="section-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          AI Capabilities
        </div>
        <h1 class="page-title">AI Tools</h1>
        <p class="page-subtitle">Speech transcription in Indian languages + multilingual text translation</p>
      </div>
      <div class="page-body page-enter">
        <div class="ai-tools-grid">

          <!-- Speech Transcription -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-icon-wrap speech">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <div>
                <div class="tool-panel-title">Speech to Text</div>
                <div class="tool-panel-desc">Indic ASR — IndicConformer / Whisper</div>
              </div>
            </div>
            <div class="tool-panel-body">
              <!-- Language selector -->
              <div class="form-group">
                <label class="form-label">Input Language</label>
                <div class="lang-selector" id="asr-lang-chips">
                  ${this._langChips('asr-lang')}
                </div>
                <input type="hidden" id="asr-lang" value="hi" />
              </div>

              <!-- Record button -->
              <div style="text-align:center;margin:20px 0">
                <button class="record-btn" id="record-btn" aria-label="Start recording">
                  <svg id="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  </svg>
                </button>
                <div id="record-label" style="font-size:12px;color:var(--text-muted)">Click to start recording</div>
                <div id="record-timer" style="font-size:11px;color:var(--text-muted);margin-top:4px;min-height:16px"></div>
              </div>

              <!-- OR upload audio file -->
              <div style="text-align:center;margin-bottom:16px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">— or upload audio file —</div>
                <label class="btn btn-ghost btn-sm" style="cursor:pointer" for="asr-audio-file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Audio
                </label>
                <input type="file" id="asr-audio-file" accept="audio/*" style="display:none" aria-label="Upload audio file" />
                <span id="asr-file-name" style="font-size:11px;color:var(--text-muted);margin-left:8px"></span>
              </div>

              <button class="btn btn-secondary w-full" id="btn-transcribe" disabled>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
                </svg>
                Transcribe
              </button>

              <div class="transcript-box" id="transcript-out" style="margin-top:16px">
                <span class="transcript-placeholder">Transcription will appear here…</span>
              </div>

              <div id="asr-meta" style="margin-top:8px;font-size:11px;color:var(--text-muted);min-height:16px"></div>

              <button class="btn btn-ghost btn-sm w-full" id="btn-copy-transcript" style="margin-top:10px;display:none" aria-label="Copy transcript">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy Transcript
              </button>
            </div>
          </div>

          <!-- Translation -->
          <div class="tool-panel">
            <div class="tool-panel-header">
              <div class="tool-icon-wrap translate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                  <path d="M5 8l6 6"/>
                  <path d="M4 14l6-6 2-3"/>
                  <path d="M2 5h12"/>
                  <path d="M7 2h1"/>
                  <path d="M22 22l-5-10-5 10"/>
                  <path d="M14 18h6"/>
                </svg>
              </div>
              <div>
                <div class="tool-panel-title">Text Translation</div>
                <div class="tool-panel-desc">NLLB-200 multilingual model</div>
              </div>
            </div>
            <div class="tool-panel-body">
              <div class="form-row" style="margin-bottom:0">
                <div class="form-group">
                  <label class="form-label">Source Language</label>
                  <select class="form-select" id="trans-src">
                    ${this._langOptions('hi')}
                  </select>
                </div>
                <div style="display:flex;align-items:flex-end;padding-bottom:18px">
                  <button class="btn btn-ghost btn-icon" id="btn-swap-lang" title="Swap languages" aria-label="Swap languages">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
                      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                    </svg>
                  </button>
                </div>
                <div class="form-group">
                  <label class="form-label">Target Language</label>
                  <select class="form-select" id="trans-tgt">
                    ${this._langOptions('en')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Input Text</label>
                <textarea class="form-textarea" id="trans-input" rows="5"
                  placeholder="Type or paste text to translate…"
                  style="min-height:120px"></textarea>
                <div style="display:flex;justify-content:space-between;margin-top:4px">
                  <span class="form-hint" id="char-count">0 characters</span>
                  <button class="btn btn-ghost btn-sm" id="btn-paste-transcript" title="Paste from transcript" style="display:none">
                    ← Paste Transcript
                  </button>
                </div>
              </div>

              <button class="btn btn-primary w-full" id="btn-translate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                  <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
                  <path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
                </svg>
                Translate
              </button>

              <div class="transcript-box" id="trans-out" style="margin-top:16px">
                <span class="transcript-placeholder">Translation will appear here…</span>
              </div>

              <div id="trans-meta" style="margin-top:8px;font-size:11px;color:var(--text-muted);min-height:16px"></div>

              <button class="btn btn-ghost btn-sm w-full" id="btn-copy-trans" style="margin-top:10px;display:none" aria-label="Copy translation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy Translation
              </button>
            </div>
          </div>
        </div>

        <!-- Info cards -->
        <div style="margin-top:28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
          ${[
            { color:'var(--purple)', icon:'🎙️', title:'Indic ASR', desc:'Supports Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Punjabi via IndicConformer-600M. Falls back to Whisper when primary model unavailable.' },
            { color:'var(--blue)', icon:'🌐', title:'NLLB Translation', desc:'Meta\'s NLLB-200 model translates across 200+ languages with graceful degradation — returns original text if model unavailable.' },
            { color:'var(--green)', icon:'📝', title:'Product Listing', desc:'Use speech + translation together to describe products in your native language and publish listings in English automatically.' },
          ].map(s => `
            <div class="card">
              <div class="card-body" style="display:flex;gap:14px;align-items:flex-start">
                <div style="font-size:28px;flex-shrink:0">${s.icon}</div>
                <div>
                  <div style="font-weight:600;font-size:13px;color:${s.color};margin-bottom:4px">${s.title}</div>
                  <div style="font-size:12px;color:var(--text-muted);line-height:1.6">${s.desc}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this._wireASR();
    this._wireTranslation();
  },

  _langChips(inputId) {
    const langs = [
      { code: 'hi', label: 'Hindi' },
      { code: 'en', label: 'English' },
      { code: 'mr', label: 'Marathi' },
      { code: 'ta', label: 'Tamil' },
      { code: 'te', label: 'Telugu' },
      { code: 'kn', label: 'Kannada' },
      { code: 'gu', label: 'Gujarati' },
      { code: 'bn', label: 'Bengali' },
    ];
    return langs.map((l, i) =>
      `<span class="lang-chip ${i === 0 ? 'active' : ''}" data-lang="${l.code}" data-for="${inputId}">${l.label}</span>`
    ).join('');
  },

  _langOptions(selected) {
    const langs = [
      ['hi', 'Hindi'], ['en', 'English'], ['mr', 'Marathi'],
      ['ta', 'Tamil'], ['te', 'Telugu'], ['kn', 'Kannada'],
      ['gu', 'Gujarati'], ['bn', 'Bengali'], ['pa', 'Punjabi'],
    ];
    return langs.map(([code, label]) =>
      `<option value="${code}" ${code === selected ? 'selected' : ''}>${label}</option>`
    ).join('');
  },

  _wireASR() {
    const langInput  = document.getElementById('asr-lang');
    const fileInput  = document.getElementById('asr-audio-file');
    const transcribeBtn = document.getElementById('btn-transcribe');
    const copyBtn    = document.getElementById('btn-copy-transcript');
    const recordBtn  = document.getElementById('record-btn');

    // Lang chips
    document.querySelectorAll('#asr-lang-chips .lang-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#asr-lang-chips .lang-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        langInput.value = chip.dataset.lang;
      });
    });

    // File upload
    fileInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) {
        document.getElementById('asr-file-name').textContent = f.name;
        transcribeBtn.disabled = false;
      }
    });

    // Record button
    recordBtn.addEventListener('click', () => {
      if (this._isRecording) this._stopRecording(transcribeBtn);
      else this._startRecording(recordBtn, transcribeBtn);
    });

    // Transcribe
    transcribeBtn.addEventListener('click', async () => {
      transcribeBtn.classList.add('loading'); transcribeBtn.disabled = true;

      const fd = new FormData();
      fd.append('language', langInput.value);

      // Use recorded blob or uploaded file
      if (this._recordedBlob) {
        fd.append('file', this._recordedBlob, 'recording.wav');
      } else {
        const f = fileInput.files[0];
        if (!f) { transcribeBtn.classList.remove('loading'); transcribeBtn.disabled = false; return; }
        fd.append('file', f);
      }

      try {
        const result = await api.transcribeSpeech(fd);
        const outEl = document.getElementById('transcript-out');
        outEl.textContent = result.transcript || '(empty transcript)';

        const metaEl = document.getElementById('asr-meta');
        metaEl.innerHTML = `
          Provider: <strong>${result.provider}</strong>
          · Language: <strong>${result.detected_language || langInput.value}</strong>
          · Audio: <strong>${(result.audio_duration_sec || 0).toFixed(1)}s</strong>
          · ${result.duration_ms}ms
          ${result.is_fallback ? ' · <span style="color:var(--yellow)">⚠ Fallback mode</span>' : ''}
        `;

        copyBtn.style.display = '';
        // Enable paste-to-translate
        const pasteBtn = document.getElementById('btn-paste-transcript');
        if (pasteBtn) {
          pasteBtn.style.display = '';
          pasteBtn.onclick = () => {
            document.getElementById('trans-input').value = result.transcript;
            document.getElementById('char-count').textContent = result.transcript.length + ' characters';
          };
        }

        Toast.success('Transcribed successfully!');
      } catch (err) {
        document.getElementById('transcript-out').innerHTML =
          `<span style="color:var(--yellow)">⚠ ${err.message}</span>`;
        Toast.error('Transcription failed: ' + err.message);
      } finally {
        transcribeBtn.classList.remove('loading');
        transcribeBtn.disabled = false;
      }
    });

    // Copy
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('transcript-out').textContent;
      navigator.clipboard.writeText(text).then(() => Toast.success('Copied!'));
    });
  },

  async _startRecording(recordBtn, transcribeBtn) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._audioChunks = [];
      this._mediaRecorder = new MediaRecorder(stream);
      this._mediaRecorder.addEventListener('dataavailable', (e) => this._audioChunks.push(e.data));
      this._mediaRecorder.addEventListener('stop', () => {
        this._recordedBlob = new Blob(this._audioChunks, { type: 'audio/wav' });
        stream.getTracks().forEach(t => t.stop());
        transcribeBtn.disabled = false;
        document.getElementById('asr-file-name').textContent = 'Recording ready';
        clearInterval(this._recordTimer);
      });
      this._mediaRecorder.start();
      this._isRecording = true;

      recordBtn.classList.add('recording');
      document.getElementById('record-label').textContent = 'Recording… Click to stop';
      document.getElementById('record-icon').innerHTML = `<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>`;

      // Timer
      let secs = 0;
      this._recordTimer = setInterval(() => {
        secs++;
        document.getElementById('record-timer').textContent = `${secs}s`;
      }, 1000);
    } catch (err) {
      Toast.error('Microphone access denied: ' + err.message);
    }
  },

  _stopRecording(transcribeBtn) {
    if (this._mediaRecorder && this._isRecording) {
      this._mediaRecorder.stop();
      this._isRecording = false;
      const recordBtn = document.getElementById('record-btn');
      recordBtn.classList.remove('recording');
      document.getElementById('record-label').textContent = 'Click to record again';
      document.getElementById('record-icon').innerHTML = `<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>`;
    }
  },

  _wireTranslation() {
    const inputEl   = document.getElementById('trans-input');
    const charCount = document.getElementById('char-count');
    const transBtn  = document.getElementById('btn-translate');
    const copyBtn   = document.getElementById('btn-copy-trans');
    const swapBtn   = document.getElementById('btn-swap-lang');

    inputEl.addEventListener('input', () => {
      charCount.textContent = inputEl.value.length + ' characters';
    });

    swapBtn.addEventListener('click', () => {
      const src = document.getElementById('trans-src');
      const tgt = document.getElementById('trans-tgt');
      [src.value, tgt.value] = [tgt.value, src.value];
      // Also swap text
      const transOut = document.getElementById('trans-out');
      const outText = transOut.textContent;
      if (outText && !outText.includes('Translation will appear')) {
        inputEl.value = outText;
        transOut.textContent = '';
        charCount.textContent = inputEl.value.length + ' characters';
      }
    });

    transBtn.addEventListener('click', async () => {
      const text = inputEl.value.trim();
      if (!text) { Toast.info('Please enter text to translate.'); return; }

      transBtn.classList.add('loading'); transBtn.disabled = true;

      try {
        const src = document.getElementById('trans-src').value;
        const tgt = document.getElementById('trans-tgt').value;
        const result = await api.translate(text, src, tgt);

        const outEl = document.getElementById('trans-out');
        outEl.textContent = result.translated_text;

        const metaEl = document.getElementById('trans-meta');
        metaEl.innerHTML = `
          Provider: <strong>${result.provider}</strong>
          · ${src.toUpperCase()} → ${tgt.toUpperCase()}
          · ${result.duration_ms}ms
          ${result.degraded ? ' · <span style="color:var(--yellow)">⚠ Degraded (model unavailable)</span>' : ''}
        `;

        copyBtn.style.display = '';
        Toast.success('Translated!');
      } catch (err) {
        Toast.error('Translation failed: ' + err.message);
      } finally {
        transBtn.classList.remove('loading'); transBtn.disabled = false;
      }
    });

    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('trans-out').textContent;
      navigator.clipboard.writeText(text).then(() => Toast.success('Copied!'));
    });
  },
};
