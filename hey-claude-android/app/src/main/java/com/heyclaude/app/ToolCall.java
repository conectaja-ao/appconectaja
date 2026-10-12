package com.heyclaude.app;

import java.util.Map;

/** Uma ação pedida (pelo Claude ou pelos comandos simples), por exemplo abrir_app {nome: "YouTube"}. */
final class ToolCall {
    final String id;
    final String name;
    final Map<String, Object> input;

    ToolCall(String id, String name, Map<String, Object> input) {
        this.id = id;
        this.name = name;
        this.input = input;
    }

    String text(String key) {
        Object v = input.get(key);
        return v == null ? "" : String.valueOf(v).trim();
    }

    /** Número inteiro, ou -1 se faltar ou não for número. */
    int integer(String key) {
        Object v = input.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    boolean bool(String key) {
        Object v = input.get(key);
        return v instanceof Boolean ? (Boolean) v : "true".equalsIgnoreCase(String.valueOf(v));
    }

    @Override
    public String toString() {
        return name + " " + input;
    }
}
