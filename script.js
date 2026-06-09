/* ============================================
   CONECTA JÁ — MAIN SCRIPT
   All pages shared functionality
============================================ */

'use strict';

/* ============================================
   THEME MANAGER — Dark / Light mode
   Runs immediately so the correct theme is
   applied before first paint
============================================ */
const ThemeManager = (function () {
  const KEY = 'cj-theme';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    const icon = document.querySelector('#themeToggle i');
    const btn  = document.getElementById('themeToggle');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    if (btn)  btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }

  function init() {
    // Sync icon with the theme already set by the anti-flash inline script
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    apply(current);

    document.getElementById('themeToggle')?.addEventListener('click', function () {
      const now = document.documentElement.getAttribute('data-theme') || 'light';
      // Enable smooth CSS transitions only after the first user click
      document.body.classList.add('theme-transitions');
      apply(now === 'dark' ? 'light' : 'dark');
    });
  }

  return { init, apply };
})();

/* Normaliza número de telefone para o formato internacional angolano (+244XXXXXXXXX) */
function waPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('244')) return digits;          // já tem código país
  if (digits.startsWith('0'))   return '244' + digits.slice(1); // 0912... → 244912...
  return '244' + digits;                                // 912... → 244912...
}

/* ============================================
   APP STATE
============================================ */
const App = {
  state: {
    user: null,
    token: null,
    notifications: [],
  },

  init() {
    this.loadSession();
    UI.init();
    Auth.init();
    Notifications.init();
    Counter.init();
    Carousel.init();
    ScrollReveal.init();
    Search.init();
    Modal.init();
    BackToTop.init();
    Header.init();
    PageTransition.init();
  },

  loadSession() {
    // Auth is handled by Firebase — clear legacy localStorage data
    localStorage.removeItem('cj_user');
    localStorage.removeItem('cj_token');
    localStorage.removeItem('cj_users');
  },

  saveSession(user) {
    this.state.user = user;
  },

  clearSession() {
    this.state.user = null;
  },
};

/* ============================================
   HEADER SCROLL EFFECT
============================================ */
const Header = {
  init() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      if (scrollY > lastScroll && scrollY > 200) {
        navbar.classList.add('hidden');
      } else {
        navbar.classList.remove('hidden');
      }
      lastScroll = scrollY;
    }, { passive: true });
  },
};

/* ============================================
   MOBILE MENU
============================================ */
const UI = {
  init() {
    this.initMobileMenu();
    this.initAuthDisplay();
  },

  initMobileMenu() {
    const toggle = document.querySelector('.navbar__toggle');
    const menu = document.querySelector('.navbar__menu');
    const navLinks = document.querySelectorAll('.navbar__link');

    if (!toggle || !menu) return;

    // Inject CTA buttons at the bottom of the mobile menu (only once)
    if (!menu.querySelector('.mobile-menu-cta')) {
      const ctaRow = document.createElement('div');
      ctaRow.className = 'mobile-menu-cta';
      ctaRow.style.cssText = 'display:flex;gap:.75rem;padding-top:.75rem;border-top:1px solid var(--color-gray-100);margin-top:.25rem;';
      ctaRow.innerHTML = `
        <a href="prestadores.html" class="btn btn--outline btn--sm" style="flex:1;justify-content:center;">Ver Prestadores</a>
        <button class="btn btn--primary btn--sm" data-modal="loginModal" style="flex:1;justify-content:center;">Entrar</button>
      `;
      menu.appendChild(ctaRow);
      ctaRow.querySelector('[data-modal="loginModal"]')?.addEventListener('click', () => {
        this.closeMenu(toggle, menu);
        Modal.open('loginModal');
      });
    }

    // Inject settings row (theme + language) — only on mobile, only once
    if (!menu.querySelector('.mobile-menu-settings')) {
      const currentLang = localStorage.getItem('cj_lang') || 'pt';
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const settingsRow = document.createElement('div');
      settingsRow.className = 'mobile-menu-settings';
      settingsRow.innerHTML = `
        <button class="mm-theme-btn" title="Alternar tema">
          <i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>
          ${isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button class="mm-lang-btn ${currentLang === 'pt' ? 'active' : ''}" data-mm-lang="pt">🇵🇹 PT</button>
        <button class="mm-lang-btn ${currentLang === 'en' ? 'active' : ''}" data-mm-lang="en">🇬🇧 EN</button>
      `;
      menu.appendChild(settingsRow);

      settingsRow.querySelector('.mm-theme-btn').addEventListener('click', () => {
        document.getElementById('themeToggle')?.click();
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        const btn = settingsRow.querySelector('.mm-theme-btn');
        btn.innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}"></i> ${dark ? 'Modo Claro' : 'Modo Escuro'}`;
      });

      settingsRow.querySelectorAll('.mm-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-mm-lang');
          document.querySelector(`.lang-option[data-set-lang="${lang}"]`)?.click();
          settingsRow.querySelectorAll('.mm-lang-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('active');
      if (isOpen) {
        this.closeMenu(toggle, menu);
      } else {
        this.openMenu(toggle, menu);
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMenu(toggle, menu));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeMenu(toggle, menu);
    });

    document.addEventListener('click', e => {
      if (menu.classList.contains('active') &&
          !menu.contains(e.target) && !toggle.contains(e.target)) {
        this.closeMenu(toggle, menu);
      }
    });
  },

  openMenu(toggle, menu) {
    menu.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = '<i class="fas fa-times"></i>';
    document.body.style.overflow = 'hidden';
  },

  closeMenu(toggle, menu) {
    menu.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.style.overflow = '';
  },

  initAuthDisplay() {
    this.updateAuthDisplay();
  },

  updateAuthDisplay() {
    const user = App.state.user;
    const authBtns = document.querySelector('.navbar__actions');
    if (!authBtns) return;

    if (user) {
      const dashboard = user.type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html';
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      const profileData = (typeof Profile !== 'undefined') ? Profile.get(user.uid) : {};
      const photo = profileData.photoURL || '';
      const typeLabel = user.type === 'provider' ? 'Prestador' : 'Cliente';

      authBtns.innerHTML = `
        <div class="user-menu">
          <button class="user-avatar" aria-label="Menu do utilizador">
            ${photo ? `<img src="${esc(photo)}" alt="${esc(user.name)}">` : `<span>${esc(initial)}</span>`}
          </button>
          <div class="user-dropdown">
            <div class="user-dropdown__header">
              <strong>${esc(user.name)}</strong>
              <span>${typeLabel}</span>
            </div>
            <a href="${dashboard}"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            <a href="meu-perfil.html"><i class="fas fa-user-edit"></i> Meu Perfil</a>
            <hr>
            <a href="#" class="logout-link" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Sair</a>
          </div>
        </div>
      `;
      document.getElementById('logoutBtn')?.addEventListener('click', e => {
        e.preventDefault();
        Auth.logout();
      });
      const btn = authBtns.querySelector('.user-avatar');
      const dd = authBtns.querySelector('.user-dropdown');
      btn?.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('open'); });
      document.addEventListener('click', e => { if (!authBtns.contains(e.target)) dd?.classList.remove('open'); });
      // Replace mobile menu bottom section with user navigation links
      const mobileCta = document.querySelector('.mobile-menu-cta');
      if (mobileCta) {
        mobileCta.style.cssText = 'display:flex;flex-direction:column;gap:.15rem;padding-top:.75rem;border-top:1px solid var(--color-gray-100);margin-top:.25rem;';
        mobileCta.innerHTML = `
          <div style="display:flex;align-items:center;gap:.875rem;padding:.875rem 1rem;background:var(--color-gray-50);border-radius:.875rem;margin-bottom:.1rem;">
            <div style="width:38px;height:38px;border-radius:.75rem;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-weight:900;color:white;font-size:1.1rem;flex-shrink:0;">${initial}</div>
            <div><strong style="font-size:.875rem;display:block;color:var(--color-gray-900);">${esc(user.name)}</strong><span style="font-size:.72rem;color:var(--color-gray-500);">${typeLabel}</span></div>
          </div>
          <a href="${dashboard}" style="display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-radius:.875rem;font-size:.875rem;font-weight:600;color:var(--color-gray-700);text-decoration:none;"><i class="fas fa-tachometer-alt" style="width:18px;text-align:center;color:var(--color-primary);"></i> Dashboard</a>
          <a href="meu-perfil.html" style="display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-radius:.875rem;font-size:.875rem;font-weight:600;color:var(--color-gray-700);text-decoration:none;"><i class="fas fa-user-edit" style="width:18px;text-align:center;color:var(--color-primary);"></i> Meu Perfil</a>
          <button id="mobileLogoutBtn" style="display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-radius:.875rem;font-size:.875rem;font-weight:600;color:var(--color-primary);background:none;border:none;cursor:pointer;width:100%;" ><i class="fas fa-sign-out-alt" style="width:18px;text-align:center;"></i> Terminar Sessão</button>
        `;
        document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => Auth.logout());
      }
      // Update "Começar Agora" CTA based on account type
      const ctaBtn = document.getElementById('btnComecarAgora');
      if (ctaBtn) {
        if (user.type === 'provider') {
          ctaBtn.innerHTML = '<i class="fas fa-user"></i> Ver o meu Perfil';
          ctaBtn.onclick = e => { e.preventDefault(); window.location.href = 'meu-perfil.html'; };
        } else {
          ctaBtn.innerHTML = '<i class="fas fa-search"></i> Ver Prestadores';
          ctaBtn.onclick = e => { e.preventDefault(); window.location.href = 'prestadores.html'; };
        }
      }
    } else {
      authBtns.innerHTML = `
        <a href="prestadores.html" class="btn btn--outline btn--sm">Ver Prestadores</a>
        <button class="btn btn--primary btn--sm" data-modal="loginModal">Entrar</button>
      `;
      // Restore mobile menu to login/register CTA buttons
      const mobileCta = document.querySelector('.mobile-menu-cta');
      if (mobileCta) {
        mobileCta.style.cssText = 'display:flex;gap:.75rem;padding-top:.75rem;border-top:1px solid var(--color-gray-100);margin-top:.25rem;';
        mobileCta.innerHTML = `
          <a href="prestadores.html" class="btn btn--outline btn--sm" style="flex:1;justify-content:center;">Ver Prestadores</a>
          <button class="btn btn--primary btn--sm" id="mobileEntrarBtn" style="flex:1;justify-content:center;">Entrar</button>
        `;
        document.getElementById('mobileEntrarBtn')?.addEventListener('click', () => {
          const toggle = document.querySelector('.navbar__toggle');
          const menu   = document.querySelector('.navbar__menu');
          if (toggle && menu) UI.closeMenu(toggle, menu);
          Modal.open('loginModal');
        });
      }
      // Restore "Começar Agora" CTA to default
      const ctaBtn = document.getElementById('btnComecarAgora');
      if (ctaBtn) {
        ctaBtn.innerHTML = '<i class="fas fa-rocket"></i> Começar Agora — Grátis';
        ctaBtn.onclick = null;
      }
    }
  },
};

/* ============================================
   PAGE TRANSITIONS
============================================ */
const PageTransition = {
  overlay: null,

  init() {
    this.overlay = document.querySelector('.page-transition-overlay');
    if (!this.overlay) return;

    setTimeout(() => {
      this.overlay.classList.add('exit');
    }, 100);

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          href.startsWith('javascript') || link.hasAttribute('data-no-transition')) return;

      link.addEventListener('click', e => {
        e.preventDefault();
        this.overlay.classList.remove('exit');
        this.overlay.classList.add('enter');
        setTimeout(() => { window.location.href = href; }, 400);
      });
    });
  },
};

/* ============================================
   COUNTER ANIMATION
============================================ */
const Counter = {
  init() {
    const counters = document.querySelectorAll('.count[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  },

  animate(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString('pt-AO') + suffix;
      if (current < target) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  },
};

/* ============================================
   STATS SYNC — homepage counters from Firestore
============================================ */
const StatsSync = {
  async init() {
    if (!document.getElementById('stat-providers')) return;
    if (!window.firebaseDb) return;

    // Providers + rating — public read, always works
    try {
      const providersSnap = await window.firebaseDb.collection('providers').where('type', '==', 'provider').get();
      const totalProviders = providersSnap.size;

      const rated = providersSnap.docs.filter(d => Number(d.data().reviews) > 0);
      let avgRating = 0;
      if (rated.length) {
        const sum = rated.reduce((s, d) => s + (Number(d.data().rating) || 0), 0);
        avgRating = Math.round((sum / rated.length) * 10) / 10;
      }

      const provEl = document.getElementById('stat-providers');
      if (provEl) {
        provEl.setAttribute('data-target', totalProviders);
        Counter.animate(provEl);
      }

      const ratingEl = document.getElementById('stat-rating');
      if (ratingEl) ratingEl.textContent = avgRating > 0 ? avgRating.toFixed(1) : '—';

    } catch (e) {
      console.error('StatsSync/providers:', e);
    }

    // Completed orders — read from public stats document
    try {
      const statsSnap = await window.firebaseDb.collection('stats').doc('global').get();
      const totalCompleted = statsSnap.exists ? (statsSnap.data().completedOrders || 0) : 0;
      const ordEl = document.getElementById('stat-orders');
      if (ordEl && totalCompleted > 0) {
        ordEl.setAttribute('data-target', totalCompleted);
        Counter.animate(ordEl);
      }
    } catch (_) { /* stays 0 */ }

    // Satisfaction (static 98%)
    const satEl = document.getElementById('stat-satisfaction');
    if (satEl) Counter.animate(satEl);
  },
};

/* ============================================
   TESTIMONIALS CAROUSEL
============================================ */
const Carousel = {
  track: null,
  dots: null,
  current: 0,
  total: 0,
  autoInterval: null,

  init() {
    this.track = document.querySelector('.testimonials__track');
    if (!this.track) return;

    const cards = this.track.querySelectorAll('.testimonial-card');
    this.total = cards.length;
    if (this.total === 0) return;

    this.dots = document.querySelectorAll('.testimonials__dot');

    document.querySelector('.testimonials__prev, #prevTestimonial')?.addEventListener('click', () => {
      this.prev();
      this.resetAuto();
    });
    document.querySelector('.testimonials__next, #nextTestimonial')?.addEventListener('click', () => {
      this.next();
      this.resetAuto();
    });

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.resetAuto();
      });
    });

    this.initTouch();
    this.startAuto();
    this.update();
  },

  goTo(index) {
    this.current = (index + this.total) % this.total;
    this.update();
  },

  next() { this.goTo(this.current + 1); },
  prev() { this.goTo(this.current - 1); },

  update() {
    if (!this.track) return;
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.current);
    });
  },

  startAuto() {
    this.autoInterval = setInterval(() => this.next(), 5000);
  },

  resetAuto() {
    clearInterval(this.autoInterval);
    this.startAuto();
  },

  initTouch() {
    let startX = 0;
    this.track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        this.resetAuto();
      }
    }, { passive: true });
  },
};

/* ============================================
   SCROLL REVEAL
============================================ */
const ScrollReveal = {
  init() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!els.length) return;

    // Reveal immediately if already in (or near) viewport
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) {
        el.classList.add('revealed');
      }
    });

    // Observe the rest with a generous rootMargin (pre-reveals 300px before entry)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 300px 0px' });

    els.forEach(el => {
      if (!el.classList.contains('revealed')) observer.observe(el);
    });

    // Fallback: reveal everything after 1.5s in case observer never fires
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed)')
        .forEach(el => el.classList.add('revealed'));
    }, 1500);
  },
};

/* ============================================
   BACK TO TOP
============================================ */
const BackToTop = {
  init() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },
};

/* ============================================
   MODAL SYSTEM
============================================ */
const Modal = {
  init() {
    // Event delegation — works for dynamically injected modals too
    document.addEventListener('click', e => {
      if (e.target.closest('.modal__close') || e.target.closest('[data-modal-close]')) {
        this.closeAll();
        return;
      }
      if (e.target.classList.contains('modal__overlay')) {
        this.closeAll();
        return;
      }
      const trigger = e.target.closest('[data-modal]');
      if (trigger) {
        e.preventDefault();
        this.open(trigger.dataset.modal);
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeAll();
    });
  },

  open(id) {
    this.closeAll();
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('[autofocus]')?.focus(), 50);
  },

  close(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    if (!document.querySelector('.modal.active')) document.body.style.overflow = '';
  },

  closeAll() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  },
};

