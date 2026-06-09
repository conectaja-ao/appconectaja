/* ConectaJá — App Shell JS
   Injeta status bar, top bar e bottom tab bar em todas as páginas */

(function () {
  // ── Detectar página actual ──
  var path = location.pathname.split('/').pop() || 'index.html';
  var pageMap = {
    'index.html':             { tab: 'home',     title: null,               logo: true  },
    'prestadores.html':       { tab: 'search',   title: 'Prestadores',      logo: false },
    'bisno.html':             { tab: 'bisno',    title: 'Bisno',            logo: false },
    'mensagens.html':         { tab: 'messages', title: 'Mensagens',        logo: false },
    'chat.html':              { tab: 'messages', title: 'Chat',             logo: false },
    'meu-perfil.html':        { tab: 'profile',  title: 'Perfil',           logo: false },
    'dashboard-client.html':  { tab: 'profile',  title: 'Os meus pedidos',  logo: false },
    'dashboard-provider.html':{ tab: 'profile',  title: 'Dashboard',        logo: false },
    'configuracoes.html':     { tab: 'profile',  title: 'Configurações',    logo: false },
    'sobre.html':             { tab: 'profile',  title: 'Sobre nós',        logo: false },
    'faq.html':               { tab: 'profile',  title: 'FAQ',              logo: false },
    'blog.html':              { tab: 'profile',  title: 'Blog',             logo: false },
    'contacto.html':          { tab: 'profile',  title: 'Contacto',         logo: false },
    'privacidade.html':       { tab: 'profile',  title: 'Privacidade',      logo: false },
    'termos.html':            { tab: 'profile',  title: 'Termos',           logo: false },
    'seguranca.html':         { tab: 'profile',  title: 'Segurança',        logo: false },
    'perfil-prestador.html':  { tab: 'search',   title: 'Prestador',        logo: false },
    'login.html':             { tab: null,       title: null,               logo: false },
    'register.html':          { tab: null,       title: null,               logo: false },
    'offline.html':           { tab: null,       title: null,               logo: false },
  };
  var info = pageMap[path] || { tab: 'home', title: 'ConectaJá', logo: false };

  // ── Clock ──
  function clock() {
    return new Date().toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Status bar ──
  var sb = document.createElement('div');
  sb.id = 'cj-status-bar';
  sb.innerHTML =
    '<span class="sb-time" id="cj-clock">' + clock() + '</span>' +
    '<div class="sb-icons">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.5a13 13 0 0121 0M5 12a10 10 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01"/></svg>' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="11" rx="2"/><path d="M23 11v2"/></svg>' +
    '</div>';
  document.body.prepend(sb);
  setInterval(function () {
    var el = document.getElementById('cj-clock');
    if (el) el.textContent = clock();
  }, 30000);

  // ── Top bar ──
  var isHome = info.logo;
  var showBack = !isHome && path !== 'prestadores.html' && path !== 'meu-perfil.html' && path !== 'dashboard-client.html' && path !== 'contacto.html';
  var tb = document.createElement('div');
  tb.id = 'cj-top-bar';

  var leftHTML = isHome
    ? '<a href="index.html" class="tb-logo">Conecta<span>Já</span></a>'
    : (showBack
        ? '<button class="tb-back" onclick="history.back()" aria-label="Voltar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg></button>'
        : '<a href="index.html" class="tb-back" aria-label="Início"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></a>');

  var centerHTML = isHome ? '' : '<span class="tb-title">' + info.title + '</span>';

  var rightHTML = '<div class="tb-actions">';
  if (isHome) {
    rightHTML +=
      '<a href="prestadores.html" class="tb-btn" aria-label="Buscar"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></a>' +
      '<a href="configuracoes.html" class="tb-btn" aria-label="Configurações"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></a>';
  }
  rightHTML += '</div>';

  tb.innerHTML = leftHTML + centerHTML + rightHTML;
  sb.after(tb);

  // ── Define CSS vars e padding-top do body ──
  // Aguarda render para medir alturas reais das barras
  requestAnimationFrame(function() {
    var sbH = sb.offsetHeight || 44;
    var tbH = tb.offsetHeight || 56;
    document.documentElement.style.setProperty('--statusbar-h', sbH + 'px');
    document.documentElement.style.setProperty('--topbar-h', tbH + 'px');
    // Páginas com layout próprio (contentor fixo ou hero com padding especial)
    var skipPaddingPages = ['mensagens.html', 'chat.html', 'login.html', 'register.html', 'offline.html', 'index.html'];
    if (!skipPaddingPages.includes(path)) {
      document.body.style.paddingTop = (sbH + tbH) + 'px';
    }
  });

  // ── Bottom tab bar ──
  // Skip tabs entirely on login page
  if (info.tab === null) return;

  var tabs = [
    { id: 'home',    href: 'index.html',         label: 'Início',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>' },
    { id: 'search',  href: 'prestadores.html',   label: 'Buscar',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' },
    { id: 'bisno',   href: 'bisno.html',         label: 'Bisno',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>' },
    { id: 'messages',href: 'mensagens.html',    label: 'Chat',    badge: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    { id: 'profile', href: 'meu-perfil.html',   label: 'Perfil',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  ];

  var btm = document.createElement('div');
  btm.id = 'cj-bottom-tab';
  btm.innerHTML = tabs.map(function (t) {
    var active = t.id === info.tab ? ' active' : '';
    var badge  = t.badge
      ? '<span class="tab-msg-badge" style="display:none;position:absolute;top:2px;right:14px;min-width:16px;height:16px;border-radius:8px;background:#FF6B35;color:#fff;font-size:10px;font-weight:700;align-items:center;justify-content:center;padding:0 4px;"></span>'
      : '';
    return '<a href="' + t.href + '" class="cj-tab' + active + '" style="position:relative" aria-label="' + t.label + '">' +
             t.svg + badge + '<span>' + t.label + '</span>' +
           '</a>';
  }).join('');
  document.body.appendChild(btm);

  // ── Live unread badge from Firestore ──
  (function () {
    var scripts = ['firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js'];
    function tryBadge() {
      if (typeof firebase === 'undefined' || !firebase.auth) return;
      firebase.auth().onAuthStateChanged(function(user) {
        if (!user) return;
        try {
          firebase.firestore().collection('conversations')
            .where('participants','array-contains', user.uid)
            .onSnapshot(function(snap) {
              var total = 0;
              snap.forEach(function(doc) {
                total += (((doc.data().unreadCount || {})[user.uid]) || 0);
              });
              var badge = document.querySelector('.tab-msg-badge');
              if (badge) {
                badge.textContent = total > 9 ? '9+' : (total || '');
                badge.style.display = total > 0 ? 'flex' : 'none';
              }
            });
        } catch(e) {}
      });
    }
    // Wait for Firebase to be ready (loaded after app-shell.js in some pages)
    var tries = 0;
    var iv = setInterval(function() {
      tries++;
      if (typeof firebase !== 'undefined' && firebase.auth) { tryBadge(); clearInterval(iv); }
      if (tries > 30) clearInterval(iv);
    }, 300);
  })();

  // ── Toast helper ──
  var toastEl = document.createElement('div');
  toastEl.id = 'cj-toast';
  document.body.appendChild(toastEl);

  window.CJToast = function (msg, type) {
    var m = document.createElement('div');
    m.className = 'cj-toast-msg';
    if (type === 'success') m.style.background = '#15803d';
    if (type === 'error')   m.style.background = '#b91c1c';
    m.textContent = msg;
    toastEl.appendChild(m);
    setTimeout(function () {
      m.classList.add('out');
      setTimeout(function () { m.remove(); }, 300);
    }, 2800);
  };

  // ── PWA service worker ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function(){});
  }
})();
