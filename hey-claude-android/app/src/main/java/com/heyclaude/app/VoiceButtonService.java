package com.heyclaude.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Serviço de acessibilidade, limitado à app do Claude (ver
 * res/xml/accessibility_service_config.xml). Serve para:
 *  - deixar a app abrir o Claude a partir de segundo plano;
 *  - carregar sozinho no botão do modo de voz depois de o Claude abrir;
 *  - ligar o Hey Claude quando o telefone arranca.
 * Não lê nem guarda nada de outras apps.
 */
public class VoiceButtonService extends AccessibilityService {

    /** Nomes do botão do modo de voz, por ordem de preferência (minúsculas). */
    static final String[] VOICE_LABELS = {
            "voice mode", "modo de voz", "modo voz", "start voice", "iniciar voz",
            "conversa por voz", "voice chat", "voice conversation", "voice",
            "talk to claude", "falar com o claude", "falar",
    };
    /** Botões a evitar: são o ditado (escrever com a voz), não o modo de voz. */
    static final String[] EXCLUDED = {
            "dictat", "ditad", "ditar", "microphone", "microfone", "transcri", "record", "gravar",
    };
    private static final long PRESS_TIMEOUT_MS = 12_000;

    private static volatile VoiceButtonService instance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long pressUntil;

    static VoiceButtonService instance() {
        return instance;
    }

    @Override
    protected void onServiceConnected() {
        instance = this;
        // Telefone acabou de arrancar (ou o serviço foi ligado agora): liga a escuta.
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
        // O botão é procurado pelo pressVoice (abaixo), não é preciso tratar eventos.
    }

    @Override
    public void onInterrupt() {
    }

    // ─────────────────────── carregar no botão ────────────────────────

    /** Durante os próximos segundos, procura o botão do modo de voz no Claude e carrega nele. */
    void pressVoiceButtonSoon() {
        pressUntil = SystemClock.elapsedRealtime() + PRESS_TIMEOUT_MS;
        handler.removeCallbacks(pressVoice);
        handler.postDelayed(pressVoice, 700);
    }

    private final Runnable pressVoice = new Runnable() {
        @Override
        public void run() {
            if (SystemClock.elapsedRealtime() > pressUntil) {
                Diagnostics.add("Não encontrei o botão do modo de voz no Claude.");
                return;
            }
            AccessibilityNodeInfo root = claudeRoot();
            AccessibilityNodeInfo button = root == null ? null
                    : findVoiceButton(root, Prefs.voiceLabel(VoiceButtonService.this));
            if (button != null && click(button)) {
                Diagnostics.add("Modo de voz aberto (" + labelOf(button) + ").");
                pressUntil = 0;
                return;
            }
            handler.postDelayed(this, 500);
        }
    };

    private AccessibilityNodeInfo claudeRoot() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null || !ClaudeLauncher.CLAUDE_PACKAGE.contentEquals(
                root.getPackageName() == null ? "" : root.getPackageName())) {
            return null;
        }
        return root;
    }

    /** O próprio elemento, ou um dos 3 elementos acima dele, reage a toques. */
    private static boolean isTappable(AccessibilityNodeInfo node) {
        AccessibilityNodeInfo n = node;
        for (int depth = 0; n != null && depth < 4; depth++, n = n.getParent()) {
            if (n.isClickable()) return true;
        }
        return false;
    }

    private static boolean click(AccessibilityNodeInfo node) {
        for (AccessibilityNodeInfo n = node; n != null; n = n.getParent()) {
            if (n.isClickable() && n.isEnabled()) {
                return n.performAction(AccessibilityNodeInfo.ACTION_CLICK);
            }
        }
        return false;
    }

    static AccessibilityNodeInfo findVoiceButton(AccessibilityNodeInfo root, String chosenLabel) {
        AccessibilityNodeInfo best = null;
        int bestScore = 0;
        for (AccessibilityNodeInfo node : visibleNodes(root)) {
            int score = scoreLabel(labelOf(node), chosenLabel);
            if (score > bestScore) {
                best = node;
                bestScore = score;
            }
        }
        return best;
    }

    /** Pontuação de um nome de botão: 0 = não é o botão do modo de voz. */
    static int scoreLabel(String label, String chosenLabel) {
        if (label.isEmpty()) return 0;
        if (!chosenLabel.isEmpty()) {
            return label.equals(chosenLabel) ? 1000 : 0;
        }
        String l = label.toLowerCase(Locale.ROOT);
        for (String bad : EXCLUDED) {
            if (l.contains(bad)) return 0;
        }
        for (int i = 0; i < VOICE_LABELS.length; i++) {
            if (l.contains(VOICE_LABELS[i])) return 100 - i;
        }
        return 0;
    }

    static String labelOf(AccessibilityNodeInfo node) {
        CharSequence s = node.getContentDescription();
        if (s == null || s.length() == 0) s = node.getText();
        if ((s == null || s.length() == 0) && node.getViewIdResourceName() != null) {
            String id = node.getViewIdResourceName();
            s = id.substring(id.lastIndexOf('/') + 1);
        }
        return s == null ? "" : s.toString().trim();
    }

    private static List<AccessibilityNodeInfo> visibleNodes(AccessibilityNodeInfo root) {
        List<AccessibilityNodeInfo> out = new ArrayList<>();
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty() && out.size() < 2000) {
            AccessibilityNodeInfo n = queue.poll();
            if (n.isVisibleToUser()) out.add(n);
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo child = n.getChild(i);
                if (child != null) queue.add(child);
            }
        }
        return out;
    }

    // ───────────────────── escolher o botão (ensinar) ─────────────────────

    /** Nomes dos botões que estão agora no ecrã do Claude (vazio se o Claude não estiver à frente). */
    List<String> currentClaudeButtons() {
        AccessibilityNodeInfo root = claudeRoot();
        Set<String> labels = new LinkedHashSet<>();
        if (root != null) {
            for (AccessibilityNodeInfo node : visibleNodes(root)) {
                String label = labelOf(node);
                if (!label.isEmpty() && label.length() <= 60 && isTappable(node)) labels.add(label);
            }
        }
        return new ArrayList<>(labels);
    }
}
