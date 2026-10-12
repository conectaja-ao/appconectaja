package com.heyclaude.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.anthropic.client.okhttp.AnthropicOkHttpClient;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Testa a conversa com o Claude contra um servidor falso (o SDK verdadeiro faz os pedidos). */
public class ClaudeBrainTest {
    private MockWebServer server;
    private final List<JSONObject> requests = new ArrayList<>();
    private final List<String> betaHeaders = new ArrayList<>();
    private final List<String> apiKeys = new ArrayList<>();

    @Before
    public void start() throws Exception {
        server = new MockWebServer();
        server.start();
    }

    @After
    public void stop() throws Exception {
        server.shutdown();
    }

    /** Lê os pedidos que o SDK fez ao servidor falso. */
    private void collectRequests() throws Exception {
        RecordedRequest r;
        while ((r = server.takeRequest(10, java.util.concurrent.TimeUnit.MILLISECONDS)) != null) {
            assertEquals("/v1/messages", r.getPath());
            requests.add(new JSONObject(r.getBody().readUtf8()));
            betaHeaders.add(String.valueOf(r.getHeader("anthropic-beta")));
            apiKeys.add(r.getHeader("x-api-key"));
        }
    }

    private ClaudeBrain brain(String model) {
        return new ClaudeBrain(AnthropicOkHttpClient.builder()
                .apiKey("sk-ant-teste")
                .baseUrl(server.url("/").toString())
                .maxRetries(0)
                .build(), model, ZonedDateTime.of(2026, 10, 12, 8, 30, 0, 0, ZoneId.of("Africa/Luanda")));
    }

    private void respond(int status, String body) {
        server.enqueue(new MockResponse().setResponseCode(status)
                .setHeader("Content-Type", "application/json").setBody(body));
    }

    private static String message(String stopReason, String contentJson) {
        return "{\"id\":\"msg_1\",\"type\":\"message\",\"role\":\"assistant\",\"model\":\"claude-opus-5-5\","
                + "\"content\":" + contentJson + ",\"stop_reason\":\"" + stopReason + "\","
                + "\"stop_sequence\":null,\"usage\":{\"input_tokens\":10,\"output_tokens\":5}}";
    }

    @Test
    public void textReplyAndRequestShape() throws Exception {
        respond(200, message("end_turn", "[{\"type\":\"text\",\"text\":\"Luanda é a capital de Angola.\"}]"));
        try (ClaudeBrain b = brain("claude-opus-5-5")) {
            ClaudeBrain.Reply reply = b.send("Qual é a capital de Angola?");
            assertEquals("Luanda é a capital de Angola.", reply.text);
            assertTrue(reply.calls.isEmpty());
            assertFalse(reply.refused);
        }
        collectRequests();
        JSONObject req = requests.get(0);
        assertEquals("claude-opus-5-5", req.getString("model"));
        assertEquals("low", req.getJSONObject("output_config").getString("effort"));
        assertEquals("default", req.getString("fallbacks"));
        assertTrue(betaHeaders.get(0).contains("server-side-fallback-2026-07-01"));
        assertEquals("sk-ant-teste", apiKeys.get(0));
        assertTrue(req.getString("system").contains("Hey Claude"));
        assertTrue(req.getString("system").contains("Africa/Luanda"));
        JSONArray tools = req.getJSONArray("tools");
        assertEquals(13, tools.length());
        JSONObject openApp = tools.getJSONObject(0);
        assertEquals(Tools.OPEN_APP, openApp.getString("name"));
        assertTrue(openApp.getBoolean("strict"));
        assertFalse(openApp.getJSONObject("input_schema").getBoolean("additionalProperties"));
        assertEquals("nome", openApp.getJSONObject("input_schema").getJSONArray("required").getString(0));
        assertFalse(req.has("tool_choice")); // escolha forçada dá erro 400 neste modelo
    }