/* ============================================
   TOAST NOTIFICATIONS
============================================ */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <i class="fas fa-${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="toast__close" aria-label="Fechar"><i class="fas fa-times"></i></button>
    `;
    toast.querySelector('.toast__close').addEventListener('click', () => this.dismiss(toast));
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    if (duration > 0) setTimeout(() => this.dismiss(toast), duration);
    return toast;
  },

  dismiss(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  },

  success(msg, dur) { return this.show(msg, 'success', dur); },
  error(msg, dur) { return this.show(msg, 'error', dur); },
  warning(msg, dur) { return this.show(msg, 'warning', dur); },
  info(msg, dur) { return this.show(msg, 'info', dur); },
};

/* ============================================
   SEARCH
============================================ */
const Search = {
  init() {
    this.initSearchForm();
    this.initSuggestions();
  },

  initSearchForm() {
    const form = document.querySelector('.search__form, .hero__search-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = form.querySelector('input[name="q"], .hero__search-input')?.value?.trim();
      const loc = form.querySelector('select[name="location"]')?.value;
      const cat = form.querySelector('select[name="category"]')?.value;
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (loc && loc !== 'all') params.set('location', loc);
      if (cat && cat !== 'all') params.set('category', cat);
      window.location.href = `prestadores.html?${params.toString()}`;
    });
  },

  initSuggestions() {
    const input = document.querySelector('.hero__search-input, .search__input[name="q"]');
    const dropdown = document.querySelector('.search__suggestions');
    if (!input || !dropdown) return;

    const suggestions = [
      'Canalizador', 'Electricista', 'Pintor', 'Carpinteiro', 'Mecânico',
      'Jardineiro', 'Lavandaria', 'Limpeza', 'Fotógrafo', 'Designer',
      'Professor', 'Contabilista', 'Advogado', 'Médico', 'Fisioterapeuta',
      'Informático', 'Chef', 'Segurança', 'Motorista', 'Pedreiro'
    ];

    input.addEventListener('input', () => {
      const val = input.value.toLowerCase().trim();
      if (val.length < 2) { dropdown.hidden = true; return; }
      const matches = suggestions.filter(s => s.toLowerCase().includes(val)).slice(0, 6);
      if (!matches.length) { dropdown.hidden = true; return; }
      dropdown.innerHTML = matches.map(m =>
        `<div class="suggestion-item" role="option"><i class="fas fa-search"></i> ${m}</div>`
      ).join('');
      dropdown.hidden = false;
      dropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          input.value = item.textContent.trim();
          dropdown.hidden = true;
        });
      });
    });

    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.hidden = true;
      }
    });
  },
};

/* ============================================
   VALIDATION HELPERS
============================================ */
const Validate = {
  email(val) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); },
  phone(val) { return /^(\+244|244)?[0-9]{9}$/.test(val.replace(/\s/g, '')); },
  password(val) { return val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val); },
  required(val) { return val !== null && val !== undefined && String(val).trim().length > 0; },
};

/* ============================================
   XSS PROTECTION — escape user-generated text
============================================ */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================
   AUTHENTICATION
============================================ */
const Auth = {
  _ready: false,
  _callbacks: [],

  init() {
    if (!window.firebaseAuth) {
      // Firebase not loaded — fallback
      this._ready = true;
      this._flush();
      this.bindRegisterForm();
      this.bindLoginForm();
      return;
    }

    window.firebaseAuth.onAuthStateChanged(async fbUser => {
      if (fbUser) {
        // Use localStorage as a fast initial value while Firestore loads
        let type = localStorage.getItem('cj_type_' + fbUser.uid) || 'client';

        // Firestore is the authoritative source — localStorage can be tampered via DevTools
        if (window.firebaseDb) {
          try {
            const doc = await window.firebaseDb.collection('providers').doc(fbUser.uid).get();
            if (doc.exists && doc.data().type) {
              type = doc.data().type;
              localStorage.setItem('cj_type_' + fbUser.uid, type); // keep cache in sync
            }
          } catch (_) { /* network issue — fall back to cached value */ }
        }

        // Derived phone emails (e.g. 244xxx@phone.conectaja.app) are internal — hide from UI
        const realEmail = fbUser.email?.endsWith('@phone.conectaja.app') ? '' : (fbUser.email || '');
        App.state.user = {
          uid: fbUser.uid,
          id: fbUser.uid,
          name: fbUser.displayName || 'Utilizador',
          email: realEmail,
          phone: fbUser.phoneNumber || '',
          type,
          emailVerified: fbUser.emailVerified,
        };
      } else {
        App.state.user = null;
      }

      UI.updateAuthDisplay();
      this.protectPages();

      if (!this._ready) {
        this._ready = true;
        this._flush();
      }
    });

    this.bindRegisterForm();
    this.bindLoginForm();
  },

  onReady(cb) {
    if (this._ready) cb(App.state.user);
    else this._callbacks.push(cb);
  },

  _flush() {
    this._callbacks.forEach(cb => cb(App.state.user));
    this._callbacks = [];
  },

  async register(name, email, password, type) {
    const cred = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });

    // Send verification email immediately after creation, before any other async work
    try { await cred.user.sendEmailVerification(); } catch (_) { /* non-fatal */ }

    localStorage.setItem('cj_type_' + cred.user.uid, type);

    // Create a Firestore profile for ALL users — providers and clients alike.
    // Clients need this so providers can read their name/phone/location after accepting an order.
    if (window.firebaseDb) {
      const profileDoc = {
        uid: cred.user.uid,
        name,
        email,
        type,
        phone: '',
        location: '',
        photoURL: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      if (type === 'provider') {
        Object.assign(profileDoc, {
          category: '',
          bio: '',
          price: 0,
          availability: true,
          rating: 0,
          reviews: 0,
          verified: false,
        });
      }
      await window.firebaseDb.collection('providers').doc(cred.user.uid).set(profileDoc);
    }

    return cred.user;
  },

  async login(email, password) {
    const cred = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async logout() {
    await window.firebaseAuth.signOut();
    App.state.user = null;
    Toast.info('Sessão terminada.');
    setTimeout(() => window.location.href = 'index.html', 1000);
  },

  currentUser() { return App.state.user; },
  isLoggedIn() { return !!App.state.user; },

  protectPages() {
    const current = window.location.pathname.split('/').pop();
    const user = App.state.user;
    const protected_ = ['dashboard-client.html', 'dashboard-provider.html', 'meu-perfil.html'];

    if (!user) {
      if (protected_.includes(current)) {
        sessionStorage.setItem('cj-redirect', current);
        setTimeout(() => window.location.href = 'login.html', 300);
      }
      return;
    }
  },

  async resendVerificationEmail() {
    const fbUser = window.firebaseAuth?.currentUser;
    if (!fbUser) return;
    try {
      await fbUser.sendEmailVerification();
      Toast.success('Email de verificação reenviado! Verifica a tua caixa de entrada.');
    } catch (err) {
      Toast.error('Erro ao reenviar. Tenta novamente mais tarde.');
    }
  },

  async deleteAccount(password) {
    const fbUser = window.firebaseAuth?.currentUser;
    if (!fbUser) throw new Error('not-logged');

    // Re-authenticate — Firebase requires this before account deletion
    const credential = firebase.auth.EmailAuthProvider.credential(fbUser.email, password);
    await fbUser.reauthenticateWithCredential(credential);

    const uid = fbUser.uid;

    // Delete Firestore profile (providers + clients collection)
    if (window.firebaseDb) {
      try { await window.firebaseDb.collection('providers').doc(uid).delete(); } catch (_) {}
    }

    // Delete Firebase Auth account — email is freed, user can register again
    await fbUser.delete();

    App.clearSession();
    localStorage.removeItem('cj_type_' + uid);
    Toast.info('A tua conta foi eliminada permanentemente.');
    setTimeout(() => window.location.href = 'index.html', 2000);
  },

  bindRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = form.querySelector('#reg_name')?.value?.trim();
      const email = form.querySelector('#reg_email')?.value?.trim();
      const password = form.querySelector('#reg_password')?.value;
      const type = form.querySelector('[name="user_type"]:checked')?.value || 'client';

      if (!name || !Validate.email(email)) {
        Toast.error('Por favor preenche todos os campos corretamente.');
        return;
      }
      if (!Validate.password(password)) {
        Toast.error('A password deve ter pelo menos 8 caracteres, uma maiúscula e um número.');
        return;
      }

      const btn = form.querySelector('[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar conta…';
      btn.disabled = true;

      try {
        await this.register(name, email, password, type);
        Modal.closeAll();
        form.reset();
        btn.innerHTML = orig;
        btn.disabled = false;
        Toast.success(`Conta criada! Enviámos um email de verificação para ${email}. Confirma o email antes de entrar — se não aparecer na caixa de entrada, verifica a pasta de spam.`, 10000);
      } catch (err) {
        btn.innerHTML = orig;
        btn.disabled = false;
        Toast.error(this.errorMsg(err.code));
      }
    });
  },

  bindLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const emailOrPhone = form.querySelector('#login_email')?.value?.trim();
      const password = form.querySelector('#login_password')?.value;

      const btn = form.querySelector('[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A entrar…';
      btn.disabled = true;

      // Detect if input is a phone number (digits/spaces/+ only, no @)
      const isPhone = /^[\+\d][\d\s\-]{5,}$/.test(emailOrPhone) && !emailOrPhone.includes('@');

      try {
        const fbUser = isPhone
          ? await this.loginWithPhone(emailOrPhone, password)
          : await this.login(emailOrPhone, password);

        // Skip email verification for phone users and Google users
        const isPhoneDerived = fbUser.email?.endsWith('@phone.conectaja.app');
        if (!fbUser.phoneNumber && !isPhoneDerived && !fbUser.emailVerified) {
          btn.innerHTML = orig;
          btn.disabled = false;
          const verifyToast = Toast.warning('Email não verificado.', 0);
          const resendBtn = document.createElement('button');
          resendBtn.textContent = 'Reenviar email';
          resendBtn.style.cssText = 'margin-left:.5rem;background:none;border:1px solid currentColor;border-radius:.4rem;padding:.15rem .5rem;cursor:pointer;font-weight:700;';
          resendBtn.addEventListener('click', () => Auth.resendVerificationEmail());
          verifyToast.querySelector('span')?.appendChild(resendBtn);
          return;
        }

        const type = localStorage.getItem('cj_type_' + fbUser.uid) || 'client';
        Toast.success(`Bem-vindo de volta, ${fbUser.displayName || 'utilizador'}!`);
        Modal.closeAll();
        form.reset();
        setTimeout(() => {
          window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html';
        }, 1500);
      } catch (err) {
        btn.innerHTML = orig;
        btn.disabled = false;
        const msg = isPhone && err.code === 'auth/user-not-found'
          ? 'Número não registado ou sem senha criada.'
          : this.errorMsg(err.code);
        Toast.error(msg);
      }
    });
  },

  errorMsg(code) {
    const map = {
      'auth/email-already-in-use': 'Este email já está registado.',
      'auth/invalid-email': 'Email inválido.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/user-not-found': 'Email não encontrado.',
      'auth/wrong-password': 'Senha incorrecta.',
      'auth/invalid-credential': 'Email ou senha incorrectos.',
      'auth/too-many-requests': 'Demasiadas tentativas. Tenta mais tarde.',
      'auth/network-request-failed': 'Sem ligação à internet.',
      'auth/popup-closed-by-user': '',
      'auth/popup-blocked': 'O popup foi bloqueado. Permite popups neste site.',
      'auth/account-exists-with-different-credential': 'Esta conta já existe com outro método de login.',
      'auth/invalid-phone-number': 'Número de telefone inválido.',
      'auth/invalid-verification-code': 'Código inválido. Verifica e tenta novamente.',
      'auth/code-expired': 'O código expirou. Pede um novo.',
      'auth/missing-phone-number': 'Introduz o número de telefone.',
      'auth/quota-exceeded': 'Limite de SMS atingido. Tenta mais tarde.',
      'auth/session-expired': 'Sessão expirada. Pede um novo código.',
      'auth/unauthorized-domain': 'Domínio não autorizado. Usa localhost em vez de 127.0.0.1.',
      'auth/captcha-check-failed': 'Verificação reCAPTCHA falhou. Recarrega a página e tenta novamente.',
      'auth/operation-not-allowed': 'Este método de login não está ativado no Firebase Console.',
      'auth/internal-error': 'Erro interno do Firebase. Verifica a consola do browser.',
      'auth/provider-already-linked': 'Já tens uma senha criada para esta conta.',
      'auth/no-such-provider': 'Este método de login não está associado à conta.',
    };
    return map[code] || 'Erro inesperado. Tenta novamente.';
  },

  async loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await window.firebaseAuth.signInWithPopup(provider);
    const fbUser = cred.user;

    let type = 'client';
    let isNew = false;

    if (window.firebaseDb) {
      const doc = await window.firebaseDb.collection('providers').doc(fbUser.uid).get();
      if (doc.exists && doc.data().type) {
        type = doc.data().type;
        localStorage.setItem('cj_type_' + fbUser.uid, type);
      } else {
        isNew = true;
      }
    }

    return { fbUser, type, isNew };
  },

  async _createFirestoreProfile(fbUser, type, nameOverride = null) {
    if (!window.firebaseDb) return;
    const name = nameOverride || fbUser.displayName || 'Utilizador';
    if (nameOverride && window.firebaseAuth?.currentUser) {
      try { await window.firebaseAuth.currentUser.updateProfile({ displayName: nameOverride }); } catch (_) {}
    }
    const profileDoc = {
      uid: fbUser.uid,
      name,
      email: fbUser.email || '',
      type,
      phone: fbUser.phoneNumber || '',
      location: '',
      photoURL: fbUser.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (type === 'provider') {
      Object.assign(profileDoc, { category: '', bio: '', price: 0, availability: true, rating: 0, reviews: 0, verified: false });
    }
    await window.firebaseDb.collection('providers').doc(fbUser.uid).set(profileDoc);
  },

  async createPhonePassword(password) {
    const fbUser = window.firebaseAuth?.currentUser;
    if (!fbUser?.phoneNumber) throw new Error('no-phone');
    const derivedEmail = fbUser.phoneNumber.replace('+', '') + '@phone.conectaja.app';
    const credential = firebase.auth.EmailAuthProvider.credential(derivedEmail, password);
    await fbUser.linkWithCredential(credential);
    if (window.firebaseDb) {
      await window.firebaseDb.collection('providers').doc(fbUser.uid).update({ phoneEmail: derivedEmail });
    }
  },

  async loginWithPhone(phone, password) {
    const normalized = phone.startsWith('+') ? phone.replace(/\s/g, '') : '+244' + phone.replace(/\D/g, '');
    const derivedEmail = normalized.replace('+', '') + '@phone.conectaja.app';
    const cred = await window.firebaseAuth.signInWithEmailAndPassword(derivedEmail, password);
    return cred.user;
  },

  _phoneConfirmation: null,
  _phoneRecaptcha: null,

  initPhoneRecaptcha() {
    if (this._phoneRecaptcha) {
      try { this._phoneRecaptcha.clear(); } catch (_) {}
      this._phoneRecaptcha = null;
    }
    const container = document.getElementById('phone-recaptcha');
    if (!container || !window.firebaseAuth) return;
    container.innerHTML = '';

    const sendBtn = document.getElementById('sendCodeBtn');
    if (sendBtn) sendBtn.disabled = true;

    this._phoneRecaptcha = new firebase.auth.RecaptchaVerifier('phone-recaptcha', {
      size: 'normal',
      callback: () => {
        if (sendBtn) sendBtn.disabled = false;
      },
      'expired-callback': () => {
        if (sendBtn) sendBtn.disabled = true;
      },
    });
    this._phoneRecaptcha.render().catch(() => {});
  },

  async sendPhoneCode(phone) {
    if (!this._phoneRecaptcha) throw new Error('recaptcha-not-initialized');
    this._phoneConfirmation = await window.firebaseAuth.signInWithPhoneNumber(phone, this._phoneRecaptcha);
  },

  async verifyPhoneCode(code) {
    if (!this._phoneConfirmation) throw new Error('no-confirmation');
    return this._phoneConfirmation.confirm(code);
  },
};

/* ============================================
   NOTIFICATIONS
============================================ */
const Notifications = {
  key: 'cj_notifications',

  init() { this.render(); },

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (e) { return []; }
  },

  add(title, body, type = 'info') {
    const notifs = this.getAll();
    const n = { id: Date.now(), title, body, type, read: false, createdAt: new Date().toISOString() };
    notifs.unshift(n);
    localStorage.setItem(this.key, JSON.stringify(notifs.slice(0, 50)));
    this.render();
    return n;
  },

  markRead(id) {
    const notifs = this.getAll().map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(this.key, JSON.stringify(notifs));
    this.render();
  },

  markAllRead() {
    const notifs = this.getAll().map(n => ({ ...n, read: true }));
    localStorage.setItem(this.key, JSON.stringify(notifs));
    this.render();
  },

  render() {
    const unread = this.getAll().filter(n => !n.read).length;
    document.querySelectorAll('.notif-badge').forEach(badge => {
      badge.textContent = unread || '';
      badge.style.display = unread ? 'flex' : 'none';
    });
  },
};

/* ============================================
   GLOBAL STATS — public Firestore document
============================================ */
const Stats = {
  _ref() {
    return window.firebaseDb?.collection('stats').doc('global');
  },
  async increment(field, amount = 1) {
    try {
      const ref = this._ref();
      if (!ref) return;
      await ref.set(
        { [field]: firebase.firestore.FieldValue.increment(amount) },
        { merge: true }
      );
    } catch (_) { /* non-critical */ }
  },
};

/* ============================================
   ORDERS SYSTEM — Firestore
============================================ */
const Orders = {
  _ts(doc) {
    const t = doc.createdAt;
    return t?.toDate ? t.toDate().toISOString() : (t || new Date().toISOString());
  },

  async hasActiveOrder(clientId, providerId) {
    if (!window.firebaseDb) return false;
    try {
      // Block if there's already a pending or accepted order between this pair
      const snap = await window.firebaseDb.collection('orders')
        .where('clientId',   '==', clientId)
        .where('providerId', '==', providerId)
        .where('status', 'in', ['pending', 'accepted'])
        .limit(1)
        .get();
      return !snap.empty;
    } catch (_) { return false; }
  },

  async create(data) {
    if (!window.firebaseDb) throw new Error('Firestore não disponível.');
    const user = App.state.user;

    // Block duplicate active orders
    const active = await this.hasActiveOrder(user.uid, data.providerId);
    if (active) throw new Error('duplicate-order');

    const orderId = 'ORD' + Date.now();
    const clientProfile = Profile.get(user.uid);
    const order = {
      id:             orderId,
      clientId:       user.uid,
      clientName:     user.name,
      clientPhone:    clientProfile.phone    || '',
      clientLocation: clientProfile.location || '',
      clientPhotoURL: clientProfile.photoURL || '',
      providerId:     data.providerId,
      providerName:   data.providerName,
      category:       data.category,
      message:        data.message || '',
      status:         'pending',
      createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
    };
    await window.firebaseDb.collection('orders').doc(orderId).set(order);
    Stats.increment('totalOrders'); // fire-and-forget
    return { ...order, id: orderId };
  },

  async getByUser(userId) {
    if (!window.firebaseDb) return [];
    try {
      const [clientSnap, providerSnap] = await Promise.all([
        window.firebaseDb.collection('orders').where('clientId', '==', userId).get(),
        window.firebaseDb.collection('orders').where('providerId', '==', userId).get(),
      ]);
      const map = new Map();
      [...clientSnap.docs, ...providerSnap.docs].forEach(doc => {
        if (!map.has(doc.id)) {
          const d = doc.data();
          map.set(doc.id, {
            ...d,
            id: doc.id,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        }
      });
      return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Orders.getByUser:', e);
      return [];
    }
  },

  async updateStatus(orderId, status, prevStatus) {
    if (!window.firebaseDb) return;
    await window.firebaseDb.collection('orders').doc(orderId).update({
      status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    if (status === 'completed' && prevStatus !== 'completed') {
      Stats.increment('completedOrders'); // fire-and-forget
    }
  },

  getStatuses() {
    return {
      pending: 'Pendente',
      accepted: 'Aceite',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
  },

  _fromDoc(doc) {
    const d = doc.data();
    return {
      ...d,
      id: doc.id,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  },
};

/* ============================================
   REVIEWS SYSTEM — Firestore
============================================ */
const Reviews = {
  async getByProvider(providerId) {
    if (!window.firebaseDb) return [];
    try {
      const snap = await window.firebaseDb
        .collection('reviews')
        .where('providerId', '==', providerId)
        .get();
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Reviews.getByProvider:', e);
      return [];
    }
  },

  async hasReviewed(clientId, providerId) {
    if (!window.firebaseDb || !clientId) return false;
    try {
      const snap = await window.firebaseDb
        .collection('reviews')
        .where('providerId', '==', providerId)
        .where('clientId', '==', clientId)
        .limit(1)
        .get();
      return !snap.empty;
    } catch (_) { return false; }
  },

  async add(data) {
    if (!window.firebaseDb) throw new Error('Firestore não disponível.');

    // Block duplicate reviews
    const alreadyReviewed = await this.hasReviewed(data.clientId, data.providerId);
    if (alreadyReviewed) throw new Error('duplicate');

    // Block self-review
    if (data.clientId && data.clientId === data.providerId) throw new Error('self-review');

    if (data.text && data.text.length > 500) throw new Error('text-too-long');

    const reviewId = 'REV' + Date.now();
    await window.firebaseDb.collection('reviews').doc(reviewId).set({
      id: reviewId,
      providerId: data.providerId,
      clientId: data.clientId || '',
      authorName: data.authorName,
      rating: data.rating,
      text: data.text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Update provider's rating average (await so callers see the updated values)
    await this._updateProviderRating(data.providerId);
    return reviewId;
  },

  async update(reviewId, { rating, text, providerId }) {
    if (!window.firebaseDb) throw new Error('Firestore não disponível.');
    if (text && text.length > 500) throw new Error('text-too-long');
    await window.firebaseDb.collection('reviews').doc(reviewId).update({
      rating,
      text,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await this._updateProviderRating(providerId);
  },

  async delete(reviewId, providerId) {
    if (!window.firebaseDb) throw new Error('Firestore não disponível.');
    await window.firebaseDb.collection('reviews').doc(reviewId).delete();
    await this._updateProviderRating(providerId);
  },

  async _updateProviderRating(providerId) {
    try {
      const reviews = await this.getByProvider(providerId);
      if (!reviews.length) {
        await window.firebaseDb.collection('providers').doc(providerId).update({
          rating: 0, reviews: 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }
      const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
      await window.firebaseDb.collection('providers').doc(providerId).update({
        rating: Math.round(avg * 10) / 10,
        reviews: reviews.length,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) { console.error('updateProviderRating:', e); }
  },

  renderStars(rating, max = 5) {
    let html = '';
    for (let i = 1; i <= max; i++) {
      if (i <= Math.floor(rating)) html += '<i class="fas fa-star"></i>';
      else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
      else html += '<i class="far fa-star"></i>';
    }
    return html;
  },
};

/* ============================================
   CHAT SYSTEM
============================================ */
const Chat = {
  key: 'cj_chats',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (e) { return []; }
  },

  getConversation(userId1, userId2) {
    const key = [userId1, userId2].sort().join('_');
    return this.getAll().filter(m => m.conversationKey === key);
  },

  send(fromId, toId, text) {
    const chats = this.getAll();
    const msg = {
      id: Date.now(),
      conversationKey: [fromId, toId].sort().join('_'),
      fromId,
      toId,
      text: text.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    chats.push(msg);
    localStorage.setItem(this.key, JSON.stringify(chats.slice(-500)));
    return msg;
  },

  markRead(fromId, toId) {
    const key = [fromId, toId].sort().join('_');
    const chats = this.getAll().map(m =>
      m.conversationKey === key && m.toId === toId ? { ...m, read: true } : m
    );
    localStorage.setItem(this.key, JSON.stringify(chats));
  },

  unreadCount(userId) {
    return this.getAll().filter(m => m.toId === userId && !m.read).length;
  },
};

/* ============================================
   FILE UPLOAD HELPERS
============================================ */
const Upload = {
  maxSizeMB: 5,

  validate(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
    if (!allowedTypes.includes(file.type)) {
      Toast.error('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
      return false;
    }
    if (file.size > this.maxSizeMB * 1024 * 1024) {
      Toast.error(`O arquivo deve ter menos de ${this.maxSizeMB}MB.`);
      return false;
    }
    return true;
  },

  toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async preview(file, imgEl) {
    if (!this.validate(file)) return false;
    const base64 = await this.toBase64(file);
    if (imgEl) imgEl.src = base64;
    return base64;
  },
};

/* ============================================
   PROVIDERS DATA
============================================ */
const Providers = {
  _cache: null,

  async fetchAll() {
    if (!window.firebaseDb) { this._cache = []; return []; }
    try {
      const snap = await window.firebaseDb
        .collection('providers')
        .where('type', '==', 'provider')
        .get();
      this._cache = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          name: d.name || 'Prestador',
          category: d.category || 'outro',
          location: (d.location || 'luanda').toLowerCase(),
          rating: Number(d.rating) || 0,
          reviews: Number(d.reviews) || 0,
          price: Number(d.price) || 0,
          bio: d.bio || 'Prestador de serviços no Conecta Já.',
          phone: d.phone || '',
          avatar: d.photoURL || null,
          verified: d.verified || false,
          available: d.availability !== false,
        };
      }).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      return this._cache;
    } catch (err) {
      console.warn('Firestore indisponível:', err.message);
      this._cache = [];
      return [];
    }
  },

  getAll() { return this._cache || []; },

  getById(id) { return this.getAll().find(p => String(p.id) === String(id)); },

  search({ q = '', location = 'all', category = 'all' } = {}) {
    return this.getAll().filter(p => {
      const matchQ = !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.bio || '').toLowerCase().includes(q.toLowerCase());
      const matchLoc = location === 'all' || !location || p.location === location;
      const matchCat = category === 'all' || !category || p.category === category;
      return matchQ && matchLoc && matchCat;
    });
  },
};

/* ============================================
   PRESTADORES PAGE
============================================ */
const PrestadoresPage = {
  async init() {
    if (!document.querySelector('.providers-grid')) return;

    const grid = document.querySelector('.providers-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
          <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--color-primary);display:block;margin-bottom:1rem;"></i>
          <p style="color:var(--color-gray-500);">A carregar prestadores…</p>
        </div>`;
    }

    await Providers.fetchAll();
    this.bindFilters();
    this.renderFromURL();
  },

  renderFromURL() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const location = params.get('location') || 'all';
    const category = params.get('category') || 'all';

    const searchInput = document.querySelector('.search__input[name="q"]');
    const locationSelect = document.querySelector('select[name="location"]');
    const categorySelect = document.querySelector('select[name="category"]');

    if (searchInput && q) searchInput.value = q;
    if (locationSelect && location !== 'all') locationSelect.value = location;
    if (categorySelect && category !== 'all') categorySelect.value = category;

    this.render({ q, location, category });
  },

  bindFilters() {
    const form = document.querySelector('.providers-filter-form, .search__form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const q = form.querySelector('input[name="q"]')?.value?.trim() || '';
        const location = form.querySelector('select[name="location"]')?.value || 'all';
        const category = form.querySelector('select[name="category"]')?.value || 'all';
        this.render({ q, location, category });
        history.replaceState(null, '', `?q=${q}&location=${location}&category=${category}`);
      });
    }

    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        const category = tag.getAttribute('data-category') || 'all';
        this.render({ category });
      });
    });

    const sortSelect = document.querySelector('[name="sort"]');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => this.applySort(sortSelect.value));
    }
  },

  render(filters = {}) {
    const grid = document.querySelector('.providers-grid');
    if (!grid) return;

    const providers = Providers.search(filters);
    const count = document.querySelector('.providers-count');
    if (count) {
      count.textContent = `${providers.length} prestador${providers.length !== 1 ? 'es' : ''} encontrado${providers.length !== 1 ? 's' : ''}`;
    }

    if (!providers.length) {
      const total = Providers.getAll().length;
      grid.innerHTML = `
        <div class="providers-empty" style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
          <i class="fas fa-${total === 0 ? 'users' : 'search'}" style="font-size:3rem;color:var(--color-gray-400);margin-bottom:1rem;display:block;"></i>
          <h3>${total === 0 ? 'Ainda não há prestadores registados' : 'Nenhum prestador encontrado'}</h3>
          <p style="color:var(--color-gray-500);">${total === 0 ? 'Cria uma conta de prestador para seres o primeiro!' : 'Tenta ajustar os filtros de pesquisa'}</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = providers.map(p => this.cardHTML(p)).join('');
    grid.querySelectorAll('.provider-card').forEach(card => {
      card.addEventListener('click', () => {
        // Full profile requires a logged-in account
        if (!Auth.isLoggedIn()) {
          Toast.info('Cria uma conta gratuita ou inicia sessão para ver o perfil completo.');
          Modal.open('loginModal');
          return;
        }
        const id = card.getAttribute('data-id');
        window.location.href = `perfil-prestador.html?id=${id}`;
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') card.click();
      });
    });
    ScrollReveal.init();
  },

  cardHTML(p) {
    const stars = Reviews.renderStars(p.rating);
    const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const availBadge = p.available
      ? '<span class="provider-badge provider-badge--available"><i class="fas fa-circle"></i> Disponível</span>'
      : '<span class="provider-badge provider-badge--busy"><i class="fas fa-circle"></i> Ocupado</span>';
    const verifiedBadge = p.verified
      ? '<span style="display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .6rem;background:rgba(42,157,143,.1);border:1px solid rgba(42,157,143,.3);border-radius:50px;font-size:.7rem;font-weight:700;color:var(--color-accent);margin-bottom:.4rem;"><i class="fas fa-check-circle"></i> Verificado</span>'
      : '';

    return `
      <article class="provider-card reveal" data-id="${esc(p.id)}" role="button" tabindex="0" aria-label="Ver perfil de ${esc(p.name)}">
        <div class="provider-card__header">
          <div class="provider-avatar">${p.avatar ? `<img src="${esc(p.avatar)}" alt="${esc(p.name)}">` : `<span>${initials}</span>`}</div>
          ${availBadge}
        </div>
        <div class="provider-card__body">
          ${verifiedBadge ? `<div>${verifiedBadge}</div>` : ''}
          <h3>${esc(p.name)}</h3>
          <p class="provider-category"><i class="fas fa-tag"></i> ${esc(this.categoryLabel(p.category))}</p>
          <p class="provider-location"><i class="fas fa-map-marker-alt"></i> ${esc(this.locationLabel(p.location))}</p>
          <div class="provider-rating">
            <span class="stars">${stars}</span>
            <span class="rating-value">${esc(String(p.rating))}</span>
            <span class="rating-count">(${esc(String(p.reviews))})</span>
          </div>
          <p class="provider-bio">${esc((p.bio || '').substring(0, 90))}…</p>
        </div>
        <div class="provider-card__footer">
          <span class="provider-price">Desde <strong>AOA ${(Number(p.price) || 0).toLocaleString('pt-AO')}</strong></span>
          <button class="btn btn--primary btn--sm">Ver Perfil</button>
        </div>
      </article>
    `;
  },

  categoryLabel(cat) {
    const map = {
      canalizacao: 'Canalizador', eletricidade: 'Electricista', pintura: 'Pintor',
      limpeza: 'Limpeza', mecanica: 'Mecânico', fotografia: 'Fotógrafo',
      jardinagem: 'Jardineiro', design: 'Designer', carpintaria: 'Carpinteiro',
      informatica: 'Informático', seguranca: 'Segurança', chef: 'Chef',
    };
    return map[cat] || cat;
  },

  locationLabel(loc) {
    const map = {
      luanda: 'Luanda', benguela: 'Benguela', lubango: 'Lubango',
      huambo: 'Huambo', cabinda: 'Cabinda', malanje: 'Malanje',
    };
    return map[loc] || loc;
  },

  applySort(sort) {
    const grid = document.querySelector('.providers-grid');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.provider-card'));
    cards.sort((a, b) => {
      const pA = Providers.getById(a.getAttribute('data-id'));
      const pB = Providers.getById(b.getAttribute('data-id'));
      if (!pA || !pB) return 0;
      if (sort === 'rating') return pB.rating - pA.rating;
      if (sort === 'price_asc') return pA.price - pB.price;
      if (sort === 'price_desc') return pB.price - pA.price;
      if (sort === 'reviews') return pB.reviews - pA.reviews;
      return 0;
    });
    cards.forEach(card => grid.appendChild(card));
  },
};

/* ============================================
   PROVIDER PROFILE PAGE
============================================ */
const ProfilePage = {
  _current: null,
  _editingReviewId: null, // id of the review currently being edited (null = create mode)

  async init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    if (!document.querySelector('.profile-page')) return;

    if (!window.firebaseDb) {
      Toast.error('Serviço indisponível. Tenta novamente.');
      return;
    }

    try {
      const doc = await window.firebaseDb.collection('providers').doc(id).get();
      if (!doc.exists || doc.data().type !== 'provider') throw new Error('not-found');
      const d = doc.data();
      const provider = {
        id: doc.id,
        uid: doc.id,
        name: d.name || 'Prestador',
        category: d.category || 'outro',
        location: d.location || '',
        rating: Number(d.rating) || 0,
        reviews: Number(d.reviews) || 0,
        price: Number(d.price) || 0,
        bio: d.bio || 'Prestador de serviços no Conecta Já.',
        phone: d.phone || '',
        avatar: d.photoURL || null,
        verified: d.verified || false,
        available: d.availability !== false,
        portfolio: Array.isArray(d.portfolio) ? d.portfolio : [],
        instagram: d.instagram || '',
        facebook: d.facebook || '',
        x: d.x || '',
      };
      this._current = provider;
      this.render(provider);
      this.renderReviews(provider);
      this.renderPortfolio(provider);
      // bindActions and bindReviewForm depend on auth state — wait for Firebase to resolve
      Auth.onReady(() => {
        this.bindActions(provider);
        this.bindReviewForm(provider);
      });
    } catch (e) {
      console.error('ProfilePage error:', e);
      Toast.error('Prestador não encontrado.');
      setTimeout(() => window.location.href = 'prestadores.html', 1500);
    }
  },

  render(p) {
    document.title = `${p.name} — Conecta Já`;
    const fields = {
      'profile-name': p.name,
      'profile-category': PrestadoresPage.categoryLabel(p.category),
      'profile-location': PrestadoresPage.locationLabel(p.location),
      'profile-bio': p.bio,
      'profile-price': `AOA ${p.price.toLocaleString('pt-AO')}`,
      'profile-reviews-count': `${p.reviews} avaliações`,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    const ratingEl = document.getElementById('profile-rating');
    if (ratingEl) ratingEl.innerHTML = Reviews.renderStars(p.rating) + ` <strong>${p.rating}</strong>`;

    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) {
      const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      if (p.avatar) {
        const img = document.createElement('img');
        img.src = p.avatar;
        img.alt = p.name;
        img.addEventListener('error', () => { avatarEl.innerHTML = `<span>${initials}</span>`; });
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
      } else {
        avatarEl.innerHTML = `<span>${initials}</span>`;
      }
    }

    const availEl = document.getElementById('profile-availability');
    if (availEl) {
      availEl.className = `availability-badge ${p.available ? 'available' : 'busy'}`;
      availEl.innerHTML = `<i class="fas fa-circle"></i> ${p.available ? 'Disponível' : 'Ocupado'}`;
    }

    const socialEl = document.getElementById('profile-social');
    if (socialEl) {
      const links = [];
      const escAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const toUrl = (val, base) => {
        if (!val) return null;
        const t = val.trim();
        if (t.startsWith('https://') || t.startsWith('http://')) return escAttr(t);
        const handle = encodeURIComponent(t.replace(/^@/, ''));
        return `${base}${handle}`;
      };
      const ig = toUrl(p.instagram, 'https://instagram.com/');
      const fb = toUrl(p.facebook, 'https://facebook.com/');
      const xv = toUrl(p.x, 'https://x.com/');
      if (ig) links.push(`<a href="${ig}" target="_blank" rel="noopener" class="social-link social-link--ig"><i class="fab fa-instagram"></i></a>`);
      if (fb) links.push(`<a href="${fb}" target="_blank" rel="noopener" class="social-link social-link--fb"><i class="fab fa-facebook"></i></a>`);
      if (xv) links.push(`<a href="${xv}" target="_blank" rel="noopener" class="social-link social-link--x"><i class="fab fa-x-twitter"></i></a>`);
      socialEl.style.display = links.length ? 'flex' : 'none';
      socialEl.innerHTML = links.join('');
      const socialCard = document.getElementById('profile-social-card');
      if (socialCard) socialCard.style.display = links.length ? '' : 'none';
    }
  },

  bindActions(p) {
    // If user is not logged in, replace contact buttons with a login gate overlay
    if (!Auth.isLoggedIn()) {
      const contactWrap = document.getElementById('profile-contact-actions');
      if (contactWrap) {
        contactWrap.innerHTML = `
          <div style="text-align:center;padding:1.5rem;background:var(--color-gray-50);border-radius:1.25rem;border:2px dashed var(--color-gray-200);">
            <i class="fas fa-lock" style="font-size:1.8rem;color:var(--color-primary);margin-bottom:.75rem;display:block;"></i>
            <p style="font-weight:700;color:var(--color-gray-800);margin-bottom:.4rem;">Contacto disponível após login</p>
            <p style="font-size:.85rem;color:var(--color-gray-500);margin-bottom:1.25rem;">Cria uma conta gratuita para ver o número, enviar mensagem e solicitar serviços.</p>
            <button class="btn btn--primary btn--sm js-open-login"><i class="fas fa-sign-in-alt"></i> Entrar / Registar</button>
          </div>
        `;
        contactWrap.querySelector('.js-open-login')?.addEventListener('click', () => Modal.open('loginModal'));
      }
      return;
    }

    // Owner viewing their own profile — replace actions with an edit shortcut
    if (Auth.currentUser().uid === (p.uid || p.id)) {
      const contactWrap = document.getElementById('profile-contact-actions');
      if (contactWrap) {
        contactWrap.innerHTML = `
          <div style="text-align:center;padding:1.5rem;background:var(--color-gray-50);border-radius:1.25rem;border:2px dashed var(--color-gray-200);">
            <i class="fas fa-user-circle" style="font-size:1.8rem;color:var(--color-primary);margin-bottom:.75rem;display:block;"></i>
            <p style="font-weight:700;color:var(--color-gray-800);margin-bottom:.4rem;">Este é o teu perfil</p>
            <p style="font-size:.85rem;color:var(--color-gray-500);margin-bottom:1.25rem;">Não podes fazer pedidos ao teu próprio perfil.</p>
            <a href="meu-perfil.html" class="btn btn--primary btn--sm"><i class="fas fa-user-edit"></i> Editar Perfil</a>
          </div>
        `;
      }
      return;
    }

    document.getElementById('btn-whatsapp')?.addEventListener('click', () => {
      const msg = encodeURIComponent(`Olá ${p.name}, vi o teu perfil no Conecta Já e gostaria de contratar os teus serviços.`);
      window.open(`https://wa.me/${waPhone(p.phone)}?text=${msg}`, '_blank');
    });

    document.getElementById('btn-call')?.addEventListener('click', () => {
      window.location.href = `tel:${p.phone}`;
    });

    // Disable the request button immediately if there's already an active order
    const btnRequest = document.getElementById('btn-request');
    if (btnRequest && Auth.isLoggedIn()) {
      Orders.hasActiveOrder(Auth.currentUser().uid, p.uid || p.id).then(active => {
        if (active) {
          btnRequest.disabled = true;
          btnRequest.innerHTML = '<i class="fas fa-clock"></i> Pedido já enviado';
          btnRequest.title = 'Já tens um pedido pendente ou aceite com este prestador.';
        }
      });
    }

    btnRequest?.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) {
        Toast.warning('Precisas de fazer login para fazer um pedido.');
        Modal.open('loginModal');
        return;
      }
      const btn = document.getElementById('btn-request');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar…';
      try {
        const order = await Orders.create({
          providerId:   p.uid || p.id,
          providerName: p.name,
          category:     p.category,
        });
        Toast.success(`Pedido ${order.id} enviado! O prestador irá responder em breve.`);
        btn.innerHTML = '<i class="fas fa-clock"></i> Pedido já enviado';
        // button stays disabled — order is now active
      } catch (e) {
        if (e.message === 'duplicate-order') {
          Toast.warning('Já tens um pedido activo com este prestador. Aguarda a resposta.');
          btn.innerHTML = '<i class="fas fa-clock"></i> Pedido já enviado';
          // stays disabled
        } else {
          Toast.error('Erro ao enviar pedido. Tenta novamente.');
          btn.innerHTML = orig;
          btn.disabled = false;
        }
      }
    });
  },

  async renderReviews(p) {
    const container = document.getElementById('reviews-list');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--color-gray-400);text-align:center;padding:2rem;">A carregar avaliações…</p>';
    const reviews = await Reviews.getByProvider(p.id);
    const currentUser = Auth.currentUser();

    if (!reviews.length) {
      container.innerHTML = '<p style="color:var(--color-gray-500);text-align:center;padding:2rem;">Ainda não há avaliações. Sê o primeiro a avaliar!</p>';
      return;
    }

    container.innerHTML = reviews.map(r => {
      const isOwn = currentUser && r.clientId === currentUser.uid;
      return `
        <div class="review-item" id="review-${esc(r.id)}">
          <div class="review-header">
            <strong class="review-author">${esc(r.authorName || 'Utilizador')}</strong>
            <span class="review-stars">${Reviews.renderStars(r.rating)}</span>
            <span class="review-date">${new Date(r.createdAt).toLocaleDateString('pt-AO')}</span>
            ${isOwn ? `
              <div style="margin-left:auto;display:flex;gap:.35rem;">
                <button class="btn btn--ghost btn--sm" data-edit-review="${esc(r.id)}"
                  data-rating="${r.rating}" data-text="${encodeURIComponent(r.text)}"
                  style="font-size:.78rem;padding:.3rem .65rem;">
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn--ghost btn--sm" data-delete-review="${esc(r.id)}"
                  style="font-size:.78rem;padding:.3rem .65rem;color:#EF4444;">
                  <i class="fas fa-trash"></i> Apagar
                </button>
              </div>` : ''}
          </div>
          <p class="review-text">${esc(r.text)}</p>
        </div>
      `;
    }).join('');

    // Bind edit buttons
    container.querySelectorAll('[data-edit-review]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id     = btn.getAttribute('data-edit-review');
        const rating = parseInt(btn.getAttribute('data-rating'));
        const text   = decodeURIComponent(btn.getAttribute('data-text'));
        ProfilePage._startEditReview(id, rating, text);
      });
    });

    // Bind delete buttons
    container.querySelectorAll('[data-delete-review]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Tens a certeza que queres apagar esta avaliação?')) return;
        btn.disabled = true;
        try {
          await Reviews.delete(btn.getAttribute('data-delete-review'), p.id);
          Toast.success('Avaliação apagada.');
          ProfilePage._editingReviewId = null;
          await ProfilePage.bindReviewForm(p);
          await ProfilePage._refreshRating(p);
          await ProfilePage.renderReviews(p);
        } catch (_) {
          Toast.error('Erro ao apagar. Tenta novamente.');
          btn.disabled = false;
        }
      });
    });
  },

  _startEditReview(reviewId, rating, text) {
    this._editingReviewId = reviewId;
    const form = document.getElementById('reviewForm');
    if (!form) return;

    // Pre-select stars
    form.querySelectorAll('[name="rating"]').forEach(r => { r.checked = parseInt(r.value) === rating; });
    // Trigger visual update on star widget
    form.querySelectorAll('.star-btn').forEach((s, i) => s.classList.toggle('active', i < rating));

    // Pre-fill text
    const textArea = form.querySelector('#review_text');
    if (textArea) textArea.value = text;

    // Change button label
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Guardar Alterações';

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    textArea?.focus();
  },

  async _refreshRating(p) {
    try {
      const snap = await window.firebaseDb.collection('providers').doc(p.id).get();
      if (!snap.exists) return;
      const d = snap.data();
      const newRating = Number(d.rating) || 0;
      const newCount  = Number(d.reviews) || 0;
      const ratingEl = document.getElementById('profile-rating');
      if (ratingEl) ratingEl.innerHTML = Reviews.renderStars(newRating) + ` <strong>${newRating}</strong>`;
      const countEl = document.getElementById('profile-reviews-count');
      if (countEl) countEl.textContent = `${newCount} avaliações`;
      this._current = { ...this._current, rating: newRating, reviews: newCount };
    } catch (_) { /* non-critical */ }
  },

  async bindReviewForm(p) {
    const form = document.getElementById('reviewForm');
    if (!form) return;

    // Remove any previous listener by cloning the form
    const freshForm = form.cloneNode(true);
    form.parentNode.replaceChild(freshForm, form);
    const f = document.getElementById('reviewForm');

    // Reset edit state and button label
    this._editingReviewId = null;
    const submitBtn = f.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submeter Avaliação';

    const user = Auth.currentUser();

    // Block own profile
    if (user && user.uid === p.id) {
      f.innerHTML = '<p style="color:var(--color-gray-400);text-align:center;padding:1rem;">Não podes avaliar o teu próprio perfil.</p>';
      return;
    }

    // If already reviewed → show note but keep form hidden (edit comes from the review card)
    if (user) {
      const already = await Reviews.hasReviewed(user.uid, p.id);
      if (already) {
        f.innerHTML = '<p style="color:var(--color-gray-500);text-align:center;padding:1rem;"><i class="fas fa-check-circle" style="color:#22C55E;margin-right:.4rem;"></i>Já avaliaste este prestador — clica em <strong>Editar</strong> na tua avaliação para a alterar.</p>';
        return;
      }
    }

    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        Toast.warning('Precisas de fazer login para deixar uma avaliação.');
        Modal.open('loginModal');
        return;
      }
      const rating = parseInt(f.querySelector('[name="rating"]:checked')?.value) || 0;
      const text   = f.querySelector('#review_text')?.value?.trim();
      if (!rating || !text) {
        Toast.error('Seleciona uma classificação e escreve um comentário.');
        return;
      }
      if (text.length > 500) {
        Toast.error('O comentário não pode ter mais de 500 caracteres.');
        return;
      }
      const btn  = f.querySelector('[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A guardar…';

      try {
        if (this._editingReviewId) {
          // UPDATE existing review
          await Reviews.update(this._editingReviewId, { rating, text, providerId: p.id });
          Toast.success('Avaliação actualizada!');
          this._editingReviewId = null;
        } else {
          // CREATE new review
          await Reviews.add({
            providerId:  p.id,
            clientId:    Auth.currentUser().uid,
            authorName:  Auth.currentUser().name,
            rating,
            text,
          });
          Toast.success('Avaliação submetida com sucesso!');
        }
        await this._refreshRating(p);
        await this.renderReviews(this._current || p);
        await this.bindReviewForm(p); // re-run to show "já avaliaste" state
      } catch (err) {
        if (err.message === 'duplicate') {
          Toast.warning('Já deixaste uma avaliação para este prestador.');
          await this.bindReviewForm(p);
        } else if (err.message === 'self-review') {
          Toast.error('Não podes avaliar o teu próprio perfil.');
        } else if (err.message === 'text-too-long') {
          Toast.error('O comentário não pode ter mais de 500 caracteres.');
        } else {
          console.error('Review submit error:', err);
          Toast.error('Erro ao guardar. Tenta novamente.');
        }
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    });
  },

  renderPortfolio(p) {
    const container = document.getElementById('portfolio-grid');
    if (!container) return;
    const images = (p.portfolio || []).filter(u => u && u.trim());
    if (!images.length) {
      container.innerHTML = '<p style="color:var(--color-gray-400);text-align:center;grid-column:1/-1;padding:1.5rem 0;font-size:.9rem;">Este prestador ainda não adicionou fotos do seu trabalho.</p>';
      return;
    }
    container.innerHTML = '';
    images.forEach((url, i) => {
      const item = document.createElement('div');
      item.className = 'portfolio-item';
      item.title = 'Clica para ampliar';
      const img = document.createElement('img');
      img.src = url;
      img.alt = `Trabalho ${i + 1}`;
      img.loading = 'lazy';
      img.addEventListener('error', () => { item.style.display = 'none'; });
      item.appendChild(img);
      item.addEventListener('click', () => this._openLightbox(images, i));
      container.appendChild(item);
    });
  },

  _openLightbox(images, startIndex) {
    let current = startIndex;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <button class="lightbox__close" aria-label="Fechar"><i class="fas fa-times"></i></button>
      <button class="lightbox__prev" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
      <div class="lightbox__img-wrap"><img class="lightbox__img" src="" alt=""></div>
      <button class="lightbox__next" aria-label="Próximo"><i class="fas fa-chevron-right"></i></button>
      <div class="lightbox__counter"></div>
    `;
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    const imgEl      = lb.querySelector('.lightbox__img');
    const counter    = lb.querySelector('.lightbox__counter');
    const prevBtn    = lb.querySelector('.lightbox__prev');
    const nextBtn    = lb.querySelector('.lightbox__next');

    const show = idx => {
      current = (idx + images.length) % images.length;
      imgEl.src = images[current];
      imgEl.alt = `Trabalho ${current + 1}`;
      counter.textContent = `${current + 1} / ${images.length}`;
      prevBtn.style.display = images.length < 2 ? 'none' : '';
      nextBtn.style.display = images.length < 2 ? 'none' : '';
    };

    const close = () => {
      lb.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };

    const onKey = e => {
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   show(current - 1);
      if (e.key === 'ArrowRight')  show(current + 1);
    };

    lb.querySelector('.lightbox__backdrop').addEventListener('click', close);
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => { lb.classList.add('lightbox--open'); show(current); });
  },
};

/* ============================================
   DASHBOARD CLIENT — Firestore
============================================ */
const DashboardClient = {
  init() {
    if (!document.querySelector('.dashboard-client')) return;
    Auth.onReady(user => {
      if (!user) return;
      this.renderWelcome(user);
      this.renderOrders(user);
    });
  },

  renderWelcome(user) {
    const el = document.getElementById('dashboard-welcome');
    if (el) el.textContent = `Bem-vindo, ${user.name}!`;

    const initial = (user.name || 'U').charAt(0).toUpperCase();

    // Populate sidebar immediately
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) sidebarName.textContent = user.name;

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;

    // Upgrade to profile photo if available
    if (window.firebaseDb) {
      window.firebaseDb.collection('providers').doc(user.uid).get().then(doc => {
        if (!doc.exists) return;
        const photo = doc.data().photoURL || '';
        if (!photo) return;
        if (sidebarAvatar) sidebarAvatar.innerHTML = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" alt="">`;
      }).catch(() => {});
    }
  },

  renderOrders(user) {
    const container = document.getElementById('my-orders');
    if (!container || !window.firebaseDb) return;
    container.innerHTML = '<p style="color:var(--color-gray-400);">A carregar pedidos…</p>';

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const statuses = Orders.getStatuses();
    let isFirst = true;
    const seen = {}; // orderId → status

    const unsub = window.firebaseDb
      .collection('orders')
      .where('clientId', '==', user.uid)
      .onSnapshot(snap => {
        const orders = snap.docs
          .map(doc => Orders._fromDoc(doc))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (!isFirst) {
          orders.forEach(o => {
            const prev = seen[o.id];
            if (prev && prev !== o.status) {
              // Status changed — notify client
              const msgs = {
                accepted:  `O teu pedido foi aceite por ${o.providerName || 'o prestador'}! Aguarda o contacto.`,
                cancelled: `O teu pedido foi recusado por ${o.providerName || 'o prestador'}.`,
                completed: `O teu pedido com ${o.providerName || 'o prestador'} foi marcado como concluído.`,
              };
              if (msgs[o.status]) {
                Toast[o.status === 'cancelled' ? 'warning' : 'success'](msgs[o.status]);
                Notifications.add('Actualização de pedido', msgs[o.status], o.status === 'cancelled' ? 'warning' : 'success');
              }
            }
          });
        }

        orders.forEach(o => { seen[o.id] = o.status; });
        isFirst = false;

        set('stat-total-orders',     orders.length);
        set('stat-completed-orders', orders.filter(o => o.status === 'completed').length);
        set('stat-pending-orders',   orders.filter(o => o.status === 'pending').length);

        if (!orders.length) {
          container.innerHTML = '<p style="color:var(--color-gray-500);">Ainda não fizeste nenhum pedido. <a href="prestadores.html">Encontra um prestador</a>!</p>';
          return;
        }
        container.innerHTML = orders.map(o => `
          <div class="order-item order-item--${esc(o.status)}">
            <div class="order-item__header">
              <span class="order-id">#${esc(o.id)}</span>
              <span class="order-status order-status--${esc(o.status)}">${esc(statuses[o.status] || o.status)}</span>
            </div>
            <p><strong>Prestador:</strong> ${esc(o.providerName || '—')}</p>
            <p><strong>Serviço:</strong> ${esc(PrestadoresPage.categoryLabel(o.category))}</p>
            <p class="order-date">${new Date(o.createdAt).toLocaleDateString('pt-AO')}</p>
          </div>
        `).join('');
      }, () => {
        container.innerHTML = '<p style="color:var(--color-gray-400);">Erro ao carregar pedidos.</p>';
      });

    window.addEventListener('pagehide', unsub, { once: true });
  },
};

