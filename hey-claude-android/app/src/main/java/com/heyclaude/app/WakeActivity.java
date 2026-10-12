package com.heyclaude.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

/**
 * Ecrã invisível que acende o ecrã, pede o desbloqueio (se o telefone estiver
 * bloqueado) e depois abre o Claude.
 */
public class WakeActivity extends Activity {
    static final String EXTRA_VOICE = "voice";

    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        boolean voice = getIntent().getBooleanExtra(EXTRA_VOICE, true);
        KeyguardManager km = getSystemService(KeyguardManager.class);
        if (Build.VERSION.SDK_INT >= 26 && km != null && km.isKeyguardLocked()) {
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override
                public void onDismissSucceeded() {
                    openAndFinish(voice);
                }

                @Override
                public void onDismissCancelled() {
                    finish();
                }

                @Override
                public void onDismissError() {
                    finish();
                }
            });
        } else {
            openAndFinish(voice);
        }
    }

    private void openAndFinish(boolean voice) {
        try {
            ClaudeLauncher.openNow(this, voice);
        } catch (RuntimeException e) {
            Diagnostics.add("Não consegui abrir o Claude: " + e.getMessage());
        }
        finish();
        overridePendingTransition(0, 0);
    }
}
