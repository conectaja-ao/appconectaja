package com.heyclaude.app;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Comandos simples reconhecidos sem o Claude (quando não há chave da API ou internet):
 * «abre o YouTube», «pesquisa receitas de muamba», «liga para a Ana»,
 * «manda mensagem ao João a dizer olá», «alarme às 7 e 30», «liga a lanterna»…
 */
final class LocalCommands {

    private static final Pattern TORCH = Pattern.compile("\\blanterna\\b");
    private static final Pattern TORCH_OFF = Pattern.compile("\\b(desliga|desligar|apaga|apagar)\\b");
    private static final Pattern MESSAGE = Pattern.compile(
            "^(?:manda|mandar|envia|enviar|envie|mande)\\s+(?:uma\\s+)?(?:mensagem|sms|whatsapp)\\s+"
                    + "(?:pelo\\s+whatsapp\\s+)?(?:para\\s+o|para\\s+a|para|ao|a|à)\\s+(.+?)\\s+"
                    + "(?:a\\s+dizer|dizendo|que\\s+diz|a\\s+dizer\\s+que|com)\\s+(.+)$");
    private static final Pattern CALL = Pattern.compile(
            "^(?:liga|ligar|ligue|telefona|telefonar)\\s+(?:para\\s+o|para\\s+a|para|ao|a|à)\\s+(.+)$");
    private static final Pattern ALARM = Pattern.compile(
            "\\b(?:alarme|despertador|acorda\\s*me|acordar\\s*me)\\b.*?\\b(\\d{1,2})(?:\\s*(?:h|horas|:|e)\\s*(\\d{1,2}))?");
    private static final Pattern TIMER = Pattern.compile(
            "\\b(?:temporizador|timer|cronometro)\\b.*?\\b(\\d+)\\s*(segundos?|minutos?|horas?)");
    private static final Pattern NAVIGATE = Pattern.compile(
            "^(?:leva\\s*me|levar\\s*me|navega|navegar|como\\s+chego|caminho|direcoes)\\s+"
                    + "(?:para\\s+o|para\\s+a|para|ate\\s+ao|ate\\s+a|ate|ao|a)\\s+(.+)$");
    private static final Pattern YOUTUBE = Pattern.compile(
            "^(?:poe|por|toca|tocar|mete|meter)\\s+(.+?)(?:\\s+no\\s+youtube)?$");
    private static final Pattern SEARCH = Pattern.compile(
            "^(?:pesquisa|pesquisar|pesquise|procura|procurar|procure|busca|buscar)\\s+(?:por\\s+|no\\s+google\\s+)?(.+)$");
    private static final Pattern OPEN = Pattern.compile(
            "^(?:abre|abrir|abra|abri|inicia|iniciar)\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+)?(.+)$");

    private LocalCommands() {}

    /** Devolve a ação para o texto dito; se não perceber, uma pesquisa no Google. */
    static ToolCall parse(String spoken) {
        String original = spoken.trim();
        String t = DeviceActions.normalize(original);
        Matcher m;

        if (TORCH.matcher(t).find()) {
            return call(Tools.TORCH, "ligar", !TORCH_OFF.matcher(t).find());
        }
        if ((m = MESSAGE.matcher(t)).matches()) {
            String text = originalTail(original, m.group(2));
            String tool = t.contains(" sms ") || t.startsWith("manda sms") || t.startsWith("envia sms")
                    ? Tools.SMS : Tools.WHATSAPP;
            return call(tool, "contacto", m.group(1), "mensagem", text);
        }
        if ((m = ALARM.matcher(t)).find()) {
            int hour = Integer.parseInt(m.group(1));
            int minute = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
            return call(Tools.ALARM, "hora", hour, "minuto", minute, "etiqueta", "");
        }
        if ((m = TIMER.matcher(t)).find()) {
            int n = Integer.parseInt(m.group(1));
            String unit = m.group(2);
            int seconds = unit.startsWith("hora") ? n * 3600 : unit.startsWith("minuto") ? n * 60 : n;
            return call(Tools.TIMER, "segundos", seconds, "etiqueta", "");
        }
        if ((m = CALL.matcher(t)).matches() && !t.contains("lanterna")) {
            return call(Tools.CALL, "contacto", m.group(1));
        }
        if ((m = NAVIGATE.matcher(t)).matches()) {
            return call(Tools.NAVIGATE, "destino", m.group(1));
        }
        if (t.endsWith("no youtube") && (m = YOUTUBE.matcher(t)).matches()) {
            return call(Tools.YOUTUBE, "pesquisa", m.group(1));
        }
        if ((m = SEARCH.matcher(t)).matches()) {
            return call(Tools.GOOGLE, "pesquisa", originalTail(original, m.group(1)));
        }
        if ((m = OPEN.matcher(t)).matches()) {
            String target = m.group(1);
            if (target.matches(".*\\b(calendario|agenda)\\b.*")) return call(Tools.CALENDAR);
            return call(Tools.OPEN_APP, "nome", target);
        }
        return call(Tools.GOOGLE, "pesquisa", original);
    }

    /**
     * O texto normalizado perde acentos e maiúsculas; para mensagens e pesquisas
     * tenta devolver o pedaço original («Olá, chego às 5»).
     */
    private static String originalTail(String original, String normalizedTail) {
        String[] words = normalizedTail.split(" ");
        String[] originalWords = original.split("\\s+");
        if (words.length == 0 || words.length > originalWords.length) return normalizedTail;
        StringBuilder sb = new StringBuilder();
        for (int i = originalWords.length - words.length; i < originalWords.length; i++) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(originalWords[i]);
        }
        return DeviceActions.normalize(sb.toString()).equals(normalizedTail) ? sb.toString() : normalizedTail;
    }

    private static ToolCall call(String name, Object... keyValues) {
        Map<String, Object> input = new LinkedHashMap<>();
        for (int i = 0; i + 1 < keyValues.length; i += 2) {
            input.put((String) keyValues[i], keyValues[i + 1]);
        }
        return new ToolCall("local", name, input);
    }
}
