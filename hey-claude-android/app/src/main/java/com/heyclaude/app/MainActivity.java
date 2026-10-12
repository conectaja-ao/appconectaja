package com.heyclaude.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQ_MIC = 1;
    private static final int REQ_NOTIFICATIONS = 2;

    /** Botões vistos no Claude, à espera de serem mostrados para o utilizador escolher. */
    private static List<String> pendingButtons;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Switch enabledSwitch;
    private boolean updatingSwitch;

    private final Runnable refresher = new Runnable() {
        @Override
        public void run() {
            refresh();
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        enabledSwitch = findViewById(R.id.switch_enabled);
        enabledSwitch.setOnCheckedChangeListener((b, on) -> {
            if (updatingSwitch) return;
            if (on) turnOn();
            else WakeWordService.stop(this);
            refresh();
        });

        Switch autoVoice = findViewById(R.id.switch_auto_voice);
        autoVoice.setChecked(Prefs.autoVoice(this));
        autoVoice.setOnCheckedChangeListener((b, on) -> Prefs.setAutoVoice(this, on));

        findViewById(R.id.btn_model).setOnClickListener(v -> downloadModel());
        findViewById(R.id.btn_mic).setOnClickListener(v -> requestMic());
        findViewById(R.id.btn_notifications).setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= 33) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
            }
        });
        findViewById(R.id.btn_claude).setOnClickListener(v -> ClaudeLauncher.openStorePage(this));
        findViewById(R.id.btn_accessibility).setOnClickListener(v -> openAccessibilitySettings());
        findViewById(R.id.btn_app_info).setOnClickListener(v -> startActivity(
                new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:" + getPackageName()))));
        findViewById(R.id.btn_battery).setOnClickListener(v -> askBatteryExemption());
        findViewById(R.id.btn_choose_button).setOnClickListener(v -> learnVoiceButton());
        findViewById(R.id.btn_test).setOnClickListener(v -> ClaudeLauncher.openNow(this, Prefs.autoVoice(this)));
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.post(refresher);
        if (pendingButtons != null) {
            List<String> buttons = pendingButtons;
            pendingButtons = null;
            showButtonChoice(buttons);
        }
    }

    @Override
    protected void onPause() {
        handler.removeCallbacks(refresher);
        super.onPause();
    }

    // ─────────────────────────── ligar / permissões ───────────────────────────

    private void turnOn() {
        if (!WakeWordService.hasMicPermission(this)) {
            Prefs.setEnabled(this, true);
            requestMic();
            return;
        }
        if (Build.VERSION.SDK_INT >= 33 && !hasNotificationPermission()) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
        }
        WakeWordService.start(this);
    }

    private void downloadModel() {
        Context app = getApplicationContext();
        new Thread(() -> {
            try {
                ModelManager.ensure(app, () -> false);
            } catch (java.io.IOException ignored) {
                // O erro aparece no ecrã (ModelManager.lastError).
            }
        }, "hey-claude-model").start();
        handler.postDelayed(this::refresh, 300);
    }

    private void requestMic() {
        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (requestCode == REQ_MIC) {
            if (granted && Prefs.enabled(this)) {
                turnOn();
            } else if (!granted) {
                Prefs.setEnabled(this, false);
                Toast.makeText(this, "Sem o microfone, o Hey Claude não te consegue ouvir.",
                        Toast.LENGTH_LONG).show();
            }
        }
        refresh();
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isAccessibilityOn() {
        String enabled = Settings.Secure.getString(getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled == null) return false;
        ComponentName me = new ComponentName(this, VoiceButtonService.class);
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabled);
        for (String s : splitter) {
            if (me.equals(ComponentName.unflattenFromString(s))) return true;
        }
        return false;
    }

    private boolean isBatteryUnrestricted() {
        PowerManager pm = getSystemService(PowerManager.class);
        return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    private void openAccessibilitySettings() {
        new AlertDialog.Builder(this)
                .setTitle("Ligar a acessibilidade")
                .setMessage("Na lista que vai abrir, toca em «Hey Claude» (pode estar em "
                        + "«Apps instaladas» ou «Serviços transferidos») e liga-o.\n\n"
                        + "Só funciona dentro da app do Claude: serve para a abrir e carregar no "
                        + "botão do modo de voz.\n\n"
                        + "Se a opção aparecer cinzenta («Definição restrita»), volta aqui, toca "
                        + "em «Info da app», depois no menu ⋮ e em «Permitir definições restritas».")
                .setPositiveButton("Abrir definições",
                        (d, w) -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)))
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void askBatteryExemption() {
        try {
            startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getPackageName())));
        } catch (RuntimeException e) {
            startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
        }
    }

    // ───────────────────── escolher o botão do modo de voz ─────────────────────

    private void learnVoiceButton() {
        VoiceButtonService a11y = VoiceButtonService.instance();
        if (a11y == null) {
            Toast.makeText(this, "Liga primeiro a acessibilidade (passo 5).", Toast.LENGTH_LONG).show();
            return;
        }
        if (!ClaudeLauncher.isClaudeInstalled(this)) {
            ClaudeLauncher.openStorePage(this);
            return;
        }
        Toast.makeText(this, "A abrir o Claude… espera uns segundos e volto aqui.",
                Toast.LENGTH_LONG).show();
        ClaudeLauncher.openNow(this, false);
        handler.postDelayed(() -> {
            VoiceButtonService service = VoiceButtonService.instance();
            if (service == null) return;
            pendingButtons = service.currentClaudeButtons();
            service.startActivity(new Intent(service, MainActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
        }, 4500);
    }

    private void showButtonChoice(List<String> buttons) {
        if (buttons.isEmpty()) {
            new AlertDialog.Builder(this)
                    .setTitle("Não vi botões no Claude")
                    .setMessage("Abre um chat no Claude (onde se escreve a mensagem) e tenta outra vez.")
                    .setPositiveButton("OK", null)
                    .show();
            return;
        }
        String chosen = Prefs.voiceLabel(this);
        int best = -1;
        int bestScore = 0;
        for (int i = 0; i < buttons.size(); i++) {
            int score = VoiceButtonService.scoreLabel(buttons.get(i), "");
            if (score > bestScore) {
                best = i;
                bestScore = score;
            }
        }
        List<String> items = new ArrayList<>();
        items.add("Deteção automática" + (chosen.isEmpty() ? "  ✔" : ""));
        for (int i = 0; i < buttons.size(); i++) {
            String label = buttons.get(i);
            items.add(label + (label.equals(chosen) ? "  ✔" : "")
                    + (i == best ? "  (parece ser este)" : ""));
        }
        new AlertDialog.Builder(this)
                .setTitle("Qual é o botão do modo de voz?")
                .setItems(items.toArray(new String[0]), (d, which) -> {
                    String label = which == 0 ? "" : buttons.get(which - 1);
                    Prefs.setVoiceLabel(this, label);
                    Toast.makeText(this, label.isEmpty() ? "Deteção automática."
                            : "Guardado: " + label, Toast.LENGTH_SHORT).show();
                    refresh();
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    // ─────────────────────────────── ecrã ───────────────────────────────

    private void refresh() {
        boolean running = WakeWordService.isRunning();
        boolean model = ModelManager.isReady(this);
        boolean mic = WakeWordService.hasMicPermission(this);
        boolean notifications = hasNotificationPermission();
        boolean claude = ClaudeLauncher.isClaudeInstalled(this);
        boolean a11y = isAccessibilityOn();
        boolean battery = isBatteryUnrestricted();

        updatingSwitch = true;
        enabledSwitch.setChecked(Prefs.enabled(this) && running);
        updatingSwitch = false;

        ((TextView) findViewById(R.id.status)).setText(running
                ? "A ouvir — diz «Hey Claude»"
                : "Desligado — liga o interruptor abaixo");

        int progress = ModelManager.progress();
        if (progress >= 0) {
            ((TextView) findViewById(R.id.step_model)).setText(
                    "⏳  1. A descarregar o modelo de voz… " + progress + "%");
            findViewById(R.id.btn_model).setVisibility(View.GONE);
        } else {
            String error = ModelManager.lastError();
            step(R.id.step_model, R.id.btn_model, model, model
                    ? "1. Modelo de voz"
                    : "1. Modelo de voz: descarrega uma vez, de preferência com Wi-Fi"
                            + (error == null ? "" : "\n    Erro: " + error));
        }
        step(R.id.step_mic, R.id.btn_mic, mic, "2. Microfone");
        step(R.id.step_notifications, R.id.btn_notifications, notifications, "3. Notificações");
        step(R.id.step_claude, R.id.btn_claude, claude, "4. App do Claude instalada");
        step(R.id.step_accessibility, R.id.btn_accessibility, a11y,
                "5. Acessibilidade (abrir o Claude e o modo de voz sozinho)");
        findViewById(R.id.btn_app_info).setVisibility(a11y ? View.GONE : View.VISIBLE);
        step(R.id.step_battery, R.id.btn_battery, battery, "6. Bateria sem restrições");

        String label = Prefs.voiceLabel(this);
        ((TextView) findViewById(R.id.voice_label)).setText(
                "Botão do modo de voz: " + (label.isEmpty() ? "deteção automática" : "«" + label + "»"));
        ((TextView) findViewById(R.id.diagnostics)).setText(Diagnostics.text());
    }

    private void step(int textId, int buttonId, boolean ok, String title) {
        ((TextView) findViewById(textId)).setText((ok ? "✅  " : "⚠️  ") + title);
        Button button = findViewById(buttonId);
        button.setVisibility(ok ? View.GONE : View.VISIBLE);
    }
}
