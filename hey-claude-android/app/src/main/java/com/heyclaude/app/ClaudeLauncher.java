package com.heyclaude.app;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

/** Abre a app do Claude (com.anthropic.claude). */
final class ClaudeLauncher {
    static final String CLAUDE_PACKAGE = "com.anthropic.claude";

    private ClaudeLauncher() {}

    static boolean isClaudeInstalled(Context c) {
        return c.getPackageManager().getLaunchIntentForPackage(CLAUDE_PACKAGE) != null;
    }

    /**
     * Chamado quando se ouve "Hey Claude", normalmente com a app em segundo plano.
     * Passa pela WakeActivity, que acende o ecrã e pede o desbloqueio se for preciso.
     */
    static void launchFromBackground(Context c, boolean voice) {
        Intent wake = new Intent(c, WakeActivity.class)
                .putExtra(WakeActivity.EXTRA_VOICE, voice)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        // O Android só deixa abrir ecrãs a partir de segundo plano a apps com
        // um serviço de acessibilidade ligado (ou com "sobrepor a outras apps").
        VoiceButtonService a11y = VoiceButtonService.instance();
        boolean allowed = a11y != null || Settings.canDrawOverlays(c);
        try {
            (a11y != null ? a11y : c).startActivity(wake);
        } catch (RuntimeException e) {
            allowed = false;
        }
        if (!allowed) {
            Notifications.showTapToOpen(c, voice);
        }
    }

    /** Abre o Claude a partir de um ecrã nosso que está à frente. */
    static void openNow(Context c, boolean voice) {
        Intent claude = c.getPackageManager().getLaunchIntentForPackage(CLAUDE_PACKAGE);
        if (claude == null) {
            openStorePage(c);
            return;
        }
        claude.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        VoiceButtonService a11y = VoiceButtonService.instance();
        if (voice && a11y != null) {
            a11y.pressVoiceButtonSoon();
        }
        c.startActivity(claude);
    }

    static void openStorePage(Context c) {
        Intent market = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + CLAUDE_PACKAGE))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            c.startActivity(market);
        } catch (ActivityNotFoundException e) {
            c.startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + CLAUDE_PACKAGE))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
    }
}
