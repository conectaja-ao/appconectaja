package com.heyclaude.app;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Deteta "Hey Claude" com o Vosk. O reconhecedor fica limitado às frases de
 * ativação, a palavras de som parecido (para "absorverem" falas como
 * "they called") e a "[unk]" (qualquer outra fala).
 */
final class WakeWordDetector implements AutoCloseable {

    static final String[] PHRASES = {"hey claude", "hey cloud", "hi claude", "okay claude"};
    static final String[] DISTRACTORS = {"they", "called", "call", "cold", "clown", "clue", "club", "hello"};
    static final double MIN_CONFIDENCE = 0.6;
    /** Pausa máxima (segundos) entre as palavras da frase. */
    static final double MAX_WORD_GAP = 0.6;

    static final class Heard {
        final String text;
        final String phrase;
        final double confidence;
        final boolean activated;

        Heard(String text, String phrase, double confidence, boolean activated) {
            this.text = text;
            this.phrase = phrase;
            this.confidence = confidence;
            this.activated = activated;
        }

        String describe() {
            if (phrase == null) {
                return "«" + text + "» — não é a frase";
            }
            return String.format(Locale.ROOT, "«%s» — %s (%.2f)%s", text, phrase, confidence,
                    activated ? " ✔ ATIVADO" : " (pouca confiança)");
        }
    }

    private final Recognizer recognizer;

    WakeWordDetector(Model model, float sampleRate) throws IOException {
        recognizer = new Recognizer(model, sampleRate, grammarJson());
        recognizer.setWords(true);
    }

    static String grammarJson() {
        JSONArray grammar = new JSONArray();
        for (String p : PHRASES) grammar.put(p);
        for (String d : DISTRACTORS) grammar.put(d);
        grammar.put("[unk]");
        return grammar.toString();
    }

    /** Recebe áudio PCM 16-bit mono; devolve um Heard no fim de cada frase falada. */
    Heard feed(short[] buffer, int length) {
        if (recognizer.acceptWaveForm(buffer, length)) {
            return match(recognizer.getResult());
        }
        return null;
    }

    static Heard match(String json) {
        JSONObject result;
        try {
            result = new JSONObject(json);
        } catch (JSONException e) {
            return null;
        }
        String text = result.optString("text", "");
        if (text.isEmpty()) {
            return null;
        }
        JSONArray words = result.optJSONArray("result");
        List<JSONObject> list = new ArrayList<>();
        if (words != null) {
            for (int i = 0; i < words.length(); i++) {
                JSONObject w = words.optJSONObject(i);
                if (w != null) list.add(w);
            }
        }

        String bestPhrase = null;
        double bestConf = 0;
        for (String phrase : PHRASES) {
            String[] target = phrase.split(" ");
            for (int i = 0; i + target.length <= list.size(); i++) {
                boolean same = true;
                double conf = 1;
                for (int k = 0; k < target.length && same; k++) {
                    JSONObject w = list.get(i + k);
                    same = target[k].equals(w.optString("word"));
                    conf = Math.min(conf, w.optDouble("conf", 0));
                    if (same && k > 0) {
                        double gap = w.optDouble("start", 0) - list.get(i + k - 1).optDouble("end", 0);
                        same = gap <= MAX_WORD_GAP;
                    }
                }
                if (same && (bestPhrase == null || conf > bestConf)) {
                    bestPhrase = phrase;
                    bestConf = conf;
                }
            }
        }
        boolean activated = bestPhrase != null && bestConf >= MIN_CONFIDENCE;
        return new Heard(text, bestPhrase, bestConf, activated);
    }

    @Override
    public void close() {
        recognizer.close();
    }
}