/* ============================================
   DASHBOARD PROVIDER — Firestore
============================================ */
const DashboardProvider = {
  _ordersCache: {}, // keyed by order.id — used by showClientProfile

  init() {
    if (!document.querySelector('.dashboard-provider')) return;
    Auth.onReady(user => {
      if (!user) return;
      this.renderWelcome(user);
      this.renderIncomingOrders(user);
      this.renderStats(user);
    });
  },

  renderWelcome(user) {
    const el = document.getElementById('dashboard-welcome');
    if (el) el.textContent = `Painel do Prestador — ${user.name}`;

    const initial = (user.name || 'P').charAt(0).toUpperCase();

    // Populate sidebar user card immediately with auth data
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) sidebarName.textContent = user.name;

    const profileQuickName = document.getElementById('profileQuickName');
    if (profileQuickName) profileQuickName.textContent = user.name;

    // Set initials now; upgrade to photo below if available
    ['sidebarAvatar', 'profileQuickAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initial;
    });

    // Fetch profile photo from Firestore and upgrade avatars
    if (window.firebaseDb) {
      window.firebaseDb.collection('providers').doc(user.uid).get().then(doc => {
        if (!doc.exists) return;
        const photo = doc.data().photoURL || '';
        if (!photo) return;
        const imgHTML = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" alt="">`;
        ['sidebarAvatar', 'profileQuickAvatar'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = imgHTML;
        });
      }).catch(() => {});
    }
  },

  renderIncomingOrders(user) {
    const container = document.getElementById('incoming-orders');
    if (!container || !window.firebaseDb) return;
    container.innerHTML = '<p style="color:var(--color-gray-400);">A carregar pedidos…</p>';

    const statuses = Orders.getStatuses();
    let isFirst = true;
    const seen = {}; // orderId → status

    const unsub = window.firebaseDb
      .collection('orders')
      .where('providerId', '==', user.uid)
      .onSnapshot(snap => {
        const orders = snap.docs
          .map(doc => Orders._fromDoc(doc))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (!isFirst) {
          orders.forEach(o => {
            if (!(o.id in seen) && o.status === 'pending') {
              // Brand new order
              Toast.success(`Novo pedido de ${o.clientName || 'um cliente'}!`);
              Notifications.add('Novo pedido recebido', `${o.clientName || 'Um cliente'} quer contratar os teus serviços.`, 'success');
            }
          });
        }

        orders.forEach(o => { seen[o.id] = o.status; });
        isFirst = false;

        // Cache for showClientProfile
        orders.forEach(o => { DashboardProvider._ordersCache[o.id] = o; });

        if (!orders.length) {
          container.innerHTML = '<p style="color:var(--color-gray-500);">Ainda não recebeste pedidos.</p>';
          return;
        }

        container.innerHTML = orders.map(o => `
          <div class="order-item order-item--${esc(o.status)}" id="order-${esc(o.id)}">
            <div class="order-item__header">
              <span class="order-id">#${esc(o.id)}</span>
              <span class="order-status order-status--${esc(o.status)}">${esc(statuses[o.status] || o.status)}</span>
            </div>
            <p><strong>Cliente:</strong> ${esc(o.clientName || '—')}</p>
            <p><strong>Serviço:</strong> ${esc(PrestadoresPage.categoryLabel(o.category))}</p>
            <p class="order-date">${new Date(o.createdAt).toLocaleDateString('pt-AO')}</p>
            <div class="order-actions" style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap;">
              ${o.status === 'pending' ? `
                <button class="btn btn--primary btn--sm" data-action="accept" data-order="${esc(o.id)}">
                  <i class="fas fa-check"></i> Aceitar
                </button>
                <button class="btn btn--outline btn--sm" data-action="cancel" data-order="${esc(o.id)}">
                  <i class="fas fa-times"></i> Recusar
                </button>
              ` : ''}
              <button class="btn btn--ghost btn--sm" data-action="view-client"
                data-order="${esc(o.id)}"
                data-order-status="${esc(o.status)}">
                <i class="fas fa-user-circle"></i> Ver Cliente
              </button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('[data-action]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id     = btn.getAttribute('data-order');
            const action = btn.getAttribute('data-action');

            if (action === 'view-client') {
              const fullOrder = DashboardProvider._ordersCache[id] || { id, status: btn.getAttribute('data-order-status') };
              await DashboardProvider.showClientProfile(fullOrder);
              return;
            }

            btn.disabled = true;
            const newStatus = action === 'accept' ? 'accepted' : 'cancelled';
            await Orders.updateStatus(id, newStatus);
            Toast[action === 'accept' ? 'success' : 'info'](
              action === 'accept' ? 'Pedido aceite! Podes agora contactar o cliente.' : 'Pedido recusado.'
            );
            // onSnapshot re-renders automatically — no manual reload needed
            this.renderStats(user);
          });
        });
      }, () => {
        container.innerHTML = '<p style="color:var(--color-gray-400);">Erro ao carregar pedidos.</p>';
      });

    window.addEventListener('pagehide', unsub, { once: true });
  },

  async showClientProfile(order) {
    const modal   = document.getElementById('clientProfileModal');
    const content = document.getElementById('clientProfileContent');
    if (!modal || !content) return;

    // Show modal with loading state
    content.innerHTML = '<div style="text-align:center;padding:3rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--color-primary);"></i></div>';
    modal.style.display = 'flex';

    // Start with data already embedded in the order (always accessible by provider)
    let c = {
      name:     order.clientName     || 'Cliente',
      phone:    order.clientPhone    || '',
      location: order.clientLocation || '',
      photoURL: order.clientPhotoURL || null,
    };

    // Also try a live Firestore fetch to pick up the most recent profile data
    // (works when Firestore rules allow authenticated read of all providers)
    try {
      if (order.clientId && window.firebaseDb) {
        const doc = await window.firebaseDb.collection('providers').doc(order.clientId).get();
        if (doc.exists) {
          const d = doc.data();
          // Merge: prefer live data, keep order-embedded as fallback
          c.name     = d.name     || c.name;
          c.phone    = d.phone    || c.phone;
          c.location = d.location || c.location;
          c.photoURL = d.photoURL || c.photoURL;
        }
      }
    } catch (_) { /* rules may restrict cross-user read — order data already used above */ }

    const initial     = (c.name || 'C').charAt(0).toUpperCase();
    const canContact  = order.status === 'accepted';
    const avatarHTML  = c.photoURL
      ? `<img src="${esc(c.photoURL)}" style="width:100%;height:100%;object-fit:cover;border-radius:calc(1.25rem - 4px);" alt="">`
      : esc(initial);

    content.innerHTML = `
      <div style="text-align:center;padding:2rem 1.5rem 1rem;">
        <div style="width:76px;height:76px;border-radius:1.25rem;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:900;color:white;margin:0 auto 1rem;overflow:hidden;border:4px solid rgba(230,57,70,.15);">${avatarHTML}</div>
        <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:.3rem;">${esc(c.name)}</h3>
        <span style="display:inline-block;background:rgba(230,57,70,.1);color:var(--color-primary);padding:.2rem .75rem;border-radius:50px;font-size:.75rem;font-weight:700;">Cliente</span>
      </div>

      ${c.location ? `
      <div style="margin:0 1.5rem;padding:.875rem 1rem;background:var(--color-gray-50);border-radius:1rem;display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
        <div style="width:34px;height:34px;border-radius:.625rem;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas fa-map-marker-alt" style="color:white;font-size:.85rem;"></i>
        </div>
        <div>
          <div style="font-size:.7rem;font-weight:700;color:var(--color-gray-400);text-transform:uppercase;letter-spacing:.05em;">Localização</div>
          <div style="font-size:.9rem;font-weight:700;color:var(--color-gray-800);">${esc(c.location)}</div>
        </div>
      </div>` : ''}

      <div style="padding:.25rem 1.5rem 1.75rem;">
        ${canContact ? (
          c.phone ? `
            <div style="display:flex;flex-direction:column;gap:.75rem;">
              <a href="https://wa.me/${waPhone(c.phone)}" target="_blank" rel="noopener"
                style="display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.875rem;background:#25D366;color:white;border-radius:1rem;font-weight:700;text-decoration:none;font-size:.95rem;">
                <i class="fab fa-whatsapp" style="font-size:1.2rem;"></i> Contactar no WhatsApp
              </a>
              <a href="tel:${c.phone}"
                style="display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.875rem;border:2px solid var(--color-gray-200);border-radius:1rem;font-weight:700;text-decoration:none;color:var(--color-gray-800);font-size:.95rem;">
                <i class="fas fa-phone" style="color:var(--color-primary);"></i> Ligar — ${c.phone}
              </a>
            </div>
          ` : `
            <div style="text-align:center;padding:1.25rem;background:var(--color-gray-50);border-radius:1rem;">
              <i class="fas fa-phone-slash" style="font-size:1.5rem;color:var(--color-gray-400);margin-bottom:.5rem;display:block;"></i>
              <p style="color:var(--color-gray-500);font-size:.9rem;">Este cliente não adicionou contacto ao perfil.</p>
            </div>
          `
        ) : `
          <div style="text-align:center;padding:1.25rem;background:rgba(245,158,11,.07);border-radius:1rem;border:1px solid rgba(245,158,11,.25);">
            <i class="fas fa-lock" style="font-size:1.6rem;color:#d97706;margin-bottom:.6rem;display:block;"></i>
            <p style="font-weight:700;color:#92400e;margin-bottom:.3rem;">Aceita o pedido para contactar</p>
            <p style="font-size:.82rem;color:#b45309;line-height:1.5;">Ao aceitares o pedido, o número de telefone e WhatsApp de <strong>${c.name}</strong> ficam disponíveis aqui.</p>
          </div>
        `}
      </div>
    `;
  },

  async renderStats(user) {
    const [all, reviews] = await Promise.all([
      Orders.getByUser(user.uid),
      Reviews.getByProvider(user.uid),
    ]);
    const orders = all.filter(o => o.providerId === user.uid);
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '—';
    const statMap = {
      'stat-total':     orders.length,
      'stat-pending':   orders.filter(o => o.status === 'pending').length,
      'stat-completed': orders.filter(o => o.status === 'completed').length,
      'stat-rating':    avg,
      'stat-reviews':   reviews.length,
      'profile-stat-reviews': reviews.length,
      'profile-stat-rating':  avg,
    };
    Object.entries(statMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  },
};

/* ============================================
   FAQ PAGE
============================================ */
const FAQPage = {
  init() {
    if (!document.querySelector('.faq-page')) return;
    this.bindTabs();
    this.bindAccordions();
    this.bindSearch();
  },

  bindTabs() {
    const tabs = document.querySelectorAll('.faq-tab');
    const panels = document.querySelectorAll('.faq-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.hidden = true);
        tab.classList.add('active');
        const target = document.getElementById(tab.getAttribute('data-tab'));
        if (target) target.hidden = false;
      });
    });
  },

  bindAccordions() {
    document.querySelectorAll('.accordion__trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion__item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.accordion__item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
        trigger.setAttribute('aria-expanded', !isOpen);
      });
    });
  },

  bindSearch() {
    const input = document.querySelector('.faq-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('.accordion__item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  },
};

/* ============================================
   CONTACT PAGE — EMAILJS
============================================ */
const ContactPage = {
  SERVICE_ID: 'service_2f51on2',
  TEMPLATE_ID: 'template_pdb3w0e',
  PUBLIC_KEY: 'pUgYpCHZclYlVn4Pi',

  init() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    if (typeof emailjs !== 'undefined') {
      emailjs.init(this.PUBLIC_KEY);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      this.handleSubmit(form);
    });
  },

  async handleSubmit(form) {
    const btn = form.querySelector('[type="submit"]');
    const name = form.querySelector('#contact_name')?.value?.trim();
    const email = form.querySelector('#contact_email')?.value?.trim();
    const subject = form.querySelector('#contact_subject')?.value?.trim();
    const message = form.querySelector('#contact_message')?.value?.trim();

    if (!name || !email || !message) {
      Toast.error('Por favor preenche todos os campos obrigatórios.');
      return;
    }
    if (!Validate.email(email)) {
      Toast.error('Por favor insere um email válido.');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar…';

    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(this.SERVICE_ID, this.TEMPLATE_ID, {
          from_name: name,
          from_email: email,
          subject: subject || 'Contacto via site',
          message,
        });
        Toast.success('Mensagem enviada com sucesso! Respondemos em breve.');
        form.reset();
      } else {
        throw new Error('EmailJS not loaded');
      }
    } catch (err) {
      const waMsg = encodeURIComponent(`Olá, sou ${name} (${email}).\n\n${message}`);
      Toast.warning('Falha no envio por email. A redirecionar para WhatsApp…');
      setTimeout(() => window.open(`https://wa.me/244931482577?text=${waMsg}`, '_blank'), 1500);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
    }
  },
};

/* ============================================
   BLOG PAGE
============================================ */
const BlogPage = {
  init() {
    if (!document.querySelector('.blog-page, .blog-grid')) return;
    this.bindCategoryFilter();
    this.bindSearch();
  },

  bindCategoryFilter() {
    document.querySelectorAll('.blog-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        document.querySelectorAll('.blog-card').forEach(card => {
          card.style.display = (cat === 'all' || card.getAttribute('data-category') === cat) ? '' : 'none';
        });
      });
    });
  },

  bindSearch() {
    const input = document.querySelector('.blog-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('.blog-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  },
};

