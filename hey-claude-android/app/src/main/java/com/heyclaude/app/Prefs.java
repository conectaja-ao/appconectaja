package com.heyclaude.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Definições guardadas da app. */
final class Prefs {
    private static final String FILE = "hey_claude";
    private static final String ENABLED = "enabled";
    private static final String AUTO_VOICE = "auto_voice";
    private static final String VOICE_LABEL = "voice_label";

    private Prefs() {}

    private static SharedPreferences get(Context c) {
        return c.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    /** O utilizador quer o Hey Claude ligado (também depois de reiniciar o telefone). */
    static boolean enabled(Context c) {
        return get(c).getBoolean(ENABLED, false);
    }

    static void setEnabled(Context c, boolean value) {
        get(c).edit().putBoolean(ENABLED, value).apply();
    }

    /** Carregar sozinho no botão do modo de voz depois de abrir o Claude. */
    static boolean autoVoice(Context c) {
        return get(c).getBoolean(AUTO_VOICE, true);
    }

    static void setAutoVoice(Context c, boolean value) {
        get(c).edit().putBoolean(AUTO_VOICE, value).apply();
    }

    /** Nome do botão do modo de voz escolhido pelo utilizador ("" = deteção automática). */
    static String voiceLabel(Context c) {
        return get(c).getString(VOICE_LABEL, "");
    }

    static void setVoiceLabel(Context c, String value) {
        get(c).edit().putString(VOICE_LABEL, value).apply();
    }
}
