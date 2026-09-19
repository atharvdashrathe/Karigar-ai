/**
 * dashboard.js — Dashboard page
 */

const DashboardPage = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="section-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Overview
        </div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Your artisan business at a glance</p>
      </div>
      <div class="page-body page-enter">
        <div id="demo-banner-wrap"></div>
        <div class="stats-grid" id="stats-grid">
          ${skeletonCards(6, '120px')}
        </div>
        <div class="grid-2" style="margin-top:0">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Recent Orders</span>
              <span class="text-muted text-sm" id="orders-count"></span>
            </div>
            <div class="card-body">
              <div class="table-wrapper" id="orders-table-wrap">
                <table>
                  <thead><tr>
                    <th>Buyer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th>
                  </tr></thead>
                  <tbody id="orders-tbody">${skeletonRows(5)}</tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">Earnings Overview</span>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas id="earnings-chart" style="width:100%;height:200px;"></canvas>
              </div>
              <div id="earnings-summary" style="margin-top:20px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    await this._loadData();
  },

  async _loadData() {
    try {
      const [dash, orders, earnings] = await Promise.all([
        api.dashboard(),
        api.orders(),
        api.earnings(),
      ]);

      this._renderBanner(dash.is_demo_data);
      this._renderStats(dash);
      this._renderOrders(orders);
      this._renderEarnings(orders, earnings);
    } catch (err) {
      Toast.error('Failed to load dashboard: ' + err.message);
    }
  },

  _renderBanner(isDemo) {
    const el = document.getElementById('demo-banner-wrap');
    if (!el) return;
    if (isDemo) {
      el.innerHTML = `
        <div class="demo-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span><strong>Demo Mode:</strong> Showing auto-seeded demo data. Real artisan data will replace this once you add artisans.</span>
        </div>
      `;
    }
  },

  _renderStats(dash) {
    const el = document.getElementById('stats-grid');
    if (!el) return;

    const stats = [
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
        iconClass: 'saffron', cardClass: 'accent-saffron',
        label: 'Total Products',
        value: dash.total_products,
        sub: `${dash.published_products} published · ${dash.draft_products} draft`,
      },
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg>`,
        iconClass: 'green', cardClass: 'accent-green',
        label: 'Published',
        value: dash.published_products,
        sub: 'Active listings',
      },
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        iconClass: 'yellow', cardClass: 'accent-yellow',
        label: 'Draft Products',
        value: dash.draft_products,
        sub: 'Pending review',
      },
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
        iconClass: 'green', cardClass: 'accent-green',
        label: 'Total Earnings',
        value: fmt.currency(dash.total_earnings),
        sub: `${dash.total_orders} total orders`,
        currency: false,
      },
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        iconClass: 'blue', cardClass: 'accent-blue',
        label: 'Total Orders',
        value: dash.total_orders,
        sub: 'All time',
      },
      {
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
        iconClass: 'purple', cardClass: 'accent-purple',
        label: 'Avg Listing Score',
        value: dash.average_listing_score != null ? Math.round(dash.average_listing_score) : '—',
        sub: 'AI quality score',
      },
    ];

    el.innerHTML = stats.map(s => `
      <div class="stat-card ${s.cardClass}">
        <div class="stat-icon ${s.iconClass}">${s.icon}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-sub">${s.sub}</div>
      </div>
    `).join('');
  },

  _renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    const countEl = document.getElementById('orders-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${orders.length} orders`;

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:30px">No orders yet</div></td></tr>`;
      return;
    }

    tbody.innerHTML = orders.slice(0, 10).map(o => `
      <tr>
        <td>${o.buyer_name || '<span class="text-muted">—</span>'}</td>
        <td><span class="text-muted text-sm">${o.product_id.slice(0,8)}…</span></td>
        <td>${o.quantity}</td>
        <td style="font-weight:600">${fmt.currency(o.total_amount)}</td>
        <td>${badge(o.status)}</td>
        <td class="text-muted text-sm">${fmt.date(o.created_at)}</td>
      </tr>
    `).join('');
  },

  _renderEarnings(orders, earnings) {
    // Build last-7 days buckets
    const now = new Date();
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), date: d.toDateString(), total: 0 };
    });

    orders.forEach(o => {
      const d = new Date(o.created_at).toDateString();
      const b = buckets.find(b => b.date === d);
      if (b) b.total += o.total_amount;
    });

    const labels = buckets.map(b => b.label);
    const values = buckets.map(b => b.total);

    requestAnimationFrame(() => {
      drawBarChart('earnings-chart', labels, values);
    });

    const summaryEl = document.getElementById('earnings-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="flex gap-4" style="flex-wrap:wrap">
          ${[
            { label: 'Total', val: fmt.currency(earnings.total_earnings), color: 'var(--green)' },
            { label: 'Pending', val: earnings.pending_orders + ' orders', color: 'var(--yellow)' },
            { label: 'Fulfilled', val: earnings.fulfilled_orders + ' orders', color: 'var(--blue)' },
          ].map(item => `
            <div style="flex:1;min-width:100px;background:var(--bg-elevated);border-radius:12px;padding:14px;">
              <div class="stat-label">${item.label}</div>
              <div style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;color:${item.color};margin-top:4px">${item.val}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },
};
