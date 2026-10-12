package com.heyclaude.app;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

/** Abre a bolinha do assistente quando se ouve "Hey Claude". */
final class AssistantLauncher {
    private AssistantLauncher() {}

    static void launchFromBackground(Context c) {
        Intent assist = new Intent(c, AssistActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        // O Android só deixa abrir ecrãs a partir de segundo plano a apps com
        // "sobrepor a outras apps" ou com um serviço de acessibilidade ligado.
        AssistAccessibilityService a11y = AssistAccessibilityService.instance();
        boolean allowed = a11y != null || Settings.canDrawOverlays(c);
        try {
            (a11y != null ? a11y : c).startActivity(assist);
        } catch (RuntimeException e) {
            allowed = false;
        }
        if (!allowed) {
            Notifications.showTapToOpen(c);
        }
    }
}
