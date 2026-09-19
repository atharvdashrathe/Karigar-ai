/**
 * utils.js — Shared utility functions
 */

// ── Toast notifications ──────────────────────────────────────
const Toast = {
  _el: null,
  _timer: null,

  init() { this._el = document.getElementById('toast'); },

  show(msg, type = 'info', duration = 3500) {
    if (!this._el) return;
    clearTimeout(this._timer);
    this._el.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    this._el.innerHTML = `<span style="font-size:16px">${icon}</span><span>${msg}</span>`;
    // Force reflow
    void this._el.offsetWidth;
    this._el.classList.add('show');
    this._timer = setTimeout(() => this._el.classList.remove('show'), duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
};

// ── Modal ────────────────────────────────────────────────────
const Modal = {
  _overlay: null,
  _title: null,
  _body: null,
  _close: null,

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._title   = document.getElementById('modal-title');
    this._body    = document.getElementById('modal-body');
    this._close   = document.getElementById('modal-close');

    this._close.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  },

  open(title, bodyHTML) {
    this._title.textContent = title;
    this._body.innerHTML = bodyHTML;
    this._overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    return this._body;
  },

  close() {
    this._overlay.classList.remove('open');
    document.body.style.overflow = '';
  },
};

// ── Formatting helpers ───────────────────────────────────────
const fmt = {
  currency(n) {
    if (n == null) return '—';
    return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  },

  date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  score(n) {
    if (n == null) return '—';
    return Math.round(n);
  },

  initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  crafType(s) {
    if (!s) return 'Artisan';
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
};

// ── Skeleton HTML ────────────────────────────────────────────
function skeletonCards(n = 6, height = '180px') {
  return Array.from({ length: n }, () =>
    `<div class="skeleton" style="height:${height};border-radius:16px;"></div>`
  ).join('');
}

function skeletonRows(n = 5) {
  return Array.from({ length: n }, (_, i) => `
    <tr>
      ${Array.from({ length: 5 }, () =>
        `<td><div class="skeleton" style="height:14px;width:${60 + Math.random() * 40}%;border-radius:4px;"></div></td>`
      ).join('')}
    </tr>
  `).join('');
}

// ── Score ring SVG ───────────────────────────────────────────
function scoreRing(score, label = 'Score', size = 100, strokeW = 8) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score || 0));
  const dash = (pct / 100) * circ;

  const color = pct >= 75 ? '#22C55E' : pct >= 50 ? '#F5A623' : '#EF4444';

  return `
    <div class="score-ring-wrap">
      <div class="score-ring" style="width:${size}px;height:${size}px;">
        <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="${size/2}" cy="${size/2}" r="${r}"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            stroke-width="${strokeW}"
          />
          <circle
            cx="${size/2}" cy="${size/2}" r="${r}"
            fill="none"
            stroke="${color}"
            stroke-width="${strokeW}"
            stroke-linecap="round"
            stroke-dasharray="${dash} ${circ}"
            style="transition:stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)"
          />
        </svg>
        <div class="score-ring-text">
          <span class="score-ring-num" style="color:${color}">${Math.round(pct)}</span>
          <span class="score-ring-label">${label}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Badge HTML ───────────────────────────────────────────────
function badge(status) {
  const map = {
    published: 'published',
    draft:     'draft',
    pending:   'pending',
    fulfilled: 'fulfilled',
    cancelled: 'cancelled',
  };
  const cls = map[status] || 'draft';
  return `<span class="badge badge-${cls}">${status || 'draft'}</span>`;
}

// ── Quality bars HTML ────────────────────────────────────────
function qualityBars(breakdown) {
  if (!breakdown) return '';
  const labels = {
    brightness: 'Brightness',
    sharpness:  'Sharpness',
    composition:'Composition',
    background: 'Background',
    color_balance: 'Color Balance',
  };
  return Object.entries(breakdown).map(([key, val]) => {
    const pct = Math.round((val / 5) * 100);
    return `
      <div class="quality-bar-item">
        <span class="quality-bar-label">${labels[key] || key}</span>
        <div class="quality-bar-track">
          <div class="quality-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="quality-bar-val">${val}/5</span>
      </div>
    `;
  }).join('');
}

// ── Simple mini bar chart via canvas ────────────────────────
function drawBarChart(canvasId, labels, values, color = '#F5A623') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;
  const max = Math.max(...values, 1);
  const barW = W / values.length;
  const pad  = barW * 0.2;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y = H - H * f;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  });

  values.forEach((v, i) => {
    const x = i * barW + pad;
    const w = barW - pad * 2;
    const h = (v / max) * (H - 30);
    const y = H - h - 20;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, y, 0, H - 20);
    grad.addColorStop(0, color + 'CC');
    grad.addColorStop(1, color + '22');
    ctx.fillStyle = grad;

    // Rounded top
    const r = Math.min(4, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, H - 20);
    ctx.lineTo(x, H - 20);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Label
    if (labels[i]) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + w / 2, H - 5);
    }
  });
}

// ── Debounce ─────────────────────────────────────────────────
function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ── Craft type colors ─────────────────────────────────────────
function craftColor(craft) {
  const map = {
    pottery: '#E8450A',
    weaving: '#A855F7',
    jewelry: '#F5A623',
    woodwork:'#22C55E',
    embroidery:'#3B82F6',
  };
  return map[(craft || '').toLowerCase()] || '#8892B0';
}
