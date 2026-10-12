package com.heyclaude.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Volta a ligar o Hey Claude depois de reiniciar o telefone ou de atualizar a app. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return;
        }
        if (!Prefs.enabled(context) || WakeWordService.isRunning()) {
            return;
        }
        if (Build.VERSION.SDK_INT < 30) {
            // Até ao Android 10, um serviço ligado no arranque pode usar o microfone.
            WakeWordService.startFromBackground(context, true);
        } else if (VoiceButtonService.instance() == null) {
            // Android 11+: só o serviço de acessibilidade (se estiver ligado) o
            // consegue fazer; senão pede ao utilizador um toque.
            Notifications.showTapToStart(context, "O telefone reiniciou.");
        }
    }
}
