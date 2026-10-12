package com.heyclaude.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Definições guardadas da app. */
final class Prefs {
    private static final String FILE = "hey_claude";
    private static final String ENABLED = "enabled";
    private static final String API_KEY = "api_key";
    private static final String MODEL = "model";

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

    /** Chave da API da Anthropic (fica só neste telefone, na memória privada da app). */
    static String apiKey(Context c) {
        return get(c).getString(API_KEY, "");
    }

    static void setApiKey(Context c, String value) {
        get(c).edit().putString(API_KEY, value.trim()).apply();
    }

    static String model(Context c) {
        return get(c).getString(MODEL, ClaudeBrain.DEFAULT_MODEL);
    }

    static void setModel(Context c, String value) {
        get(c).edit().putString(MODEL, value).apply();
    }
}
