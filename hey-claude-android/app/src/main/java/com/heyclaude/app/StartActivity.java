package com.heyclaude.app;

import android.app.Activity;
import android.os.Bundle;

/**
 * Ecrã invisível usado pela notificação e pelo mosaico das definições rápidas:
 * como está à frente, o Android deixa-o ligar o microfone em segundo plano.
 */
public class StartActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WakeWordService.start(this);
        finish();
        overridePendingTransition(0, 0);
    }
}
