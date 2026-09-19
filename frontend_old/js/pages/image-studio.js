/**
 * image-studio.js — Dedicated Image Enhancement Studio page
 */

const ImageStudioPage = {
  _result: null,

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="section-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          AI Vision
        </div>
        <h1 class="page-title">Image Studio</h1>
        <p class="page-subtitle">Remove backgrounds, score quality, and enhance product photos with AI</p>
      </div>
      <div class="page-body page-enter">
        <div class="grid-2" style="gap:28px">

          <!-- Left: Upload + controls -->
          <div>
            <div class="upload-zone" id="upload-zone">
              <input type="file" id="studio-file" accept="image/jpeg,image/png,image/webp" aria-label="Upload product image" />
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div class="upload-title">Drop your product photo here</div>
              <div class="upload-hint">or click to browse · JPG, PNG, WebP · max 15MB</div>
            </div>

            <div id="preview-wrap" style="display:none;margin-top:16px">
              <div class="card">
                <div class="card-header">
                  <span class="card-title">Selected Image</span>
                  <button class="btn btn-ghost btn-sm" id="btn-clear-img">Clear</button>
                </div>
                <div class="card-body" style="padding-top:12px">
                  <img id="preview-img" src="" alt="Preview" style="width:100%;border-radius:8px;object-fit:contain;max-height:260px" />
                  <div style="margin-top:12px;font-size:12px;color:var(--text-muted)" id="file-info"></div>
                </div>
              </div>
            </div>

            <!-- Link to product (optional) -->
            <div style="margin-top:16px">
              <label class="form-label" for="studio-product">Link to product (optional)</label>
              <select class="form-select" id="studio-product" aria-label="Select product">
                <option value="">— None —</option>
              </select>
              <div class="form-hint">When linked, results are saved to the product record.</div>
            </div>

            <div style="margin-top:20px">
              <button class="btn btn-primary btn-lg w-full" id="btn-enhance" disabled>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Enhance with AI
              </button>
            </div>

            <!-- Processing status -->
            <div id="enhance-status" style="display:none;margin-top:16px;text-align:center">
              <div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px">
                <div style="width:40px;height:40px;border:3px solid var(--border-medium);border-top-color:var(--accent-saffron);border-radius:50%;animation:spin 0.8s linear infinite"></div>
                <span class="text-muted text-sm">AI is enhancing your photo…</span>
              </div>
            </div>
          </div>

          <!-- Right: Results -->
          <div id="results-panel">
            <div class="card" style="height:100%;display:flex;flex-direction:column">
              <div class="card-header">
                <span class="card-title">Enhancement Results</span>
                <span id="provider-chip"></span>
              </div>
              <div class="card-body" id="results-body" style="flex:1">
                <div class="empty-state" style="padding:40px 20px">
                  <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div class="empty-state-title">No results yet</div>
                  <p>Upload an image and click Enhance to see AI-powered improvements.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- How it works -->
        <div style="margin-top:32px">
          <div class="card">
            <div class="card-header"><span class="card-title">How AI Image Enhancement Works</span></div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px">
                ${[
                  { icon: '📸', title: 'Upload Photo', desc: 'Upload any product photo in JPG, PNG or WebP format.' },
                  { icon: '🤖', title: 'AI Analysis', desc: 'U2Net model scores brightness, sharpness, composition and more.' },
                  { icon: '✂️', title: 'BG Removal', desc: 'Background is cleanly removed, leaving just your product.' },
                  { icon: '📊', title: 'Quality Score', desc: 'Before & after quality scores show the improvement.' },
                ].map(s => `
                  <div style="text-align:center;padding:16px">
                    <div style="font-size:32px;margin-bottom:12px">${s.icon}</div>
                    <div style="font-weight:600;font-size:13px;color:var(--text-primary);margin-bottom:6px">${s.title}</div>
                    <div style="font-size:12px;color:var(--text-muted);line-height:1.5">${s.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._result = null;
    await this._loadProducts();
    this._wireEvents();
  },

  async _loadProducts() {
    try {
      const products = await api.listProducts();
      const sel = document.getElementById('studio-product');
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.product_name || 'Untitled'} (${p.status})`;
        sel.appendChild(opt);
      });
    } catch (_) {}
  },

  _wireEvents() {
    const fileEl   = document.getElementById('studio-file');
    const zone     = document.getElementById('upload-zone');
    const btn      = document.getElementById('btn-enhance');
    const clearBtn = document.getElementById('btn-clear-img');

    // Drag & Drop
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._previewFile(file, fileEl);
    });

    fileEl.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this._previewFile(file, fileEl);
    });

    clearBtn?.addEventListener('click', () => this._clearPreview(fileEl, btn));

    btn.addEventListener('click', () => this._enhance(fileEl));
  },

  _previewFile(file, fileEl) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('preview-img').src = e.target.result;
      document.getElementById('file-info').textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
      document.getElementById('preview-wrap').style.display = '';
      document.getElementById('btn-enhance').disabled = false;
    };
    reader.readAsDataURL(file);
  },

  _clearPreview(fileEl, btn) {
    fileEl.value = '';
    document.getElementById('preview-wrap').style.display = 'none';
    btn.disabled = true;
    this._clearResults();
  },

  _clearResults() {
    document.getElementById('results-body').innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-state-title">No results yet</div>
        <p>Upload an image and click Enhance.</p>
      </div>
    `;
    document.getElementById('provider-chip').innerHTML = '';
  },

  async _enhance(fileEl) {
    const file = fileEl.files[0];
    if (!file) return;

    const btn       = document.getElementById('btn-enhance');
    const statusEl  = document.getElementById('enhance-status');

    btn.disabled = true;
    btn.classList.add('loading');
    statusEl.style.display = '';

    try {
      const fd = new FormData();
      fd.append('file', file);
      const productId = document.getElementById('studio-product').value;
      if (productId) fd.append('product_id', productId);

      const result = await api.enhanceImage(fd);
      this._result = result;
      this._renderResults(result);
      Toast.success(`Enhanced! Score improved ${result.original_quality_score} → ${result.quality_score}`);
    } catch (err) {
      Toast.error('Enhancement failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
      statusEl.style.display = 'none';
    }
  },

  _renderResults(r) {
    const chip = document.getElementById('provider-chip');
    chip.innerHTML = `<span class="provider-chip">⚡ ${r.provider} · ${r.duration_ms}ms</span>`;

    const origUrl = api.imageUrl(r.original_image_url);
    const enhUrl  = api.imageUrl(r.enhanced_image_url);

    const bd = r.quality_breakdown || {};
    const origBd = r.original_quality_breakdown || {};

    document.getElementById('results-body').innerHTML = `
      <!-- Score comparison -->
      <div style="display:flex;justify-content:center;gap:40px;margin-bottom:28px">
        ${scoreRing(r.original_quality_score, 'Before', 90)}
        <div style="display:flex;align-items:center;color:var(--accent-saffron);font-size:24px">→</div>
        ${scoreRing(r.quality_score, 'After', 90)}
      </div>

      <!-- Image comparison -->
      <div class="compare-grid">
        <div class="compare-panel">
          <div class="compare-label">Original</div>
          <div class="compare-img-wrap">
            <img src="${origUrl}" alt="Original" loading="lazy" />
          </div>
        </div>
        <div class="compare-panel" style="border-color:rgba(245,166,35,0.3)">
          <div class="compare-label">
            <span>Enhanced ✨</span>
            ${r.background_removed ? '<span class="badge badge-published">BG Removed</span>' : ''}
          </div>
          <div class="compare-img-wrap">
            <img src="${enhUrl}" alt="Enhanced" loading="lazy" />
          </div>
        </div>
      </div>

      <!-- Quality breakdown -->
      <div style="margin-top:24px">
        <div class="card-title" style="margin-bottom:12px">Quality Breakdown (After)</div>
        <div class="quality-bars">
          ${qualityBars(bd)}
        </div>
      </div>

      <!-- Suggestions -->
      ${r.suggestions && r.suggestions.length ? `
        <div style="margin-top:20px">
          <div class="card-title" style="margin-bottom:10px">AI Suggestions</div>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:8px">
            ${r.suggestions.map(s => `
              <li style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text-secondary)">
                <span style="color:var(--accent-saffron);flex-shrink:0;margin-top:1px">→</span>${s}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Download buttons -->
      <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap">
        <a href="${origUrl}" download class="btn btn-ghost btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Original
        </a>
        <a href="${enhUrl}" download class="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Enhanced
        </a>
      </div>
    `;
  },
};
