/**
 * products.js — Products page with grid, search, edit modal, and image enhance
 */

const ProductsPage = {
  _products: [],
  _artisans: [],
  _search: '',
  _statusFilter: '',

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="section-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Catalogue
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="page-title">Products</h1>
            <p class="page-subtitle">Manage your artisan product listings</p>
          </div>
          <button class="btn btn-primary" id="btn-add-product" aria-label="Add product">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>
      </div>
      <div class="page-body page-enter">
        <div class="toolbar">
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="search-input" type="text" id="product-search" placeholder="Search products…" aria-label="Search products" />
          </div>
          <select class="filter-select" id="status-filter" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select class="filter-select" id="artisan-filter" aria-label="Filter by artisan">
            <option value="">All Artisans</option>
          </select>
        </div>
        <div class="products-grid" id="products-grid">
          ${skeletonCards(6, '280px')}
        </div>
        <div id="products-empty" style="display:none"></div>
      </div>
    `;

    this._search = '';
    this._statusFilter = '';

    // Wire up search & filters
    const searchEl = document.getElementById('product-search');
    searchEl.addEventListener('input', debounce((e) => {
      this._search = e.target.value.toLowerCase();
      this._renderGrid();
    }, 200));

    document.getElementById('status-filter').addEventListener('change', (e) => {
      this._statusFilter = e.target.value;
      this._renderGrid();
    });

    document.getElementById('artisan-filter').addEventListener('change', (e) => {
      this._artisanFilter = e.target.value;
      this._renderGrid();
    });

    document.getElementById('btn-add-product').addEventListener('click', () => this._openAddModal());

    await this._loadData();
  },

  async _loadData() {
    try {
      const [products, artisans] = await Promise.all([
        api.listProducts(),
        api.listArtisans(),
      ]);
      this._products = products;
      this._artisans = artisans;
      this._populateArtisanFilter(artisans);
      this._renderGrid();
    } catch (err) {
      Toast.error('Failed to load products: ' + err.message);
    }
  },

  _populateArtisanFilter(artisans) {
    const sel = document.getElementById('artisan-filter');
    if (!sel) return;
    artisans.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      sel.appendChild(opt);
    });
  },

  _filtered() {
    return this._products.filter(p => {
      if (this._statusFilter && p.status !== this._statusFilter) return false;
      if (this._artisanFilter && p.artisan_id !== this._artisanFilter) return false;
      if (this._search) {
        const q = this._search;
        const haystack = [p.product_name, p.category, p.craft_type, p.description, p.materials]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  },

  _renderGrid() {
    const grid = document.getElementById('products-grid');
    const emptyEl = document.getElementById('products-empty');
    const list = this._filtered();

    if (!list.length) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      emptyEl.style.display = '';
      emptyEl.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <div class="empty-state-title">No products found</div>
          <p>Try a different search or add a new product.</p>
        </div>
      `;
      return;
    }

    grid.style.display = '';
    emptyEl.style.display = 'none';

    grid.innerHTML = list.map(p => this._productCardHTML(p)).join('');

    // Wire card clicks
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const product = this._products.find(p => p.id === id);
        if (product) this._openEditModal(product);
      });
    });
  },

  _productCardHTML(p) {
    const imgSrc = api.imageUrl(p.enhanced_image_url || p.original_image_url);
    const artisan = this._artisans.find(a => a.id === p.artisan_id);

    return `
      <div class="product-card" data-id="${p.id}" role="button" tabindex="0" aria-label="Edit ${p.product_name || 'product'}">
        <div class="product-img-wrap">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${p.product_name || 'Product'}" loading="lazy" />`
            : `<div class="product-img-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>No image</span>
               </div>`
          }
          ${p.listing_score != null ? `<div class="product-score-chip">⭐ ${p.listing_score}</div>` : ''}
        </div>
        <div class="product-card-body">
          <div class="product-name">${p.product_name || '<span style="color:var(--text-muted)">Untitled Product</span>'}</div>
          <div class="product-craft">${fmt.crafType(p.craft_type || p.category)} ${artisan ? '· ' + artisan.name : ''}</div>
          <div class="product-meta">
            <div class="product-price">${p.price ? fmt.currency(p.price) : '<span class="product-price-none">No price set</span>'}</div>
            ${badge(p.status)}
          </div>
        </div>
      </div>
    `;
  },

  _openAddModal() {
    if (!this._artisans.length) {
      Toast.error('Please create an artisan profile first.');
      App.navigate('artisans');
      return;
    }

    const artisanOptions = this._artisans.map(a =>
      `<option value="${a.id}">${a.name} — ${a.business_name || a.craft_type || 'Artisan'}</option>`
    ).join('');

    const body = Modal.open('Add New Product', `
      <form id="add-product-form">
        <div class="form-group">
          <label class="form-label" for="ap-artisan">Artisan *</label>
          <select class="form-select" id="ap-artisan" required>${artisanOptions}</select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ap-name">Product Name</label>
            <input class="form-input" type="text" id="ap-name" placeholder="e.g. Blue Pottery Vase" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ap-category">Category</label>
            <input class="form-input" type="text" id="ap-category" placeholder="e.g. Pottery" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ap-desc">Description</label>
          <textarea class="form-textarea" id="ap-desc" placeholder="Describe the product…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ap-price">Price (₹)</label>
            <input class="form-input" type="number" id="ap-price" placeholder="0" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ap-craft">Craft Type</label>
            <input class="form-input" type="text" id="ap-craft" placeholder="e.g. Weaving" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ap-materials">Materials</label>
            <input class="form-input" type="text" id="ap-materials" placeholder="e.g. Cotton, silk" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ap-inventory">Inventory Count</label>
            <input class="form-input" type="number" id="ap-inventory" value="1" min="0" />
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-create-product">
            Create Product
          </button>
        </div>
      </form>
    `);

    body.querySelector('#add-product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = body.querySelector('#btn-create-product');
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        const payload = {
          artisan_id:     body.querySelector('#ap-artisan').value,
          product_name:   body.querySelector('#ap-name').value || null,
          category:       body.querySelector('#ap-category').value || null,
          description:    body.querySelector('#ap-desc').value || null,
          price:          Number(body.querySelector('#ap-price').value) || null,
          craft_type:     body.querySelector('#ap-craft').value || null,
          materials:      body.querySelector('#ap-materials').value || null,
          inventory_count: Number(body.querySelector('#ap-inventory').value) || 1,
        };
        const created = await api.createProduct(payload);
        this._products.unshift(created);
        this._renderGrid();
        Modal.close();
        Toast.success('Product created!');
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  },

  _openEditModal(p) {
    const artisan = this._artisans.find(a => a.id === p.artisan_id);
    const imgSrc  = api.imageUrl(p.enhanced_image_url || p.original_image_url);
    const origSrc = api.imageUrl(p.original_image_url);
    const enhSrc  = api.imageUrl(p.enhanced_image_url);

    const body = Modal.open(p.product_name || 'Edit Product', `
      <!-- Images -->
      ${imgSrc ? `
        <div class="compare-grid" style="grid-template-columns:${enhSrc ? '1fr 1fr' : '1fr'};margin-bottom:20px">
          ${origSrc ? `
            <div class="compare-panel">
              <div class="compare-label"><span>Original</span></div>
              <div class="compare-img-wrap" style="aspect-ratio:4/3"><img src="${origSrc}" alt="Original" loading="lazy" /></div>
            </div>
          ` : ''}
          ${enhSrc ? `
            <div class="compare-panel" style="border-color:rgba(245,166,35,0.3)">
              <div class="compare-label"><span>Enhanced ✨</span>${badge('published')}</div>
              <div class="compare-img-wrap" style="aspect-ratio:4/3"><img src="${enhSrc}" alt="Enhanced" loading="lazy" /></div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Enhance image -->
      <div style="margin-bottom:20px">
        <label class="form-label">Enhance Image with AI</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="file" id="edit-img-file" accept="image/*" style="display:none" aria-label="Choose image file" />
          <button class="btn btn-secondary btn-sm" id="btn-pick-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Choose Photo
          </button>
          <button class="btn btn-primary btn-sm" id="btn-enhance-img" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Enhance
          </button>
          <span id="img-filename" class="text-muted text-sm"></span>
        </div>
      </div>

      <div class="sep"></div>

      <!-- Edit form -->
      <form id="edit-product-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Product Name</label>
            <input class="form-input" id="ep-name" value="${p.product_name || ''}" placeholder="Product name" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" id="ep-category" value="${p.category || ''}" placeholder="Category" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="ep-desc" placeholder="Description…">${p.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Price (₹)</label>
            <input class="form-input" type="number" id="ep-price" value="${p.price || ''}" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Inventory</label>
            <input class="form-input" type="number" id="ep-inventory" value="${p.inventory_count}" min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Materials</label>
            <input class="form-input" id="ep-materials" value="${p.materials || ''}" placeholder="Materials used" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="ep-status">
              <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Keywords / Tags</label>
          <input class="form-input" id="ep-keywords" value="${p.keywords || ''}" placeholder="e.g. handmade, blue, pottery" />
        </div>

        <div style="display:flex;gap:12px;justify-content:space-between;margin-top:8px">
          <button type="button" class="btn btn-danger btn-sm" id="btn-delete-product">Delete</button>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-product">Save Changes</button>
          </div>
        </div>
      </form>
    `);

    // Image pick & enhance
    const fileEl = body.querySelector('#edit-img-file');
    body.querySelector('#btn-pick-img').addEventListener('click', () => fileEl.click());
    fileEl.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) {
        body.querySelector('#img-filename').textContent = f.name;
        body.querySelector('#btn-enhance-img').disabled = false;
      }
    });

    body.querySelector('#btn-enhance-img').addEventListener('click', async () => {
      const file = fileEl.files[0];
      if (!file) return;
      const btn = body.querySelector('#btn-enhance-img');
      btn.classList.add('loading'); btn.disabled = true;
      btn.textContent = 'Enhancing…';
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('product_id', p.id);
        const result = await api.enhanceImage(fd);

        // Update local product
        const idx = this._products.findIndex(x => x.id === p.id);
        if (idx !== -1) {
          this._products[idx].original_image_url = result.original_image_url;
          this._products[idx].enhanced_image_url = result.enhanced_image_url;
        }

        Toast.success(`Image enhanced! Score: ${result.original_quality_score} → ${result.quality_score}`);
        Modal.close();
        this._renderGrid();
        // Re-open with updated product
        setTimeout(() => {
          const updated = this._products.find(x => x.id === p.id);
          if (updated) this._openEditModal(updated);
        }, 300);
      } catch (err) {
        Toast.error('Enhancement failed: ' + err.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Enhance`;
      }
    });

    // Save
    body.querySelector('#edit-product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = body.querySelector('#btn-save-product');
      btn.classList.add('loading'); btn.disabled = true;
      try {
        const payload = {
          product_name:   body.querySelector('#ep-name').value || null,
          category:       body.querySelector('#ep-category').value || null,
          description:    body.querySelector('#ep-desc').value || null,
          price:          Number(body.querySelector('#ep-price').value) || null,
          inventory_count: Number(body.querySelector('#ep-inventory').value) || 1,
          materials:      body.querySelector('#ep-materials').value || null,
          status:         body.querySelector('#ep-status').value,
          keywords:       body.querySelector('#ep-keywords').value || null,
        };
        const updated = await api.updateProduct(p.id, payload);
        const idx = this._products.findIndex(x => x.id === p.id);
        if (idx !== -1) this._products[idx] = updated;
        this._renderGrid();
        Modal.close();
        Toast.success('Product updated!');
      } catch (err) {
        Toast.error(err.message);
      } finally {
        btn.classList.remove('loading'); btn.disabled = false;
      }
    });

    // Delete
    body.querySelector('#btn-delete-product').addEventListener('click', async () => {
      if (!confirm('Delete this product? This cannot be undone.')) return;
      try {
        await api.deleteProduct(p.id);
        this._products = this._products.filter(x => x.id !== p.id);
        this._renderGrid();
        Modal.close();
        Toast.success('Product deleted.');
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },
};
