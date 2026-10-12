package com.heyclaude.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.role.RoleManager;
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
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int REQ_MIC = 1;
    private static final int REQ_NOTIFICATIONS = 2;
    private static final int REQ_PHONE = 3;

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

        findViewById(R.id.btn_model).setOnClickListener(v -> downloadModel());
        findViewById(R.id.btn_mic).setOnClickListener(v -> requestMic());
        findViewById(R.id.btn_notifications).setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= 33) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
            }
        });
        findViewById(R.id.btn_save_key).setOnClickListener(v -> saveApiKey());
        findViewById(R.id.btn_get_key).setOnClickListener(v -> startActivity(new Intent(Intent.ACTION_VIEW,
                Uri.parse("https://console.anthropic.com/settings/keys"))));
        findViewById(R.id.btn_overlay).setOnClickListener(v -> startActivity(new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()))));
        findViewById(R.id.btn_phone).setOnClickListener(v -> requestPermissions(
                DeviceActions.requiredPermissions().toArray(new String[0]), REQ_PHONE));
        findViewById(R.id.btn_battery).setOnClickListener(v -> askBatteryExemption());
        findViewById(R.id.btn_assistant).setOnClickListener(v -> openAssistantSettings());
        findViewById(R.id.btn_accessibility).setOnClickListener(v -> openAccessibilitySettings());
        findViewById(R.id.btn_app_info).setOnClickListener(v -> startActivity(
                new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:" + getPackageName()))));
        findViewById(R.id.btn_talk).setOnClickListener(v ->
                startActivity(new Intent(this, AssistActivity.class)));

        RadioGroup models = findViewById(R.id.models);
        String model = Prefs.model(this);
        models.check(model.startsWith("claude-haiku") ? R.id.model_haiku
                : model.startsWith("claude-sonnet") ? R.id.model_sonnet : R.id.model_opus);
        models.setOnCheckedChangeListener((g, id) -> Prefs.setModel(this,
                id == R.id.model_haiku ? "claude-haiku-5-5"
                        : id == R.id.model_sonnet ? "claude-sonnet-5-5" : "claude-opus-5-5"));
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.post(refresher);
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

    private void saveApiKey() {
        EditText field = findViewById(R.id.api_key);
        String key = field.getText().toString().trim();
        if (!key.isEmpty() && !key.startsWith("sk-ant-")) {
            Toast.makeText(this, "A chave da Anthropic começa por «sk-ant-».", Toast.LENGTH_LONG).show();
            return;
        }
        Prefs.setApiKey(this, key);
        field.setText("");
        Toast.makeText(this, key.isEmpty() ? "Chave apagada." : "Chave guardada.", Toast.LENGTH_SHORT).show();
        refresh();
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasPhonePermissions() {
        for (String p : DeviceActions.requiredPermissions()) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) return false;
        }
        return true;
    }

    private boolean isAccessibilityOn() {
        String enabled = Settings.Secure.getString(getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled == null) return false;
        ComponentName me = new ComponentName(this, AssistAccessibilityService.class);
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabled);
        for (String s : splitter) {
            if (me.equals(ComponentName.unflattenFromString(s))) return true;
        }
        return false;
    }

    private boolean isDefaultAssistant() {
        if (Build.VERSION.SDK_INT >= 29) {
            RoleManager rm = getSystemService(RoleManager.class);
            return rm != null && rm.isRoleAvailable(RoleManager.ROLE_ASSISTANT)
                    && rm.isRoleHeld(RoleManager.ROLE_ASSISTANT);
        }
        String assistant = Settings.Secure.getString(getContentResolver(), "assistant");
        return assistant != null && assistant.contains(getPackageName());
    }

    private boolean isBatteryUnrestricted() {
        PowerManager pm = getSystemService(PowerManager.class);
        return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    private void openAssistantSettings() {
        new AlertDialog.Builder(this)
                .setTitle("Assistente do telemóvel")
                .setMessage("Na página que vai abrir, toca em «Aplicação de assistente digital» "
                        + "(ou «Assistente») e escolhe «Hey Claude».\n\n"
                        + "Assim, tocar sem soltar no botão de ligar (ou no botão de início) também "
                        + "abre a bolinha do Claude.")
                .setPositiveButton("Abrir definições", (d, w) -> {
                    try {
                        startActivity(new Intent(Settings.ACTION_VOICE_INPUT_SETTINGS));
                    } catch (RuntimeException e) {
                        startActivity(new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS));
                    }
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void openAccessibilitySettings() {
        new AlertDialog.Builder(this)
                .setTitle("Ligar a acessibilidade (opcional)")
                .setMessage("Na lista que vai abrir, toca em «Hey Claude» (pode estar em "
                        + "«Apps transferidos por download») e liga-o.\n\n"
                        + "Serve para carregar sozinho em «Enviar» no WhatsApp e para o Hey Claude "
                        + "voltar a ligar-se depois de reiniciares o telemóvel. Só funciona dentro do "
                        + "WhatsApp.\n\n"
                        + "Se aparecer «Configuração restrita», volta aqui, toca em «Info da app», "
                        + "depois no menu ⋮ e em «Permitir configurações restritas».")
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

    // ─────────────────────────────── ecrã ───────────────────────────────

    private void refresh() {
        boolean running = WakeWordService.isRunning();
        boolean model = ModelManager.isReady(this);
        boolean mic = WakeWordService.hasMicPermission(this);
        boolean notifications = hasNotificationPermission();
        String key = Prefs.apiKey(this);
        boolean overlay = Settings.canDrawOverlays(this);
        boolean phone = hasPhonePermissions();
        boolean battery = isBatteryUnrestricted();
        boolean assistant = isDefaultAssistant();
        boolean a11y = isAccessibilityOn();

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
                    ? "1. Modelo de voz «Hey Claude»"
                    : "1. Modelo de voz «Hey Claude»: descarrega uma vez, de preferência com Wi-Fi"
                            + (error == null ? "" : "\n    Erro: " + error));
        }
        step(R.id.step_mic, R.id.btn_mic, mic, "2. Microfone");
        step(R.id.step_notifications, R.id.btn_notifications, notifications, "3. Notificações");
        step(R.id.step_key, 0, !key.isEmpty(), key.isEmpty()
                ? "4. Chave da API do Claude (sem ela, só comandos simples)"
                : "4. Chave da API do Claude: " + mask(key));
        step(R.id.step_overlay, R.id.btn_overlay, overlay, "5. Aparecer por cima das outras apps");
        step(R.id.step_phone, R.id.btn_phone, phone, "6. Contactos, SMS e chamadas");
        step(R.id.step_battery, R.id.btn_battery, battery, "7. Bateria sem restrições");
        step(R.id.step_assistant, R.id.btn_assistant, assistant,
                "8. (Opcional) Assistente do telemóvel: abrir com o botão de ligar");
        step(R.id.step_accessibility, R.id.btn_accessibility, a11y,
                "9. (Opcional) Acessibilidade: enviar no WhatsApp sozinho");
        findViewById(R.id.btn_app_info).setVisibility(a11y ? View.GONE : View.VISIBLE);

        ((TextView) findViewById(R.id.diagnostics)).setText(Diagnostics.text());
    }

    /** Mostra só o início e o fim da chave. */
    static String mask(String key) {
        return key.length() <= 12 ? "guardada" : key.substring(0, 7) + "…" + key.substring(key.length() - 4);
    }

    private void step(int textId, int buttonId, boolean ok, String title) {
        ((TextView) findViewById(textId)).setText((ok ? "✅  " : "⚠️  ") + title);
        if (buttonId != 0) {
            Button button = findViewById(buttonId);
            button.setVisibility(ok ? View.GONE : View.VISIBLE);
        }
    }
}
