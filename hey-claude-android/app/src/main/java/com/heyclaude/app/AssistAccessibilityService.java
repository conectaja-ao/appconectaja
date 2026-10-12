package com.heyclaude.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayDeque;
import java.util.List;

/**
 * Serviço de acessibilidade (opcional), limitado ao WhatsApp (ver
 * res/xml/accessibility_service_config.xml). Serve para:
 *  - deixar a app abrir a bolinha do assistente a partir de segundo plano;
 *  - carregar sozinho em "Enviar" no WhatsApp, depois de confirmares a mensagem;
 *  - ligar o Hey Claude quando o telefone arranca.
 * Não lê nem guarda nada de outras apps.
 */
public class AssistAccessibilityService extends AccessibilityService {
    private static final String[] WHATSAPP_PACKAGES = {"com.whatsapp", "com.whatsapp.w4b"};
    private static final String[] SEND_LABELS = {"enviar", "send"};
    private static final long PRESS_TIMEOUT_MS = 10_000;

    private static volatile AssistAccessibilityService instance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long pressUntil;

    static AssistAccessibilityService instance() {
        return instance;
    }

    @Override
    protected void onServiceConnected() {
        instance = this;
        if (Prefs.enabled(this) && !WakeWordService.isRunning()) {
            WakeWordService.startFromBackground(this, false);
        }
    }

    @Override
    public boolean onUnbind(Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
    }

    @Override
    public void onInterrupt() {
    }

    /** Nos próximos segundos, carrega no botão Enviar da conversa do WhatsApp. */
    void pressWhatsAppSendSoon() {
        pressUntil = SystemClock.elapsedRealtime() + PRESS_TIMEOUT_MS;
        handler.removeCallbacks(pressSend);
        handler.postDelayed(pressSend, 1200);
    }

    private final Runnable pressSend = new Runnable() {
        @Override
        public void run() {
            if (SystemClock.elapsedRealtime() > pressUntil) {
                Diagnostics.add("Não encontrei o botão Enviar do WhatsApp.");
                return;
            }
            AccessibilityNodeInfo root = getRootInActiveWindow();
            AccessibilityNodeInfo send = root == null ? null : findSendButton(root);
            if (send != null && send.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                Diagnostics.add("Mensagem do WhatsApp enviada.");
                pressUntil = 0;
                return;
            }
            handler.postDelayed(this, 500);
        }
    };

    static AccessibilityNodeInfo findSendButton(AccessibilityNodeInfo root) {
        CharSequence pkg = root.getPackageName();
        boolean whatsapp = false;
        for (String p : WHATSAPP_PACKAGES) whatsapp |= p.contentEquals(pkg == null ? "" : pkg);
        if (!whatsapp) return null;
        for (String p : WHATSAPP_PACKAGES) {
            List<AccessibilityNodeInfo> byId = root.findAccessibilityNodeInfosByViewId(p + ":id/send");
            for (AccessibilityNodeInfo n : byId) {
                if (n.isVisibleToUser() && n.isEnabled()) return clickable(n);
            }
        }
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        int visited = 0;
        while (!queue.isEmpty() && visited++ < 2000) {
            AccessibilityNodeInfo n = queue.poll();
            CharSequence desc = n.getContentDescription();
            if (desc != null && n.isVisibleToUser()) {
                String d = desc.toString().trim().toLowerCase(java.util.Locale.ROOT);
                for (String label : SEND_LABELS) {
                    if (d.equals(label)) return clickable(n);
                }
            }
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo child = n.getChild(i);
                if (child != null) queue.add(child);
            }
        }
        return null;
    }

    private static AccessibilityNodeInfo clickable(AccessibilityNodeInfo node) {
        for (AccessibilityNodeInfo n = node; n != null; n = n.getParent()) {
            if (n.isClickable()) return n;
        }
        return node;
    }
}