/* ============================================
   CHOICE MODAL
============================================ */
const ChoiceModal = {
  init() {
    document.querySelectorAll('[data-open-choice]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        // If user is already logged in, the onclick set by updateAuthDisplay handles the redirect
        if (App.state.user) return;
        Modal.open('choiceModal');
      });
    });

    document.getElementById('choice-client')?.addEventListener('click', () => {
      Modal.close('choiceModal');
      Modal.open('loginModal');
    });

    document.getElementById('choice-provider')?.addEventListener('click', () => {
      Modal.close('choiceModal');
      Modal.open('prestadorInfoModal');
    });
  },
};

/* ============================================
   STAR RATING WIDGET
============================================ */
const RatingWidget = {
  init() {
    document.querySelectorAll('.rating-input').forEach(container => {
      const stars = container.querySelectorAll('.star-btn');
      const input = container.querySelector('input[type="hidden"]');
      stars.forEach((star, i) => {
        star.addEventListener('click', () => {
          if (input) input.value = i + 1;
          stars.forEach((s, j) => s.classList.toggle('active', j <= i));
        });
        star.addEventListener('mouseover', () => {
          stars.forEach((s, j) => s.classList.toggle('hover', j <= i));
        });
      });
      container.addEventListener('mouseleave', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });
    });
  },
};

