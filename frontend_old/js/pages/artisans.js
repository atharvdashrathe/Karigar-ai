/**
 * artisans.js — Artisans page with profile cards and create form
 */

const ArtisansPage = {
  _artisans: [],

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="section-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Community
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Artisans</h1>
            <p class="page-subtitle">Craftspeople registered on Karigar AI</p>
          </div>
          <button class="btn btn-primary" id="btn-add-artisan" aria-label="Register artisan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Register Artisan
          </button>
        </div>
      </div>
      <div class="page-body page-enter">
        <div class="artisan-grid" id="artisan-grid">
          ${skeletonCards(4, '220px')}
        </div>
        <div id="artisans-empty" style="display:none"></div>
      </div>
    `;

    document.getElementById('btn-add-artisan').addEventListener('click', () => this._openAddModal());

    await this._loadData();
  },

  async _loadData() {
    try {
      this._artisans = await api.listArtisans();
      this._renderGrid();
    } catch (err) {
      Toast.error('Failed to load artisans: ' + err.message);
    }
  },

  _renderGrid() {
    const grid   = document.getElementById('artisan-grid');
    const emptyEl = document.getElementById('artisans-empty');

    if (!this._artisans.length) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      emptyEl.style.display = '';
      emptyEl.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <div class="empty-state-title">No artisans yet</div>
          <p>Register the first artisan to get started.</p>
        </div>
      `;
      return;
    }

    grid.style.display = '';
    emptyEl.style.display = 'none';
    grid.innerHTML = this._artisans.map(a => this._cardHTML(a)).join('');
  },

  _cardHTML(a) {
    const color = craftColor(a.craft_type);
    const tags = [
      a.craft_type  && { icon: '🎨', text: fmt.crafType(a.craft_type) },
      a.location    && { icon: '📍', text: a.location },
      a.experience_years && { icon: '⏳', text: `${a.experience_years} yrs exp.` },
      a.preferred_language && { icon: '🗣️', text: a.preferred_language.toUpperCase() },
    ].filter(Boolean);

    return `
      <div class="artisan-card fade-in">
        <div class="artisan-avatar" style="background:linear-gradient(135deg, ${color}, ${color}88)">
          ${fmt.initials(a.name)}
        </div>
        <div class="artisan-name">${a.name}</div>
        ${a.business_name ? `<div class="artisan-biz">${a.business_name}</div>` : '<div class="artisan-biz" style="color:var(--text-muted)">Individual Artisan</div>'}
        <div class="artisan-tags">
          ${tags.map(t => `<span class="artisan-tag artisan-tag-icon">${t.icon} ${t.text}</span>`).join('')}
        </div>
        <div class="sep" style="margin:12px 0"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-secondary btn-sm" onclick="ArtisansPage._viewProducts('${a.id}', '${a.name.replace(/'/g, "\\'")}')">
            View Products
          </button>
          <span class="text-muted text-sm">Since ${fmt.date(a.created_at)}</span>
        </div>
      </div>
    `;
  },

  _viewProducts(artisanId, artisanName) {
    App.navigate('products');
    // After navigation, filter by artisan — set via event
    setTimeout(() => {
      const sel = document.getElementById('artisan-filter');
      if (sel) {
        sel.value = artisanId;
        sel.dispatchEvent(new Event('change'));
      }
    }, 150);
  },

  _openAddModal() {
    const languages = ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'bn', 'pa'];
    const langOptions = languages.map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('');

    const body = Modal.open('Register New Artisan', `
      <form id="add-artisan-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="aa-name">Full Name *</label>
            <input class="form-input" id="aa-name" placeholder="e.g. Radha Devi" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="aa-phone">Phone Number *</label>
            <input class="form-input" id="aa-phone" type="tel" placeholder="+91 98765 43210" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="aa-business">Business Name</label>
            <input class="form-input" id="aa-business" placeholder="e.g. Radha Handicrafts" />
          </div>
          <div class="form-group">
            <label class="form-label" for="aa-craft">Craft Type</label>
            <input class="form-input" id="aa-craft" placeholder="e.g. Pottery, Weaving" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="aa-location">Location</label>
            <input class="form-input" id="aa-location" placeholder="e.g. Jaipur, Rajasthan" />
          </div>
          <div class="form-group">
            <label class="form-label" for="aa-exp">Experience (years)</label>
            <input class="form-input" type="number" id="aa-exp" placeholder="5" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="aa-lang">Preferred Language</label>
          <select class="form-select" id="aa-lang">${langOptions}</select>
        </div>

        <!-- Language chips for visual selection -->
        <div style="margin-bottom:20px">
          <div class="form-label" style="margin-bottom:8px">Quick Language Select</div>
          <div class="lang-selector" id="lang-chips">
            ${['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Bengali', 'Punjabi'].map((name, i) =>
              `<span class="lang-chip ${i === 0 ? 'active' : ''}" data-lang="${languages[i]}">${name}</span>`
            ).join('')}
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button type="button" class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-create-artisan">Register</button>
        </div>
      </form>
    `);

    // Lang chip sync
    body.querySelectorAll('.lang-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        body.querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const langSel = body.querySelector('#aa-lang');
        if (langSel) langSel.value = chip.dataset.lang;
      });
    });

    body.querySelector('#add-artisan-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = body.querySelector('#btn-create-artisan');
      btn.classList.add('loading'); btn.disabled = true;
      try {
        const payload = {
          name:               body.querySelector('#aa-name').value.trim(),
          phone_number:       body.querySelector('#aa-phone').value.trim(),
          business_name:      body.querySelector('#aa-business').value.trim() || null,
          craft_type:         body.querySelector('#aa-craft').value.trim() || null,
          location:           body.querySelector('#aa-location').value.trim() || null,
          experience_years:   Number(body.querySelector('#aa-exp').value) || null,
          preferred_language: body.querySelector('#aa-lang').value,
        };
        const created = await api.createArtisan(payload);
        this._artisans.unshift(created);
        this._renderGrid();
        Modal.close();
        Toast.success(`${created.name} registered successfully!`);
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.classList.remove('loading'); btn.disabled = false;
      }
    });
  },
};
