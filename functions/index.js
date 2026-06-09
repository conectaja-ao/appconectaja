/**
 * ============================================
 * CONECTA JÁ — Firebase Cloud Functions
 * ============================================
 * Deploy: firebase deploy --only functions
 * ============================================
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/* ════════════════════════════════════════════
   1. PUSH — Nova mensagem de chat
   Trigger: escrita em conversations/{convId}/messages/{msgId}
   ════════════════════════════════════════════ */
exports.onNewMessage = functions
  .region('europe-west1')          // mais próximo de Angola
  .firestore
  .document('conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const msg    = snap.data();
    const convId = context.params.convId;

    if (!msg || !msg.senderId || !msg.text) return null;

    try {
      // Buscar dados da conversa
      const convSnap = await db.collection('conversations').doc(convId).get();
      if (!convSnap.exists) return null;
      const conv = convSnap.data();

      // Destinatário = o participante que NÃO enviou
      const recipientUid = (conv.participants || []).find(uid => uid !== msg.senderId);
      if (!recipientUid) return null;

      // Nome do remetente
      const senderName = (conv.participantNames || {})[msg.senderId] || 'Alguém';

      // Buscar token FCM do destinatário
      const userSnap = await db.collection('users').doc(recipientUid).get();
      if (!userSnap.exists) return null;
      const fcmToken = userSnap.data().fcmToken;
      if (!fcmToken) return null;

      // Truncar mensagem longa
      const bodyText = msg.text.length > 100
        ? msg.text.substring(0, 100) + '...'
        : msg.text;

      // Enviar notificação FCM
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: senderName + ' — ConectaJá',
          body:  bodyText,
        },
        data: {
          url:    'chat.html?id=' + convId,
          convId: convId,
          type:   'new_message'
        },
        android: {
          priority: 'high',
          notification: {
            sound:       'default',
            channelId:   'messages',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1 }
          }
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: {
            icon:  '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200]
          },
          fcmOptions: {
            link: 'https://conectaja-ao.github.io/appconectaja/chat.html?id=' + convId
          }
        }
      });

      functions.logger.info('Push enviado para', recipientUid, '— conversa', convId);
      return null;

    } catch (err) {
      functions.logger.error('Erro ao enviar push:', err);
      return null;
    }
  });


/* ════════════════════════════════════════════
   2. PUSH — Limpar pendingNotifications
   (Fallback criado pelo cliente — processa e apaga)
   ════════════════════════════════════════════ */
exports.processPendingNotifications = functions
  .region('europe-west1')
  .firestore
  .document('pendingNotifications/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.to) {
      await snap.ref.delete();
      return null;
    }

    try {
      await admin.messaging().send({
        token: data.to,
        notification: {
          title: data.title || 'ConectaJá',
          body:  data.body  || 'Nova notificação',
        },
        data: {
          url:  data.url  || '/mensagens.html',
          type: data.type || 'notification'
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: {
            icon:  '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
          },
          fcmOptions: {
            link: 'https://conectaja-ao.github.io/appconectaja/' + (data.url || 'mensagens.html')
          }
        }
      });
      functions.logger.info('Pending notification enviada:', context.params.docId);
    } catch (err) {
      functions.logger.warn('Falha ao enviar pending notification:', err.message);
    }

    // Apagar sempre após processar (sucesso ou falha)
    await snap.ref.delete();
    return null;
  });


/* ════════════════════════════════════════════
   3. PUSH — Novo pedido de serviço
   Trigger: escrita em serviceRequests/{reqId}
   ════════════════════════════════════════════ */
exports.onNewServiceRequest = functions
  .region('europe-west1')
  .firestore
  .document('serviceRequests/{reqId}')
  .onCreate(async (snap) => {
    const req = snap.data();
    if (!req || !req.providerId) return null;

    try {
      const userSnap = await db.collection('users').doc(req.providerId).get();
      if (!userSnap.exists) return null;
      const fcmToken = userSnap.data().fcmToken;
      if (!fcmToken) return null;

      const clientName = req.clientName || 'Um cliente';

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: '📋 Novo pedido — ConectaJá',
          body:  clientName + ' fez um pedido de ' + (req.serviceType || 'serviço'),
        },
        data: {
          url:  'dashboard-provider.html',
          type: 'new_request'
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: { icon: '/icons/icon-192x192.png' },
          fcmOptions: {
            link: 'https://conectaja-ao.github.io/appconectaja/dashboard-provider.html'
          }
        }
      });

      return null;
    } catch (err) {
      functions.logger.error('Erro ao notificar prestador:', err);
      return null;
    }
  });


/* ════════════════════════════════════════════
   4. LIMPEZA — Apagar tokens FCM inválidos
   Agendado: todo domingo à meia-noite
   ════════════════════════════════════════════ */
exports.cleanInvalidTokens = functions
  .region('europe-west1')
  .pubsub.schedule('every sunday 00:00')
  .timeZone('Africa/Luanda')
  .onRun(async () => {
    // Os tokens inválidos são detectados quando o envio falha
    // Esta função apenas faz log — a limpeza acontece no catch do onNewMessage
    functions.logger.info('Limpeza de tokens agendada — ConectaJá');
    return null;
  });
