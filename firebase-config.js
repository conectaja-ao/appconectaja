/* ============================================
   CONECTA JÁ — FIREBASE CONFIGURATION
============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyA8C6FHaecrnb16MOCk5SG-dplVhOh8wug",
  authDomain: "conectaja-b1076.firebaseapp.com",
  projectId: "conectaja-b1076",
  storageBucket: "conectaja-b1076.firebasestorage.app",
  messagingSenderId: "65289995093",
  appId: "1:65289995093:web:fa24addbcbcd447e74e5dc",
  measurementId: "G-L68PY77SN8"
};

firebase.initializeApp(firebaseConfig);
window.firebaseAuth    = firebase.auth();
window.firebaseDb      = firebase.firestore();
window.firebaseStorage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// ── Firebase Messaging SDK ──
// DESACTIVADO até activar o plano Blaze (necessário para push em background)
// Para activar: descomentar as linhas abaixo e fazer firebase deploy --only functions
/*
(function() {
  var s = document.createElement('script');
  s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js';
  document.head.appendChild(s);
})();
*/

// ── FCM Push Notifications ──
// VAPID key: vai a Firebase Console → Project Settings → Cloud Messaging
// → Web Push certificates → Generate key pair → copiar a chave pública aqui
var FCM_VAPID_KEY = 'BIPhzAUzo-SjFSCFjd59O_qWl4_JOTJ4aq9qiHpoMVaL4p57wTW7NOAtv1klCUOAZRRgvHkVGl-RL2bDR48NloU';

window.CJPush = {
  token: null,

  // Pedir permissão e registar token
  init: function() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'denied') return;
    if (typeof firebase.messaging !== 'function') return;

    try {
      var messaging = firebase.messaging();
      navigator.serviceWorker.ready.then(function(sw) {
        messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: sw })
          .then(function(token) {
            if (!token) return;
            CJPush.token = token;
            var user = firebase.auth().currentUser;
            if (user) {
              firebase.firestore().collection('users').doc(user.uid)
                .update({ fcmToken: token, fcmUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() })
                .catch(function(){});
            }
          }).catch(function(e) {
            // Silencioso — falha quando Blaze não está activo ou VAPID inválido
            if (e && e.code !== 'messaging/token-unsubscribe-failed') {
              console.debug('[CJPush] Token não disponível:', e.message || e.code);
            }
          });
      }).catch(function(){});
    } catch(e) {
      console.debug('[CJPush] Messaging não disponível.');
    }
  },

  // Pedir permissão explícita ao utilizador
  requestPermission: function(callback) {
    Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') CJPush.init();
      if (callback) callback(perm);
    });
  }
};

// Inicializar FCM após login (aguarda SDK carregar)
firebase.auth().onAuthStateChanged(function(user) {
  if (!user) return;
  var tries = 0;
  var iv = setInterval(function() {
    tries++;
    if (typeof firebase.messaging === 'function') {
      clearInterval(iv);
      CJPush.init();
    }
    if (tries > 20) clearInterval(iv); // desiste após 10s
  }, 500);
});
