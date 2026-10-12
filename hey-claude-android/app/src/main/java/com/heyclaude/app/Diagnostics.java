package com.heyclaude.app;

import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.Date;
import java.util.Locale;

/** Últimas coisas que o Hey Claude ouviu ou fez, para mostrar no ecrã da app. */
final class Diagnostics {
    private static final int MAX = 8;
    private static final ArrayDeque<String> lines = new ArrayDeque<>();

    private Diagnostics() {}

    static synchronized void add(String line) {
        String time = new SimpleDateFormat("HH:mm:ss", Locale.ROOT).format(new Date());
        lines.addFirst(time + "  " + line);
        while (lines.size() > MAX) lines.removeLast();
    }

    static synchronized String text() {
        return lines.isEmpty() ? "(ainda nada)" : String.join("\n", lines);
    }
}
