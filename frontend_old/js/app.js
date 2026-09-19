/**
 * app.js — Main router, sidebar wiring, API health check
 */

const App = {
  _currentPage: null,

  async init() {
    Toast.init();
    Modal.init();

    this._wireSidebar();
    await this._checkHealth();

    // Default page
    this.navigate('dashboard');
  },

  navigate(page) {
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });

    this._currentPage = page;
    const container = document.getElementById('main-content');

    const pages = {
      'dashboard':    DashboardPage,
      'products':     ProductsPage,
      'image-studio': ImageStudioPage,
      'artisans':     ArtisansPage,
      'ai-tools':     AIToolsPage,
    };

    const pageObj = pages[page];
    if (pageObj) {
      pageObj.render(container);
      // Scroll to top
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  _wireSidebar() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) this.navigate(page);
      });
    });
  },

  async _checkHealth() {
    const dot  = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    try {
      const health = await api.health();
      dot.className = 'status-dot online';
      text.textContent = health.demo_mode ? 'Demo mode' : 'Connected';
    } catch (_) {
      dot.className = 'status-dot offline';
      text.textContent = 'Backend offline';
      Toast.error('Cannot reach backend at localhost:8000');
    }
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
