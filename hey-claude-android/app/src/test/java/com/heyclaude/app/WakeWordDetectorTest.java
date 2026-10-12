package com.heyclaude.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class WakeWordDetectorTest {

    /**
     * vosk_results.tsv tem resultados reais do Vosk (mesmo modelo e gramática da app)
     * para gravações de teste: pos_* dizem a frase de ativação, neg_* não.
     */
    @Test
    public void realVoskResults() throws Exception {
        Map<String, Boolean> activatedByClip = new HashMap<>();
        try (BufferedReader in = new BufferedReader(new InputStreamReader(
                getClass().getClassLoader().getResourceAsStream("vosk_results.tsv"),
                StandardCharsets.UTF_8))) {
            String line;
            while ((line = in.readLine()) != null) {
                String[] parts = line.split("\t", 2);
                WakeWordDetector.Heard heard = WakeWordDetector.match(parts[1]);
                boolean activated = heard != null && heard.activated;
                activatedByClip.merge(parts[0], activated, Boolean::logicalOr);
            }
        }
        // Frases quase iguais à de ativação: é esperado que ativem.
        String[] soundAlike = {"neg_en_heyclown", "neg_pt_eiclaudio"};
        int positives = 0;
        for (Map.Entry<String, Boolean> e : activatedByClip.entrySet()) {
            String clip = e.getKey();
            if (clip.startsWith("pos_")) {
                positives++;
                assertTrue(clip + " devia ativar", e.getValue());
            } else if (!java.util.Arrays.asList(soundAlike).contains(clip)) {
                assertFalse(clip + " não devia ativar", e.getValue());
            }
        }
        assertEquals(9, positives);
    }

    @Test
    public void silenceIsIgnored() {
        assertNull(WakeWordDetector.match("{\"text\":\"\"}"));
        assertNull(WakeWordDetector.match("não é json"));
    }

    @Test
    public void longPauseBetweenWordsDoesNotActivate() {
        String json = "{\"text\":\"hey claude\",\"result\":["
                + "{\"word\":\"hey\",\"conf\":1.0,\"start\":0.5,\"end\":0.8},"
                + "{\"word\":\"claude\",\"conf\":1.0,\"start\":2.0,\"end\":2.5}]}";
        WakeWordDetector.Heard heard = WakeWordDetector.match(json);
        assertNull(heard.phrase);
        assertFalse(heard.activated);
    }

    @Test
    public void lowConfidenceIsReportedButDoesNotActivate() {
        String json = "{\"text\":\"okay claude\",\"result\":["
                + "{\"word\":\"okay\",\"conf\":0.4,\"start\":0.5,\"end\":0.8},"
                + "{\"word\":\"claude\",\"conf\":1.0,\"start\":0.8,\"end\":1.3}]}";
        WakeWordDetector.Heard heard = WakeWordDetector.match(json);
        assertEquals("okay claude", heard.phrase);
        assertFalse(heard.activated);
    }

    @Test
    public void grammarHasPhrasesFillersAndUnknown() throws Exception {
        JSONArray grammar = new JSONArray(WakeWordDetector.grammarJson());
        assertEquals("hey claude", grammar.getString(0));
        assertEquals("[unk]", grammar.getString(grammar.length() - 1));
    }
}
