package com.heyclaude.app;

import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.Tool;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** As ações que o Claude pode pedir no telefone (executadas pela DeviceActions). */
final class Tools {
    static final String OPEN_APP = "abrir_app";
    static final String GOOGLE = "pesquisar_google";
    static final String OPEN_SITE = "abrir_site";
    static final String WHATSAPP = "enviar_whatsapp";
    static final String SMS = "enviar_sms";
    static final String CALL = "ligar";
    static final String CALENDAR = "abrir_calendario";
    static final String EVENT = "criar_evento";
    static final String ALARM = "definir_alarme";
    static final String TIMER = "temporizador";
    static final String NAVIGATE = "navegar";
    static final String YOUTUBE = "pesquisar_youtube";
    static final String TORCH = "lanterna";

    private Tools() {}

    static List<Tool> definitions() {
        List<Tool> tools = new ArrayList<>();
        tools.add(tool(OPEN_APP, "Abre uma app instalada no telemóvel pelo nome (ex.: YouTube, Google, "
                        + "Chrome, Definições, Câmara, Galeria, Facebook).",
                prop("nome", "string", "Nome da app, como o utilizador o disse.")));
        tools.add(tool(GOOGLE, "Pesquisa no Google.",
                prop("pesquisa", "string", "O que pesquisar.")));
        tools.add(tool(OPEN_SITE, "Abre um site no navegador.",
                prop("url", "string", "Endereço do site, ex.: https://www.bbc.com")));
        tools.add(tool(WHATSAPP, "Envia uma mensagem de WhatsApp a um contacto. O utilizador confirma "
                        + "no ecrã antes de enviar.",
                prop("contacto", "string", "Nome do contacto como está na agenda, ou número de telefone."),
                prop("mensagem", "string", "Texto exato da mensagem.")));
        tools.add(tool(SMS, "Envia uma SMS a um contacto. O utilizador confirma no ecrã antes de enviar.",
                prop("contacto", "string", "Nome do contacto como está na agenda, ou número de telefone."),
                prop("mensagem", "string", "Texto exato da mensagem.")));
        tools.add(tool(CALL, "Faz uma chamada telefónica. O utilizador confirma no ecrã antes de ligar.",
                prop("contacto", "string", "Nome do contacto como está na agenda, ou número de telefone.")));
        tools.add(tool(CALENDAR, "Abre o calendário (agenda) do telemóvel."));
        tools.add(tool(EVENT, "Abre o calendário para criar um evento já preenchido (o utilizador guarda-o).",
                prop("titulo", "string", "Título do evento."),
                prop("inicio", "string", "Data e hora de início, formato AAAA-MM-DDTHH:MM (hora local)."),
                prop("fim", "string", "Data e hora de fim, formato AAAA-MM-DDTHH:MM, ou \"\" para 1 hora."),
                prop("local", "string", "Local do evento, ou \"\" se não houver.")));
        tools.add(tool(ALARM, "Cria um alarme (despertador).",
                prop("hora", "integer", "Hora, de 0 a 23."),
                prop("minuto", "integer", "Minuto, de 0 a 59."),
                prop("etiqueta", "string", "Nome do alarme, ou \"\".")));
        tools.add(tool(TIMER, "Inicia um temporizador.",
                prop("segundos", "integer", "Duração em segundos."),
                prop("etiqueta", "string", "Nome do temporizador, ou \"\".")));
        tools.add(tool(NAVIGATE, "Abre o mapa com o caminho até um destino.",
                prop("destino", "string", "Morada ou nome do lugar.")));
        tools.add(tool(YOUTUBE, "Pesquisa vídeos ou músicas no YouTube.",
                prop("pesquisa", "string", "O que procurar.")));
        tools.add(tool(TORCH, "Liga ou desliga a lanterna do telemóvel.",
                prop("ligar", "boolean", "true para ligar, false para desligar.")));
        return tools;
    }

    private static Map<String, Object> prop(String name, String type, String description) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("name", name);
        p.put("type", type);
        p.put("description", description);
        return p;
    }

    @SafeVarargs
    private static Tool tool(String name, String description, Map<String, Object>... props) {
        Tool.InputSchema.Properties.Builder properties = Tool.InputSchema.Properties.builder();
        List<String> required = new ArrayList<>();
        for (Map<String, Object> p : props) {
            Map<String, Object> schema = new LinkedHashMap<>();
            schema.put("type", p.get("type"));
            schema.put("description", p.get("description"));
            properties.putAdditionalProperty((String) p.get("name"), JsonValue.from(schema));
            required.add((String) p.get("name"));
        }
        return Tool.builder()
                .name(name)
                .description(description)
                .strict(true)
                .inputSchema(Tool.InputSchema.builder()
                        .properties(properties.build())
                        .required(required)
                        .putAdditionalProperty("additionalProperties", JsonValue.from(false))
                        .build())
                .build();
    }

    /** Ações que mexem com outras pessoas: só depois de o utilizador confirmar. */
    static boolean needsConfirmation(String name) {
        return WHATSAPP.equals(name) || SMS.equals(name) || CALL.equals(name);
    }
}
