package com.heyclaude.app;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.PermissionDeniedException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.errors.UnauthorizedException;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.MessageParam;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.TextBlockParam;
import com.anthropic.models.messages.Tool;
import com.anthropic.models.messages.ToolResultBlockParam;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Conversa com o Claude (API da Anthropic). O Claude responde em texto (para
 * ser lido em voz alta) e/ou pede ações no telefone através de ferramentas.
 * Uma instância = uma conversa (enquanto a bolinha está aberta).
 */
final class ClaudeBrain implements AutoCloseable {

    static final String DEFAULT_MODEL = "claude-opus-5-5";

    static final class Reply {
        final String text;
        final List<ToolCall> calls;
        final boolean refused;

        Reply(String text, List<ToolCall> calls, boolean refused) {
            this.text = text;
            this.calls = calls;
            this.refused = refused;
        }
    }

    static final class ToolResult {
        final String toolUseId;
        final String content;
        final boolean isError;

        ToolResult(String toolUseId, String content, boolean isError) {
            this.toolUseId = toolUseId;
            this.content = content;
            this.isError = isError;
        }
    }

    /** Erro já traduzido para dizer ao utilizador. */
    static final class BrainException extends Exception {
        BrainException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private final AnthropicClient client;
    private final String model;
    private final String system;
    private final List<Tool> tools;
    /** Histórico só cresce (nunca se edita), como a API exige. */
    private final List<MessageParam> history = new ArrayList<>();
    /** Resultados de ferramentas ainda não enviados (vão com a próxima mensagem). */
    private final List<ToolResult> pendingResults = new ArrayList<>();

    ClaudeBrain(String apiKey, String model) {
        this(AnthropicOkHttpClient.builder()
                .apiKey(apiKey)
                .timeout(Duration.ofSeconds(60))
                .maxRetries(1)
                .build(), model, ZonedDateTime.now());
    }

    ClaudeBrain(AnthropicClient client, String model, ZonedDateTime now) {
        this.client = client;
        this.model = model == null || model.isEmpty() ? DEFAULT_MODEL : model;
        this.system = systemPrompt(now);
        this.tools = Tools.definitions();
    }

    static String systemPrompt(ZonedDateTime now) {
        String when = now.format(DateTimeFormatter.ofPattern(
                "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", new Locale("pt", "PT")));
        return "És o Claude, o assistente de voz do telemóvel Android do utilizador. "
                + "Ele chama-te dizendo «Hey Claude».\n"
                + "O que escreves é lido em voz alta: responde em português, em uma ou duas frases "
                + "curtas, sem listas, sem markdown, sem emojis e sem links.\n"
                + "Usa as ferramentas para fazer coisas no telemóvel: abrir apps, pesquisar no Google, "
                + "abrir sites, enviar mensagens por WhatsApp ou SMS, ligar, ver o calendário, criar "
                + "eventos, alarmes e temporizadores, mapas, YouTube e lanterna. Antes de uma "
                + "ferramenta, diz numa frase curta o que vais fazer.\n"
                + "Se faltar algo essencial (por exemplo, o texto da mensagem ou a hora), pergunta "
                + "numa frase curta. As mensagens e chamadas só avançam depois de o utilizador "
                + "confirmar no ecrã, por isso não peças tu essa confirmação.\n"
                + "Para perguntas de conhecimento geral, responde diretamente sem ferramentas.\n"
                + "Agora é " + when + " (fuso " + now.getZone().getId() + ").";
    }

    /** Envia o que o utilizador disse (junto com resultados de ações pendentes). */
    Reply send(String userText) throws BrainException {
        List<ContentBlockParam> blocks = takePendingResults();
        blocks.add(ContentBlockParam.ofText(TextBlockParam.builder().text(userText).build()));
        history.add(MessageParam.builder().role(MessageParam.Role.USER).contentOfBlockParams(blocks).build());
        return call();
    }

    /** Guarda os resultados das ações sem pedir nova resposta (a conversa pode acabar aqui). */
    void recordToolResults(List<ToolResult> results) {
        pendingResults.addAll(results);
    }

    /** Envia os resultados das ações e pede ao Claude a resposta seguinte. */
    Reply sendToolResults(List<ToolResult> results) throws BrainException {
        pendingResults.addAll(results);
        history.add(MessageParam.builder().role(MessageParam.Role.USER)
                .contentOfBlockParams(takePendingResults()).build());
        return call();
    }

    private List<ContentBlockParam> takePendingResults() {
        List<ContentBlockParam> blocks = new ArrayList<>();
        for (ToolResult r : pendingResults) {
            blocks.add(ContentBlockParam.ofToolResult(ToolResultBlockParam.builder()
                    .toolUseId(r.toolUseId)
                    .content(r.content)
                    .isError(r.isError)
                    .build()));
        }
        pendingResults.clear();
        return blocks;
    }

    MessageCreateParams buildParams() {
        MessageCreateParams.Builder params = MessageCreateParams.builder()
                .model(model)
                .maxTokens(4096L)
                .system(system)
                .messages(history)
                // Respostas de voz curtas: esforço baixo responde mais depressa.
                .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW).build());
        for (Tool tool : tools) params.addTool(tool);
        if (!model.startsWith("claude-haiku")) {
            // Se um pedido for recusado por engano, a API tenta outro modelo sozinha.
            params.putAdditionalHeader("anthropic-beta", "server-side-fallback-2026-07-01");
            params.putAdditionalBodyProperty("fallbacks", JsonValue.from("default"));
        }
        return params.build();
    }

    private Reply call() throws BrainException {
        Message response;
        try {
            response = client.messages().create(buildParams());
        } catch (UnauthorizedException | PermissionDeniedException e) {
            throw new BrainException("A chave da API não é válida. Confirma-a nas definições da app.", e);
        } catch (RateLimitException e) {
            throw new BrainException("Muitos pedidos seguidos. Espera um pouco e tenta outra vez.", e);
        } catch (AnthropicServiceException e) {
            if (e.statusCode() == 402 || String.valueOf(e.getMessage()).contains("credit")) {
                throw new BrainException("A conta da API não tem crédito.", e);
            }
            throw new BrainException("O Claude não respondeu (erro " + e.statusCode() + ").", e);
        } catch (AnthropicIoException e) {
            throw new BrainException("Sem ligação à internet.", e);
        } catch (RuntimeException e) {
            throw new BrainException("Não consegui falar com o Claude.", e);
        }
        history.add(response.toParam());

        StringBuilder text = new StringBuilder();
        List<ToolCall> calls = new ArrayList<>();
        for (ContentBlock block : response.content()) {
            block.text().ifPresent(t -> text.append(t.text()));
            block.toolUse().ifPresent(t -> calls.add(new ToolCall(t.id(), t.name(), inputMap(t._input()))));
        }
        StopReason stop = response.stopReason().orElse(null);
        if (StopReason.REFUSAL.equals(stop)) {
            // Uma recusa pode cortar uma ação a meio: nunca executar as ações deste turno.
            return new Reply("Desculpa, não posso ajudar com isso.", new ArrayList<>(), true);
        }
        if (StopReason.MAX_TOKENS.equals(stop)) {
            calls.clear(); // Ação possivelmente cortada: não executar.
        }
        return new Reply(text.toString().trim(), calls, false);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> inputMap(JsonValue input) {
        try {
            Map<String, Object> map = input.convert(Map.class);
            return map == null ? new LinkedHashMap<>() : map;
        } catch (RuntimeException e) {
            return new LinkedHashMap<>();
        }
    }

    @Override
    public void close() {
        client.close();
    }
}
