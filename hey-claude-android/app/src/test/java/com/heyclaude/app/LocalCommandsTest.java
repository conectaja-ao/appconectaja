package com.heyclaude.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class LocalCommandsTest {

    private static ToolCall parse(String s) {
        return LocalCommands.parse(s);
    }

    @Test
    public void openApp() {
        ToolCall c = parse("Abre o YouTube");
        assertEquals(Tools.OPEN_APP, c.name);
        assertEquals("youtube", c.text("nome"));
        assertEquals(Tools.CALENDAR, parse("abre o calendário").name);
        assertEquals(Tools.CALENDAR, parse("Abrir a agenda").name);
    }

    @Test
    public void search() {
        ToolCall c = parse("Pesquisa receitas de muamba de galinha");
        assertEquals(Tools.GOOGLE, c.name);
        assertEquals("receitas de muamba de galinha", c.text("pesquisa"));
    }

    @Test
    public void whatsappMessageKeepsOriginalText() {
        ToolCall c = parse("Manda mensagem ao João a dizer Olá, chego às 5");
        assertEquals(Tools.WHATSAPP, c.name);
        assertEquals("joao", c.text("contacto"));
        assertEquals("Olá, chego às 5", c.text("mensagem"));
    }

    @Test
    public void sms() {
        ToolCall c = parse("envia sms para a Maria a dizer estou a caminho");
        assertEquals(Tools.SMS, c.name);
        assertEquals("maria", c.text("contacto"));
        assertEquals("estou a caminho", c.text("mensagem"));
    }

    @Test
    public void call() {
        ToolCall c = parse("Liga para a Ana");
        assertEquals(Tools.CALL, c.name);
        assertEquals("ana", c.text("contacto"));
    }

    @Test
    public void torch() {
        ToolCall on = parse("liga a lanterna");
        assertEquals(Tools.TORCH, on.name);
        assertTrue(on.bool("ligar"));
        assertFalse(parse("Desliga a lanterna").bool("ligar"));
    }

    @Test
    public void alarmAndTimer() {
        ToolCall a = parse("põe um alarme às 7 e 30");
        assertEquals(Tools.ALARM, a.name);
        assertEquals(7, a.integer("hora"));
        assertEquals(30, a.integer("minuto"));
        ToolCall b = parse("acorda-me às 6");
        assertEquals(6, b.integer("hora"));
        assertEquals(0, b.integer("minuto"));
        ToolCall t = parse("temporizador de 5 minutos");
        assertEquals(Tools.TIMER, t.name);
        assertEquals(300, t.integer("segundos"));
    }

    @Test
    public void navigate() {
        ToolCall c = parse("Leva-me até ao aeroporto");
        assertEquals(Tools.NAVIGATE, c.name);
        assertEquals("aeroporto", c.text("destino"));
    }

    @Test
    public void youtube() {
        ToolCall c = parse("põe kizomba no youtube");
        assertEquals(Tools.YOUTUBE, c.name);
        assertEquals("kizomba", c.text("pesquisa"));
    }

    @Test
    public void unknownBecomesGoogleSearch() {
        ToolCall c = parse("Qual é a capital de Angola?");
        assertEquals(Tools.GOOGLE, c.name);
        assertEquals("Qual é a capital de Angola?", c.text("pesquisa"));
    }
}