    @Test
    public void toolUseRoundTrip() throws Exception {
        respond(200, message("tool_use", "[{\"type\":\"text\",\"text\":\"Vou abrir o YouTube.\"},"
                + "{\"type\":\"tool_use\",\"id\":\"toolu_1\",\"name\":\"abrir_app\",\"input\":{\"nome\":\"YouTube\"}}]"));
        respond(200, message("end_turn", "[{\"type\":\"text\",\"text\":\"Não encontrei o YouTube.\"}]"));
        try (ClaudeBrain b = brain("claude-sonnet-5-5")) {
            ClaudeBrain.Reply reply = b.send("abre o YouTube");
            assertEquals("Vou abrir o YouTube.", reply.text);
            assertEquals(1, reply.calls.size());
            ToolCall call = reply.calls.get(0);
            assertEquals("toolu_1", call.id);
            assertEquals(Tools.OPEN_APP, call.name);
            assertEquals("YouTube", call.text("nome"));

            ClaudeBrain.Reply second = b.sendToolResults(Collections.singletonList(
                    new ClaudeBrain.ToolResult("toolu_1", "Não encontrei nenhuma app chamada «YouTube».", true)));
            assertEquals("Não encontrei o YouTube.", second.text);
        }
        collectRequests();
        JSONArray messages = requests.get(1).getJSONArray("messages");
        assertEquals(3, messages.length());
        assertEquals("assistant", messages.getJSONObject(1).getString("role"));
        JSONObject result = messages.getJSONObject(2).getJSONArray("content").getJSONObject(0);
        assertEquals("tool_result", result.getString("type"));
        assertEquals("toolu_1", result.getString("tool_use_id"));
        assertTrue(result.getBoolean("is_error"));
    }

    @Test
    public void recordedResultsGoWithNextQuestion() throws Exception {
        respond(200, message("tool_use", "[{\"type\":\"tool_use\",\"id\":\"toolu_9\",\"name\":\"lanterna\","
                + "\"input\":{\"ligar\":true}}]"));
        respond(200, message("end_turn", "[{\"type\":\"text\",\"text\":\"Está desligada.\"}]"));
        try (ClaudeBrain b = brain("claude-opus-5-5")) {
            ClaudeBrain.Reply reply = b.send("liga a lanterna");
            assertTrue(reply.calls.get(0).bool("ligar"));
            b.recordToolResults(Collections.singletonList(
                    new ClaudeBrain.ToolResult("toolu_9", "Lanterna ligada.", false)));
            b.send("e agora desliga");
        }
        collectRequests();
        JSONArray messages = requests.get(1).getJSONArray("messages");
        JSONArray last = messages.getJSONObject(messages.length() - 1).getJSONArray("content");
        assertEquals("tool_result", last.getJSONObject(0).getString("type"));
        assertEquals("text", last.getJSONObject(1).getString("type"));
        assertEquals("e agora desliga", last.getJSONObject(1).getString("text"));
    }

    @Test
    public void haikuHasNoServerFallback() throws Exception {
        respond(200, message("end_turn", "[{\"type\":\"text\",\"text\":\"Olá!\"}]"));
        try (ClaudeBrain b = brain("claude-haiku-5-5")) {
            b.send("olá");
        }
        collectRequests();
        assertFalse(requests.get(0).has("fallbacks"));
        assertEquals("claude-haiku-5-5", requests.get(0).getString("model"));
    }

    @Test
    public void refusalNeverRunsTools() throws Exception {
        respond(200, message("refusal", "[{\"type\":\"tool_use\",\"id\":\"toolu_2\",\"name\":\"ligar\","
                + "\"input\":{\"contacto\":\"Ana\"}}]"));
        try (ClaudeBrain b = brain("claude-opus-5-5")) {
            ClaudeBrain.Reply reply = b.send("…");
            assertTrue(reply.refused);
            assertTrue(reply.calls.isEmpty());
        }
    }

    @Test
    public void badKeyIsExplained() {
        respond(401, "{\"type\":\"error\",\"error\":{\"type\":\"authentication_error\",\"message\":\"invalid x-api-key\"}}");
        try (ClaudeBrain b = brain("claude-opus-5-5")) {
            b.send("olá");
            fail("devia falhar");
        } catch (ClaudeBrain.BrainException e) {
            assertTrue(e.getMessage().contains("chave"));
        }
    }

    @Test
    public void systemPromptHasDateInPortuguese() {
        String prompt = ClaudeBrain.systemPrompt(
                ZonedDateTime.of(2026, 10, 12, 8, 30, 0, 0, ZoneId.of("Africa/Luanda")));
        assertTrue(prompt, prompt.contains("12 de outubro de 2026, 08:30"));
    }
}
