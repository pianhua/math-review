// ============================================================
//   MathReview — App Logic
//   ============================================================

const App = {
  currentScreen: 'home',
  data: null,

  init() {
    this.data = getMergedData();
    this.loadTheme();
    this.bindNav();
    this.renderAll();
    this.renderKaTeX();
  },

  // Theme
  loadTheme() {
    const saved = localStorage.getItem('mathreview:theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mathreview:theme', next);
  },

  // Navigation
  bindNav() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => this.goTo(el.dataset.nav));
    });
  },

  goTo(screenId) {
    this.currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('[data-nav]').forEach(n => n.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    document.querySelectorAll(`[data-nav="${screenId}"]`).forEach(n => n.classList.add('active'));
    window.scrollTo(0, 0);
    this.renderKaTeX();
  },

  // KaTeX
  renderKaTeX() {
    if (typeof katex === 'undefined') return;
    document.querySelectorAll('.katex-render').forEach(el => {
      const tex = el.dataset.latex || el.textContent;
      const display = el.dataset.display === 'true';
      try {
        katex.render(tex, el, {
          displayMode: display,
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (e) {
        el.textContent = tex;
      }
    });
  },

  // Bookmark
  toggleFormulaBookmark(id) {
    const marks = Storage.get('bookmarks', {});
    marks[id] = !marks[id];
    Storage.set('bookmarks', marks);
    this.data = getMergedData();
    this.renderAll();
    this.renderKaTeX();
  },

  toggleProblemBookmark(id) {
    const marks = Storage.get('problemBookmarks', {});
    marks[id] = !marks[id];
    Storage.set('problemBookmarks', marks);
    this.data = getMergedData();
    this.renderAll();
  },

  // Problem solving
  selectedOption: null,
  showExplanation: false,

  selectOption(label) {
    this.selectedOption = label;
    this.showExplanation = true;
    this.renderAll();
    this.renderKaTeX();
  },

  resetProblem() {
    this.selectedOption = null;
    this.showExplanation = false;
    this.renderAll();
    this.renderKaTeX();
  },

  // Master render
  renderAll() {
    if (window.renderHome) renderHome(this.data);
    if (window.renderFormulas) renderFormulas(this.data);
    if (window.renderPractice) renderPractice(this.data);
    if (window.renderErrors) renderErrors(this.data);
    if (window.renderMastery) renderMastery(this.data);
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