/* ============================================
   LAZY IMAGE LOADING
============================================ */
const LazyImages = {
  init() {
    const imgs = document.querySelectorAll('img[data-src]');
    if (!imgs.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    imgs.forEach(img => observer.observe(img));
  },
};

/* ============================================
   COOKIE BANNER
============================================ */
const CookieBanner = {
  init() {
    if (localStorage.getItem('cj_cookies_accepted')) return;
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    setTimeout(() => banner.classList.add('show'), 2000);
    banner.querySelector('#acceptCookies')?.addEventListener('click', () => {
      localStorage.setItem('cj_cookies_accepted', '1');
      banner.classList.remove('show');
    });
    banner.querySelector('#declineCookies')?.addEventListener('click', () => {
      banner.classList.remove('show');
    });
  },
};

/* ============================================
   SMOOTH ANCHOR SCROLL
============================================ */
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('.navbar')?.offsetHeight || 80;
          const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  },
};

/* ============================================
   AUTH MODALS — injected into every page
============================================ */
const AuthModals = {
  inject() {
    ['loginModal','registerModal'].forEach(id => document.getElementById(id)?.remove());

    document.body.insertAdjacentHTML('beforeend', `
<!-- LOGIN MODAL -->
<div class="modal" id="loginModal" role="dialog" aria-modal="true">
  <div class="modal__overlay"></div>
  <div class="modal__container auth-modal-box">
    <button class="modal__close" aria-label="Fechar"><i class="fas fa-times"></i></button>
    <div class="modal__content auth-modal-content">

      <!-- Passo: email/senha -->
      <div class="auth-step" data-step="email">
        <div class="auth-modal-header">
          <div class="auth-modal-icon"><i class="fas fa-sign-in-alt"></i></div>
          <h2>Iniciar Sessão</h2>
          <p>Bem-vindo de volta ao Conecta Já</p>
        </div>
        <form id="loginForm" novalidate>
          <div class="auth-field">
            <label>Email ou Telefone</label>
            <input id="login_email" type="text" placeholder="Email ou número (+244...)" class="auth-input" required autofocus autocomplete="username">
          </div>
          <div class="auth-field">
            <label style="display:flex;justify-content:space-between">
              Senha
              <a href="#" id="forgotPasswordLink" class="auth-forgot">Esqueci a senha</a>
            </label>
            <div class="auth-input-wrap">
              <input id="login_password" type="password" placeholder="A tua senha" class="auth-input" required>
              <button type="button" class="pw-toggle" tabindex="-1"><i class="fas fa-eye"></i></button>
            </div>
          </div>
          <button type="submit" class="btn btn--primary auth-submit">
            <i class="fas fa-sign-in-alt"></i> Entrar
          </button>
        </form>
        <div class="auth-divider"><span>ou continua com</span></div>
        <div class="auth-social-row">
          <button class="btn-social btn-google" id="loginGoogleBtn" type="button">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.82l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Google
          </button>
          <!-- PHONE_AUTH_DISABLED (Spark plan — descomentar após upgrade para Blaze)
          <button class="btn-social btn-phone" id="loginPhoneBtn" type="button">
            <i class="fas fa-phone"></i> Telefone
          </button>
          -->
        </div>
        <p class="auth-switch">Não tens conta? <a href="#" id="switchToRegisterBtn">Criar conta</a></p>
      </div>

      <!-- Passo: número de telefone -->
      <div class="auth-step" data-step="phone1" style="display:none">
        <div class="auth-modal-header">
          <div class="auth-modal-icon"><i class="fas fa-phone"></i></div>
          <h2>Entrar com Telefone</h2>
          <p>Vamos enviar um código SMS</p>
        </div>
        <div class="auth-field">
          <label>Número de telemóvel</label>
          <div class="auth-input-wrap auth-phone-wrap">
            <span class="auth-prefix">+244</span>
            <input id="phone_number" type="tel" placeholder="9XX XXX XXX" class="auth-input auth-input--prefixed" maxlength="12" inputmode="numeric">
          </div>
          <span class="auth-hint">Ex: +244 923 456 789</span>
        </div>
        <div id="phone-recaptcha"></div>
        <button class="btn btn--primary auth-submit" id="sendCodeBtn" type="button">
          <i class="fas fa-sms"></i> Enviar Código SMS
        </button>
        <button class="btn-auth-back" id="backToEmailBtn" type="button">
          <i class="fas fa-arrow-left"></i> Voltar
        </button>
      </div>

      <!-- Passo: código SMS -->
      <div class="auth-step" data-step="phone2" style="display:none">
        <div class="auth-modal-header">
          <div class="auth-modal-icon"><i class="fas fa-comment-dots"></i></div>
          <h2>Verificar Código</h2>
          <p id="phone-sent-to">Código enviado para o teu número</p>
        </div>
        <div class="auth-field">
          <label>Código de verificação (6 dígitos)</label>
          <input id="phone_code" type="text" placeholder="_ _ _ _ _ _" class="auth-input auth-code-input" maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code">
        </div>
        <button class="btn btn--primary auth-submit" id="confirmCodeBtn" type="button">
          <i class="fas fa-check"></i> Confirmar
        </button>
        <p class="auth-switch" style="margin-top:.75rem">Não recebeste? <a href="#" id="resendCodeBtn">Reenviar código</a></p>
        <button class="btn-auth-back" id="backToPhone1Btn" type="button">
          <i class="fas fa-arrow-left"></i> Voltar
        </button>
      </div>

      <!-- Passo: novo utilizador (Google ou telefone) -->
      <div class="auth-step" data-step="newuser" style="display:none">
        <div class="auth-modal-header">
          <div class="auth-modal-icon"><i class="fas fa-user-circle"></i></div>
          <h2>Quase pronto!</h2>
          <p>Diz-nos como vais usar o Conecta Já</p>
        </div>
        <div class="auth-field" id="newuser-name-field">
          <label>Nome completo</label>
          <input id="newuser_name" type="text" placeholder="O teu nome" class="auth-input">
        </div>
        <p style="font-size:.875rem;font-weight:700;margin-bottom:.75rem;color:var(--color-gray-700)">Sou…</p>
        <div class="reg-type-row">
          <label class="reg-type-label">
            <input type="radio" name="newuser_type" value="client" checked>
            <div class="reg-type-card" data-type="client">
              <i class="fas fa-user"></i><span>Cliente</span>
            </div>
          </label>
          <label class="reg-type-label">
            <input type="radio" name="newuser_type" value="provider">
            <div class="reg-type-card" data-type="provider">
              <i class="fas fa-briefcase"></i><span>Prestador</span>
            </div>
          </label>
        </div>
        <button class="btn btn--primary auth-submit" id="newuserContinueBtn" type="button">
          <i class="fas fa-arrow-right"></i> Continuar
        </button>
      </div>

      <!-- Passo: criar senha (utilizadores de telefone) -->
      <div class="auth-step" data-step="phone-password" style="display:none">
        <div class="auth-modal-header">
          <div class="auth-modal-icon"><i class="fas fa-lock"></i></div>
          <h2>Criar Senha</h2>
          <p>Entra com o teu número + senha, sem precisar de código SMS</p>
        </div>
        <div class="auth-field">
          <label>Senha <span class="auth-hint">(mín. 6 caracteres)</span></label>
          <div class="auth-input-wrap">
            <input id="phonelink_password" type="password" placeholder="Cria uma senha segura" class="auth-input">
            <button type="button" class="pw-toggle" tabindex="-1"><i class="fas fa-eye"></i></button>
          </div>
        </div>
        <button class="btn btn--primary auth-submit" id="phonelinkSaveBtn" type="button">
          <i class="fas fa-save"></i> Guardar Senha
        </button>
        <button class="btn-auth-back" id="phonelinkSkipBtn" type="button">
          Ignorar por agora
        </button>
      </div>

    </div>
  </div>
</div>

<!-- REGISTER MODAL -->
<div class="modal" id="registerModal" role="dialog" aria-modal="true">
  <div class="modal__overlay"></div>
  <div class="modal__container auth-modal-box">
    <button class="modal__close" aria-label="Fechar"><i class="fas fa-times"></i></button>
    <div class="modal__content auth-modal-content">
      <div class="auth-modal-header">
        <div class="auth-modal-icon"><i class="fas fa-user-plus"></i></div>
        <h2>Criar Conta</h2>
        <p>Junta-te à comunidade Conecta Já</p>
      </div>
      <form id="registerForm" novalidate>
        <div class="reg-type-row">
          <label class="reg-type-label">
            <input type="radio" name="user_type" value="client" checked>
            <div class="reg-type-card" data-type="client">
              <i class="fas fa-user"></i><span>Cliente</span>
            </div>
          </label>
          <label class="reg-type-label">
            <input type="radio" name="user_type" value="provider">
            <div class="reg-type-card" data-type="provider">
              <i class="fas fa-briefcase"></i><span>Prestador</span>
            </div>
          </label>
        </div>
        <div class="auth-field">
          <label>Nome completo</label>
          <input id="reg_name" type="text" placeholder="O teu nome" class="auth-input" required>
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input id="reg_email" type="email" placeholder="o.teu@email.com" class="auth-input" required>
        </div>
        <div class="auth-field">
          <label>Senha <span class="auth-hint">(mín. 6 caracteres)</span></label>
          <div class="auth-input-wrap">
            <input id="reg_password" type="password" placeholder="Cria uma senha segura" class="auth-input" required>
            <button type="button" class="pw-toggle" tabindex="-1"><i class="fas fa-eye"></i></button>
          </div>
          <div class="pw-strength-bar"><div id="pwStrengthBar"></div></div>
          <span id="pwStrengthLabel" class="auth-hint"></span>
        </div>
        <button type="submit" class="btn btn--primary auth-submit">
          <i class="fas fa-user-plus"></i> Criar Conta
        </button>
      </form>
      <div class="auth-divider"><span>ou regista-te com</span></div>
      <div class="auth-social-row">
        <button class="btn-social btn-google" id="registerGoogleBtn" type="button" style="flex:1">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.82l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com Google
        </button>
      </div>
      <p class="auth-switch">Já tens conta? <a href="#" id="switchToLoginBtn">Iniciar sessão</a></p>
    </div>
  </div>
</div>`);

    this._bindEvents();
    Auth.bindLoginForm();
    Auth.bindRegisterForm();
  },

  _pendingNewUser: null,

  _showLoginStep(name) {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.querySelectorAll('.auth-step').forEach(s => s.style.display = 'none');
    const target = modal.querySelector(`[data-step="${name}"]`);
    if (target) target.style.display = '';
  },

  _bindEvents() {
    document.getElementById('switchToRegisterBtn')?.addEventListener('click', e => {
      e.preventDefault(); Modal.closeAll(); Modal.open('registerModal');
    });
    document.getElementById('switchToLoginBtn')?.addEventListener('click', e => {
      e.preventDefault(); Modal.closeAll(); Modal.open('loginModal');
    });

    // Reset login modal to email step when reopened
    const origModalOpen = Modal.open.bind(Modal);
    Modal.open = (id) => {
      if (id === 'loginModal') {
        // Guardar página actual para voltar após login
        sessionStorage.setItem('cj-redirect', window.location.pathname.split('/').pop() || 'index.html');
        window.location.href = 'login.html';
        return;
      }
      origModalOpen(id);
    };

    // Password show/hide (delegação — cobre campos adicionados dinamicamente)
    document.addEventListener('click', e => {
      const btn = e.target.closest('.pw-toggle');
      if (!btn) return;
      const inp = btn.closest('.auth-input-wrap')?.querySelector('input');
      if (!inp) return;
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
    });

    // Password strength
    document.getElementById('reg_password')?.addEventListener('input', e => {
      this._strength(e.target.value);
    });

    // Type card selection
    document.querySelectorAll('.reg-type-card').forEach(card => {
      card.closest('label')?.querySelector('input')?.addEventListener('change', () => {
        const group = card.closest('.reg-type-row');
        group?.querySelectorAll('.reg-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
    // Set default selected per form
    document.querySelectorAll('.reg-type-card[data-type="client"]').forEach(c => c.classList.add('selected'));

    // Forgot password
    document.getElementById('forgotPasswordLink')?.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('login_email')?.value?.trim();
      if (!email || !Validate.email(email)) {
        Toast.warning('Insere o teu email para recuperar a senha.');
        document.getElementById('login_email')?.focus();
        return;
      }
      try {
        await window.firebaseAuth.sendPasswordResetEmail(email);
        Toast.success('Email de recuperação enviado! Verifica a caixa de entrada.');
      } catch (err) {
        Toast.error(Auth.errorMsg(err.code));
      }
    });

    // ── Google Sign-In ──────────────────────────────────────────────────
    const handleGoogleLogin = async (btn) => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
      try {
        const { fbUser, type, isNew } = await Auth.loginWithGoogle();
        btn.innerHTML = orig; btn.disabled = false;
        if (isNew) {
          // Google gives us displayName — hide the name field if we have it
          const nameField = document.getElementById('newuser-name-field');
          if (nameField) nameField.style.display = fbUser.displayName ? 'none' : '';
          if (fbUser.displayName) {
            const ni = document.getElementById('newuser_name');
            if (ni) ni.value = fbUser.displayName;
          }
          this._pendingNewUser = { fbUser, source: 'google' };
          Modal.closeAll();
          document.getElementById('loginModal')?.classList.add('active');
          document.body.style.overflow = 'hidden';
          this._showLoginStep('newuser');
        } else {
          Toast.success(`Bem-vindo de volta, ${fbUser.displayName || 'utilizador'}!`);
          Modal.closeAll();
          setTimeout(() => { window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html'; }, 1200);
        }
      } catch (err) {
        btn.innerHTML = orig; btn.disabled = false;
        const msg = Auth.errorMsg(err.code);
        if (msg) Toast.error(msg);
      }
    };

    document.getElementById('loginGoogleBtn')?.addEventListener('click', e => handleGoogleLogin(e.currentTarget));
    document.getElementById('registerGoogleBtn')?.addEventListener('click', e => handleGoogleLogin(e.currentTarget));

    // ── Phone auth — navigation ─────────────────────────────────────────
    document.getElementById('loginPhoneBtn')?.addEventListener('click', () => {
      this._showLoginStep('phone1');
      Auth.initPhoneRecaptcha();
    });
    document.getElementById('backToEmailBtn')?.addEventListener('click', () => this._showLoginStep('email'));
    document.getElementById('backToPhone1Btn')?.addEventListener('click', () => {
      this._showLoginStep('phone1');
      Auth.initPhoneRecaptcha();
    });

    // ── Phone auth — send code ──────────────────────────────────────────
    document.getElementById('sendCodeBtn')?.addEventListener('click', async (e) => {
      let raw = (document.getElementById('phone_number')?.value || '').replace(/\s/g, '');
      if (!raw) { Toast.error('Introduz o número de telefone.'); return; }
      const phone = raw.startsWith('+') ? raw : '+244' + raw;
      if (phone.length < 10) { Toast.error('Número inválido.'); return; }

      const btn = e.currentTarget;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar…';
      btn.disabled = true;
      try {
        await Auth.sendPhoneCode(phone);
        const sentTo = document.getElementById('phone-sent-to');
        if (sentTo) sentTo.textContent = `Código enviado para ${phone}`;
        this._showLoginStep('phone2');
        document.getElementById('phone_code')?.focus();
      } catch (err) {
        Toast.error(Auth.errorMsg(err.code) || 'Erro ao enviar SMS. Verifica o número.');
      }
      btn.innerHTML = orig; btn.disabled = false;
    });

    // ── Phone auth — confirm code ───────────────────────────────────────
    const doConfirm = async (btn) => {
      const code = (document.getElementById('phone_code')?.value || '').trim();
      if (code.length !== 6) { Toast.error('Introduz o código de 6 dígitos.'); return; }

      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A verificar…';
      btn.disabled = true;
      try {
        const cred = await Auth.verifyPhoneCode(code);
        const fbUser = cred.user;

        let type = 'client';
        let isNew = cred.additionalUserInfo?.isNewUser !== false;

        if (window.firebaseDb) {
          const doc = await window.firebaseDb.collection('providers').doc(fbUser.uid).get();
          if (doc.exists && doc.data().type) {
            type = doc.data().type;
            localStorage.setItem('cj_type_' + fbUser.uid, type);
            isNew = false;
          }
        }

        btn.innerHTML = orig; btn.disabled = false;

        if (isNew) {
          const nameField = document.getElementById('newuser-name-field');
          if (nameField) nameField.style.display = '';
          document.getElementById('newuser_name').value = '';
          this._pendingNewUser = { fbUser, source: 'phone' };
          this._showLoginStep('newuser');
        } else {
          Toast.success('Bem-vindo de volta!');
          Modal.closeAll();
          setTimeout(() => { window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html'; }, 1200);
        }
      } catch (err) {
        btn.innerHTML = orig; btn.disabled = false;
        Toast.error(Auth.errorMsg(err.code) || 'Código inválido. Tenta novamente.');
      }
    };

    document.getElementById('confirmCodeBtn')?.addEventListener('click', e => doConfirm(e.currentTarget));
    document.getElementById('phone_code')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doConfirm(document.getElementById('confirmCodeBtn'));
    });

    // ── Phone auth — reenviar ───────────────────────────────────────────
    document.getElementById('resendCodeBtn')?.addEventListener('click', async e => {
      e.preventDefault();
      this._showLoginStep('phone1');
      Toast.info('Volta a introduzir o número para reenviar o código.');
    });

    // ── Novo utilizador (Google/Phone) — continuar ──────────────────────
    document.getElementById('newuserContinueBtn')?.addEventListener('click', async (e) => {
      const pending = this._pendingNewUser;
      if (!pending) return;

      const { fbUser } = pending;
      const nameField = document.getElementById('newuser-name-field');
      const name = nameField?.style.display === 'none'
        ? (fbUser.displayName || 'Utilizador')
        : (document.getElementById('newuser_name')?.value?.trim() || '');

      if (!name) { Toast.error('Introduz o teu nome.'); return; }

      const type = document.querySelector('[name="newuser_type"]:checked')?.value || 'client';

      const btn = e.currentTarget;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar…';
      btn.disabled = true;

      try {
        await Auth._createFirestoreProfile(fbUser, type, name);
        localStorage.setItem('cj_type_' + fbUser.uid, type);
        if (App.state.user) { App.state.user.name = name; App.state.user.type = type; }

        if (pending.source === 'phone') {
          // Phone users: offer to link an email+password before redirecting
          this._pendingNewUser = { fbUser, type, name, source: 'phone' };
          btn.innerHTML = orig; btn.disabled = false;
          this._showLoginStep('phone-password');
        } else {
          this._pendingNewUser = null;
          Toast.success(`Conta criada! Bem-vindo, ${name}!`);
          Modal.closeAll();
          setTimeout(() => { window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html'; }, 1200);
        }
      } catch (err) {
        Toast.error('Erro ao criar perfil. Tenta novamente.');
        btn.innerHTML = orig; btn.disabled = false;
      }
    });

    // ── Phone-password link: guardar ──────────────────────────────────
    document.getElementById('phonelinkSaveBtn')?.addEventListener('click', async (e) => {
      const password = document.getElementById('phonelink_password')?.value || '';
      const pending = this._pendingNewUser;

      if (password.length < 6) { Toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }

      const btn = e.currentTarget;
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A guardar…';
      btn.disabled = true;

      try {
        await Auth.createPhonePassword(password);
        const type = pending?.type || 'client';
        this._pendingNewUser = null;
        Toast.success('Senha criada! Podes entrar com o teu número + senha.');
        Modal.closeAll();
        setTimeout(() => { window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html'; }, 1200);
      } catch (err) {
        btn.innerHTML = orig; btn.disabled = false;
        Toast.error(Auth.errorMsg(err.code) || 'Erro ao criar senha.');
      }
    });

    // ── Phone-password link: ignorar ──────────────────────────────────
    document.getElementById('phonelinkSkipBtn')?.addEventListener('click', () => {
      const type = this._pendingNewUser?.type || 'client';
      this._pendingNewUser = null;
      Modal.closeAll();
      setTimeout(() => { window.location.href = type === 'provider' ? 'dashboard-provider.html' : 'dashboard-client.html'; }, 100);
    });

    // Choice modal buttons → open registerModal with type pre-selected
    document.getElementById('btnSouCliente')?.addEventListener('click', () => {
      Modal.closeAll();
      this._preSelectType('client');
      Modal.open('registerModal');
    });
    document.getElementById('btnSouPrestador')?.addEventListener('click', () => {
      Modal.closeAll();
      this._preSelectType('provider');
      Modal.open('registerModal');
    });
    document.getElementById('btnSouPrestadorCTA')?.addEventListener('click', () => {
      this._preSelectType('provider');
      Modal.open('registerModal');
    });
  },

  _preSelectType(type) {
    const radio = document.querySelector(`[name="user_type"][value="${type}"]`);
    if (radio) radio.checked = true;
    document.querySelectorAll('.reg-type-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.reg-type-card[data-type="${type}"]`)?.classList.add('selected');
  },

  _strength(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const bar = document.getElementById('pwStrengthBar');
    const lbl = document.getElementById('pwStrengthLabel');
    const levels = [
      { w: '0%', c: 'transparent', t: '' },
      { w: '25%', c: '#EF4444', t: 'Muito fraca' },
      { w: '45%', c: '#F97316', t: 'Fraca' },
      { w: '65%', c: '#EAB308', t: 'Média' },
      { w: '85%', c: '#22C55E', t: 'Boa' },
      { w: '100%', c: '#16A34A', t: 'Excelente' },
    ];
    const lvl = levels[score] || levels[0];
    if (bar) { bar.style.width = lvl.w; bar.style.background = lvl.c; }
    if (lbl) { lbl.textContent = lvl.t; lbl.style.color = lvl.c; }
  },
};

/* ============================================
   PROFILE MODULE
============================================ */
const Profile = {
  _key: uid => `cj_profile_${uid}`,

  get(uid) {
    if (!uid) return {};
    try { return JSON.parse(localStorage.getItem(this._key(uid))) || {}; }
    catch { return {}; }
  },

  save(uid, data) {
    const existing = this.get(uid);
    localStorage.setItem(this._key(uid), JSON.stringify({ ...existing, ...data }));
  },

  getCurrent() {
    const u = App.state.user;
    if (!u) return null;
    return { ...u, ...this.get(u.uid) };
  },

  init() {
    if (!document.querySelector('.profile-page')) return;
    // Only run on meu-perfil.html (has .profile-section-card), not on perfil-prestador.html
    if (!document.querySelector('.profile-section-card')) return;
    Auth.onReady(user => {
      if (!user) { window.location.href = 'login.html'; return; }
      this._render(user);
      this._bindForm(user);
      this._bindPasswordForm(user);
      this._bindAvatarUpload(user);
      this._bindPortfolioUpload(user);
    });
  },

  async _compressImage(file) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const max = 1600;
        if (w > max || h > max) {
          if (w > h) { h = Math.round(h * max / w); w = max; }
          else { w = Math.round(w * max / h); h = max; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  },

  _bindPortfolioUpload(user) {
    const grid = document.getElementById('portfolioUploadGrid');
    if (!grid) return;

    const p = this.get(user.uid);
    const portfolio = Array.isArray(p.portfolio) ? p.portfolio.slice(0, 8) : [];
    while (portfolio.length < 8) portfolio.push('');

    const renderSlots = () => {
      grid.innerHTML = portfolio.map((url, i) => `
        <div class="portfolio-slot">
          ${url
            ? `<img src="${url}" alt="Foto ${i + 1}">
               <button type="button" class="portfolio-slot__remove" data-idx="${i}" title="Remover"><i class="fas fa-times"></i></button>`
            : `<i class="fas fa-camera" style="font-size:1.75rem;color:var(--color-gray-300);margin-bottom:.4rem;"></i>
               <span class="portfolio-slot__label">Foto ${i + 1}</span>
               <input type="file" accept="image/*" class="pf-file" data-idx="${i}" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">`}
        </div>`).join('');

      grid.querySelectorAll('.pf-file').forEach(inp => {
        inp.addEventListener('change', async e => {
          const file = e.target.files[0];
          if (!file) return;
          if (file.size > 8 * 1024 * 1024) { Toast.error('Imagem muito grande. Máx. 8MB.'); return; }
          Toast.info('A comprimir imagem…');
          const compressed = await this._compressImage(file);
          if (compressed) { portfolio[parseInt(inp.dataset.idx)] = compressed; renderSlots(); }
        });
      });

      grid.querySelectorAll('.portfolio-slot__remove').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          portfolio[parseInt(btn.dataset.idx)] = '';
          renderSlots();
        });
      });
    };

    renderSlots();

    // Expose portfolio array to form handler via a ref on the grid element
    grid._portfolio = portfolio;
  },

  _render(user) {
    const p = this.get(user.uid);

    // Hero
    const avatarEl = document.getElementById('profileAvatarBig');
    const nameEl = document.getElementById('profileHeroName');
    const badgeEl = document.getElementById('profileTypeBadge');
    if (avatarEl) {
      avatarEl.innerHTML = p.photoURL
        ? `<img src="${p.photoURL}" alt="${user.name}">`
        : `<span>${(user.name || 'U').charAt(0).toUpperCase()}</span>`;
    }
    if (nameEl) nameEl.textContent = user.name || 'Utilizador';
    if (badgeEl) badgeEl.innerHTML = user.type === 'provider'
      ? '<i class="fas fa-briefcase"></i> Prestador de Serviços'
      : '<i class="fas fa-user"></i> Cliente';

    // Sidebar quick info
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarEmail) sidebarEmail.textContent = user.email;

    // Form fields
    // Note: base64 photos are NOT placed in the URL field (they stay as local display only)
    const safePhotoURL = (p.photoURL && !p.photoURL.startsWith('data:')) ? p.photoURL : '';
    const fields = {
      'prof_name': user.name || '',
      'prof_email': user.email || '',
      'prof_phone': p.phone || '',
      'prof_location': p.location || '',
      'prof_bio': p.bio || '',
      'prof_category': p.category || '',
      'prof_price': p.price || '',
      'prof_photo_url': safePhotoURL,
      'prof_instagram': p.instagram || '',
      'prof_facebook': p.facebook || '',
      'prof_x': p.x || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    // Availability toggle
    const avail = document.getElementById('prof_availability');
    if (avail) avail.checked = p.availability !== false;

    // Provider section visibility (service info: category, price, availability)
    const providerSection = document.getElementById('providerSection');
    if (providerSection) providerSection.style.display = user.type === 'provider' ? 'block' : 'none';
    // Provider-only fields (bio + portfolio) — hidden for clients
    const providerOnlyFields = document.getElementById('providerOnlyFields');
    if (providerOnlyFields) providerOnlyFields.style.display = user.type === 'provider' ? 'block' : 'none';
  },

  _bindForm(user) {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A guardar…';
      btn.disabled = true;

      const name = document.getElementById('prof_name')?.value?.trim() || user.name;
      const phone = document.getElementById('prof_phone')?.value?.trim() || '';
      const location = document.getElementById('prof_location')?.value?.trim() || '';
      const bio = document.getElementById('prof_bio')?.value?.trim() || '';
      const category = document.getElementById('prof_category')?.value || '';
      const price = document.getElementById('prof_price')?.value?.trim() || '';
      const photoURL = document.getElementById('prof_photo_url')?.value?.trim() || '';
      const availability = document.getElementById('prof_availability')?.checked !== false;
      const instagram = document.getElementById('prof_instagram')?.value?.trim() || '';
      const facebook = document.getElementById('prof_facebook')?.value?.trim() || '';
      const x = document.getElementById('prof_x')?.value?.trim() || '';

      const limits = [
        [name, 80, 'Nome muito longo (máx. 80 caracteres).'],
        [phone, 20, 'Telefone muito longo (máx. 20 caracteres).'],
        [location, 100, 'Localização muito longa (máx. 100 caracteres).'],
        [bio, 500, 'Biografia muito longa (máx. 500 caracteres).'],
        [price, 30, 'Preço muito longo (máx. 30 caracteres).'],
      ];
      for (const [val, max, msg] of limits) {
        if (val.length > max) {
          Toast.error(msg);
          btn.innerHTML = orig;
          btn.disabled = false;
          return;
        }
      }

      try {
        // Update Firebase displayName if changed
        if (name !== user.name && window.firebaseAuth?.currentUser) {
          await window.firebaseAuth.currentUser.updateProfile({ displayName: name });
          App.state.user.name = name;
        }

        // Update Firebase Auth photoURL only for real HTTP URLs (not base64)
        const existingPhotoURL = this.get(user.uid).photoURL || '';
        const finalPhotoURL = photoURL || existingPhotoURL;
        if (finalPhotoURL && !finalPhotoURL.startsWith('data:') && finalPhotoURL !== existingPhotoURL && window.firebaseAuth?.currentUser) {
          await window.firebaseAuth.currentUser.updateProfile({ photoURL: finalPhotoURL });
        }

        // Read portfolio from the upload grid reference
        const portfolioGrid = document.getElementById('portfolioUploadGrid');
        const portfolio = (portfolioGrid?._portfolio || []).slice(0, 8);

        // Save to localStorage (includes base64 for local display)
        this.save(user.uid, { phone, location, bio, category, price, photoURL: finalPhotoURL, availability, portfolio, instagram, facebook, x });

        // Save to Firestore for ALL users so providers can read client contact info
        if (window.firebaseDb) {
          const firestorePhotoURL = finalPhotoURL || '';
          const firestoreData = {
            uid: user.uid,
            name,
            email: user.email,
            type: user.type,
            phone,
            location: location.toLowerCase(),
            photoURL: firestorePhotoURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          };
          if (user.type === 'provider') {
            const priceNum = parseFloat((price || '').replace(/[^\d,.]/, '').replace(',', '.')) || 0;
            Object.assign(firestoreData, { bio, category, price: priceNum, portfolio, availability, instagram, facebook, x });
          }
          await window.firebaseDb.collection('providers').doc(user.uid).set(firestoreData, { merge: true });
        }

        // Refresh hero
        this._render(App.state.user);
        UI.updateAuthDisplay();

        Toast.success('Perfil guardado com sucesso!');
        const saved = document.getElementById('profileSavedMsg');
        if (saved) { saved.style.display = 'flex'; setTimeout(() => saved.style.display = 'none', 3000); }
      } catch (err) {
        console.error('Profile save error:', err);
        if (err && (err.code === 'permission-denied' || err.message?.includes('PERMISSION_DENIED'))) {
          Toast.error('Sem permissão para guardar. Por favor, volta a fazer login e tenta novamente.');
        } else if (err && err.code === 'unavailable') {
          Toast.error('Sem ligação à internet. Verifica a tua rede e tenta novamente.');
        } else {
          Toast.error('Erro ao guardar o perfil. Tenta novamente.');
        }
      }

      btn.innerHTML = orig;
      btn.disabled = false;
    });
  },

  _bindPasswordForm(user) {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const current = document.getElementById('pw_current')?.value;
      const next = document.getElementById('pw_new')?.value;
      const confirm = document.getElementById('pw_confirm')?.value;

      if (!next || next.length < 6) { Toast.error('A nova senha deve ter pelo menos 6 caracteres.'); return; }
      if (next !== confirm) { Toast.error('As senhas não coincidem.'); return; }

      const btn = form.querySelector('[type="submit"]');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A alterar…';
      btn.disabled = true;

      try {
        const fbUser = window.firebaseAuth?.currentUser;
        if (!fbUser) throw new Error('not-logged');

        // Re-authenticate first
        const credential = firebase.auth.EmailAuthProvider.credential(fbUser.email, current);
        await fbUser.reauthenticateWithCredential(credential);
        await fbUser.updatePassword(next);

        Toast.success('Senha alterada com sucesso!');
        form.reset();
      } catch (err) {
        const msgs = {
          'auth/wrong-password': 'Senha actual incorrecta.',
          'auth/weak-password': 'Nova senha demasiado fraca (mín. 6 caracteres).',
          'auth/requires-recent-login': 'Sessão expirada. Faz logout e login novamente.',
        };
        Toast.error(msgs[err.code] || 'Erro ao alterar senha.');
      }

      btn.innerHTML = orig;
      btn.disabled = false;
    });
  },

  async _compressAvatar(file) {
    // Compress to max 150px at 0.5 quality → tiny base64 (~5-15 KB), safe for Firestore
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const max = 150;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * max / w); w = max; }
        else { w = Math.round(w * max / h); h = max; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  },

  _bindAvatarUpload(user) {
    const input = document.getElementById('avatarFileInput');
    if (!input) return;
    input.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { Toast.error('Selecciona uma imagem válida.'); return; }
      if (file.size > 8 * 1024 * 1024) { Toast.error('A imagem deve ter menos de 8MB.'); return; }

      Toast.info('A processar foto…');
      const compressed = await this._compressAvatar(file);
      if (!compressed) { Toast.error('Erro ao processar imagem.'); return; }

      // Show preview
      const avatarEl = document.getElementById('profileAvatarBig');
      if (avatarEl) avatarEl.innerHTML = `<img src="${compressed}" alt="Foto de perfil">`;

      // Put compressed base64 into the URL field so _bindForm picks it up on save
      const urlInput = document.getElementById('prof_photo_url');
      if (urlInput) urlInput.value = compressed;

      Toast.success('Foto pronta! Clica em "Guardar Alterações" para confirmar.');
    });
  },
};

/* ============================================
   VERIFICATION MODULE
============================================ */
const Verification = {
  async init() {
    const card = document.getElementById('verificationCard');
    if (!card) return;
    Auth.onReady(async user => {
      if (!user || user.type !== 'provider') return;
      card.style.display = 'block';
      await this._render(user);
    });
  },

  async _render(user) {
    const el = document.getElementById('verificationStatus');
    if (!el) return;

    // First check Firestore for verified flag and existing request
    let isVerified = false;
    let req = null;
    if (window.firebaseDb) {
      try {
        const [provDoc, reqDoc] = await Promise.all([
          window.firebaseDb.collection('providers').doc(user.uid).get(),
          window.firebaseDb.collection('verificationRequests').doc(user.uid).get(),
        ]);
        isVerified = provDoc.exists && provDoc.data().verified === true;
        if (reqDoc.exists) req = reqDoc.data();
      } catch (_) {}
    }

    if (isVerified) {
      el.innerHTML = this._htmlVerified();
    } else if (!req) {
      el.innerHTML = this._htmlIntro() + this._htmlForm();
      this._bindForm(user);
    } else if (req.status === 'pending') {
      el.innerHTML = this._htmlPending(req);
    } else if (req.status === 'rejected') {
      el.innerHTML = this._htmlRejected(req.rejectReason) + this._htmlForm();
      this._bindForm(user);
    } else if (req.status === 'approved') {
      el.innerHTML = this._htmlApproved();
    }
  },

  _htmlVerified() {
    return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1.25rem;background:rgba(42,157,143,.06);border:1.5px solid rgba(42,157,143,.2);border-radius:1.25rem;">
        <div style="width:48px;height:48px;border-radius:.875rem;background:linear-gradient(135deg,var(--color-accent),#0d7a6e);display:flex;align-items:center;justify-content:center;color:white;font-size:1.4rem;flex-shrink:0;"><i class="fas fa-check-circle"></i></div>
        <div>
          <div style="font-weight:800;font-size:.95rem;color:var(--color-accent);">Conta Verificada</div>
          <div style="font-size:.82rem;color:var(--color-gray-500);margin-top:.15rem;">O teu perfil tem o Selo Verificado e aparece em destaque nos resultados.</div>
        </div>
      </div>`;
  },

  _htmlPending(req) {
    const date = req?.submittedAt?.toDate ? req.submittedAt.toDate().toLocaleDateString('pt-AO') : '';
    const name = req?.name || '';
    const bi   = req?.biNumber || '';
    const waMsg = encodeURIComponent(
      `Olá! Chamo-me ${name} e submeti um pedido de verificação no Conecta Já${bi ? ` (BI: ${bi})` : ''}. Envio em seguida a foto do meu BI e uma selfie segurando o documento.`
    );
    return `
      <div style="padding:1.25rem;background:rgba(245,158,11,.06);border:1.5px solid rgba(245,158,11,.25);border-radius:1.25rem;margin-bottom:1.25rem;">
        <div style="display:flex;align-items:center;gap:.5rem;font-weight:800;color:#d97706;margin-bottom:.5rem;">
          <i class="fas fa-clock"></i> Em Análise${date ? ` — submetido em ${date}` : ''}
        </div>
        <p style="font-size:.875rem;color:var(--color-gray-600);margin:0;line-height:1.6;">O teu pedido foi recebido. A nossa equipa irá analisá-lo em até 48 horas.</p>
      </div>
      <div style="padding:1.25rem;background:rgba(42,157,143,.04);border:1.5px solid rgba(42,157,143,.2);border-radius:1.25rem;">
        <p style="font-size:.875rem;font-weight:800;color:var(--color-gray-800);margin:0 0 .4rem;">
          <i class="fas fa-exclamation-circle" style="color:var(--color-accent);margin-right:.3rem;"></i> Passo seguinte — obrigatório
        </p>
        <p style="font-size:.83rem;color:var(--color-gray-600);margin:0 0 1rem;line-height:1.65;">
          Para completar a verificação, envia via WhatsApp:<br>
          <strong>1.</strong> Uma foto clara do teu BI ou Passaporte<br>
          <strong>2.</strong> Uma selfie segurando o documento (para confirmar que és tu)
        </p>
        <a href="https://wa.me/244931482577?text=${waMsg}" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:.6rem;padding:.7rem 1.25rem;background:#25D366;color:white;border-radius:.875rem;font-size:.875rem;font-weight:700;text-decoration:none;">
          <i class="fab fa-whatsapp" style="font-size:1.1rem;"></i> Enviar fotos via WhatsApp
        </a>
        <p style="font-size:.75rem;color:var(--color-gray-400);margin:.75rem 0 0;"><i class="fas fa-lock"></i> As fotos são usadas apenas para verificação e nunca são publicadas.</p>
      </div>`;
  },

  _htmlRejected(reason) {
    return `
      <div style="padding:1.25rem;background:rgba(230,57,70,.05);border:1.5px solid rgba(230,57,70,.2);border-radius:1.25rem;margin-bottom:1.5rem;">
        <div style="display:flex;align-items:center;gap:.5rem;font-weight:800;color:var(--color-primary);margin-bottom:.5rem;"><i class="fas fa-times-circle"></i> Pedido Rejeitado</div>
        <p style="font-size:.875rem;color:var(--color-gray-600);margin:0;line-height:1.6;">${esc(reason || 'O teu pedido não foi aprovado. Podes submeter novamente com informações corretas.')}</p>
      </div>`;
  },

  _htmlApproved() {
    return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1.25rem;background:rgba(42,157,143,.06);border:1.5px solid rgba(42,157,143,.2);border-radius:1.25rem;">
        <div style="width:48px;height:48px;border-radius:.875rem;background:linear-gradient(135deg,var(--color-accent),#0d7a6e);display:flex;align-items:center;justify-content:center;color:white;font-size:1.4rem;flex-shrink:0;"><i class="fas fa-check-circle"></i></div>
        <div>
          <div style="font-weight:800;font-size:.95rem;color:var(--color-accent);">Verificação Aprovada</div>
          <div style="font-size:.82rem;color:var(--color-gray-500);margin-top:.15rem;">A verificação foi aprovada. O selo será visível no teu perfil em breve.</div>
        </div>
      </div>`;
  },

  _htmlIntro() {
    return `
      <div style="padding:1.1rem 1.25rem;background:var(--color-gray-50);border:1px solid var(--color-gray-200);border-radius:1.1rem;margin-bottom:1.5rem;">
        <p style="font-size:.875rem;color:var(--color-gray-700);margin:0 0 .4rem;font-weight:700;"><i class="fas fa-info-circle" style="color:var(--color-accent);margin-right:.3rem;"></i> O que é o Selo Verificado?</p>
        <p style="font-size:.83rem;color:var(--color-gray-500);margin:0;line-height:1.6;">Prestadores verificados recebem um badge especial no perfil, aparecem em destaque nos resultados e transmitem mais confiança aos clientes. Para verificar, precisamos do teu número de BI ou Passaporte.</p>
      </div>`;
  },

  _htmlForm() {
    return `
      <form id="verificationForm" novalidate>
        <div class="profile-field" style="margin-bottom:1rem;">
          <label>Número de BI / Passaporte <span style="color:var(--color-primary)">*</span></label>
          <input id="verif_bi" type="text" placeholder="Ex: 000123456LA041" maxlength="30" required style="letter-spacing:.04em;">
          <small style="display:block;margin-top:.3rem;color:var(--color-gray-400);font-size:.77rem;"><i class="fas fa-lock"></i> Confidencial — nunca partilhado publicamente.</small>
        </div>
        <div class="profile-field" style="margin-bottom:1.5rem;">
          <label>Informações adicionais <span style="font-weight:400;color:var(--color-gray-400)">(opcional)</span></label>
          <textarea id="verif_notes" placeholder="Ex: Electricista licenciado com 5 anos de experiência. Tenho certificado do MINEA." maxlength="300" style="min-height:80px;resize:vertical;width:100%;font-size:.9rem;"></textarea>
        </div>
        <button type="submit" class="btn btn--primary" id="verifSubmitBtn">
          <i class="fas fa-paper-plane"></i> Submeter Pedido de Verificação
        </button>
      </form>`;
  },

  _bindForm(user) {
    const form = document.getElementById('verificationForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const biNumber = document.getElementById('verif_bi')?.value?.trim();
      const notes = document.getElementById('verif_notes')?.value?.trim() || '';
      if (!biNumber || biNumber.length < 5) {
        Toast.error('Insere um número de BI ou Passaporte válido (mín. 5 caracteres).');
        return;
      }
      const btn = document.getElementById('verifSubmitBtn');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar…';
      try {
        if (window.firebaseDb) {
          await window.firebaseDb.collection('verificationRequests').doc(user.uid).set({
            uid: user.uid,
            name: user.name,
            email: user.email,
            biNumber,
            notes,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }
        Toast.success('Pedido enviado! Segue as instruções abaixo para concluir a verificação.');
        const el = document.getElementById('verificationStatus');
        if (el) el.innerHTML = this._htmlPending({ name: user.name, biNumber, submittedAt: null });
        // Notify admin via WhatsApp
        const msg = encodeURIComponent(
          `🔔 *Verificação — Conecta Já*\n\nPrestador: ${user.name}\nEmail: ${user.email}\nBI/Passaporte: ${biNumber}${notes ? `\nNotas: ${notes}` : ''}\n\n→ Aprova em Firebase Console > verificationRequests`
        );
        setTimeout(() => window.open(`https://wa.me/244931482577?text=${msg}`, '_blank'), 800);
      } catch (err) {
        console.error('Verification error:', err);
        Toast.error('Erro ao enviar pedido. Verifica a tua ligação e tenta novamente.');
        btn.innerHTML = orig;
        btn.disabled = false;
      }
    });
  },
};

/* ============================================
   BOOT — DOM READY
============================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Toast.init();
  App.init();
  AuthModals.inject();
  SmoothScroll.init();
  LazyImages.init();
  CookieBanner.init();
  RatingWidget.init();
  ChoiceModal.init();
  StatsSync.init();
  PrestadoresPage.init();
  ProfilePage.init();
  Profile.init();
  Verification.init();
  DashboardClient.init();
  DashboardProvider.init();
  FAQPage.init();
  ContactPage.init();
  BlogPage.init();

  // Abrir modal de registo se vier de register.html com ?register=
  const _regParam = new URLSearchParams(window.location.search).get('register');
  if (_regParam) {
    setTimeout(function() {
      const type = sessionStorage.getItem('cj-register-type') || _regParam;
      sessionStorage.removeItem('cj-register-type');
      if (typeof AuthModals !== 'undefined' && AuthModals._preSelectType) AuthModals._preSelectType(type);
      Modal.open('registerModal');
    }, 500);
  }
});
