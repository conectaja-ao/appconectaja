package com.heyclaude.app;

import android.Manifest;
import android.app.SearchManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.net.Uri;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.telephony.PhoneNumberUtils;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Executa no telefone as ações pedidas (ToolCall). */
final class DeviceActions {

    static final class Result {
        final boolean ok;
        /** Texto para o Claude (resultado da ferramenta). */
        final String message;
        /** Abriu outra app: a bolinha deve fechar-se para ela ficar visível. */
        final boolean leavesAssistant;
        /** Permissão Android que falta (o ecrã pede-a e tenta outra vez), ou null. */
        final String missingPermission;

        private Result(boolean ok, String message, boolean leavesAssistant, String missingPermission) {
            this.ok = ok;
            this.message = message;
            this.leavesAssistant = leavesAssistant;
            this.missingPermission = missingPermission;
        }

        static Result done(String message, boolean leavesAssistant) {
            return new Result(true, message, leavesAssistant, null);
        }

        static Result error(String message) {
            return new Result(false, message, false, null);
        }

        static Result needsPermission(String permission, String message) {
            return new Result(false, message, false, permission);
        }
    }

    static final class Contact {
        final String name;
        final String number;

        Contact(String name, String number) {
            this.name = name;
            this.number = number;
        }
    }

    private final Context context;

    DeviceActions(Context context) {
        this.context = context;
    }

    // ───────────────────────────── confirmação ─────────────────────────────

    /** Frase a mostrar antes de enviar/ligar, ou um Result de erro (contacto não encontrado…). */
    Object describeForConfirmation(ToolCall call) {
        Object contact = resolveContact(call.text("contacto"));
        if (contact instanceof Result) return contact;
        Contact c = (Contact) contact;
        String who = c.name + " (" + c.number + ")";
        switch (call.name) {
            case Tools.WHATSAPP:
                return "Enviar «" + call.text("mensagem") + "» a " + who + " pelo WhatsApp?";
            case Tools.SMS:
                return "Enviar a SMS «" + call.text("mensagem") + "» a " + who + "?";
            case Tools.CALL:
                return "Ligar a " + who + "?";
            default:
                return "Confirmas?";
        }
    }

    // ─────────────────────────────── executar ───────────────────────────────

    Result execute(ToolCall call) {
        try {
            switch (call.name) {
                case Tools.OPEN_APP:
                    return openApp(call.text("nome"));
                case Tools.GOOGLE:
                    return googleSearch(call.text("pesquisa"));
                case Tools.OPEN_SITE:
                    return openSite(call.text("url"));
                case Tools.WHATSAPP:
                    return whatsapp(call.text("contacto"), call.text("mensagem"));
                case Tools.SMS:
                    return sms(call.text("contacto"), call.text("mensagem"));
                case Tools.CALL:
                    return phoneCall(call.text("contacto"));
                case Tools.CALENDAR:
                    return openCalendar();
                case Tools.EVENT:
                    return createEvent(call.text("titulo"), call.text("inicio"), call.text("fim"),
                            call.text("local"));
                case Tools.ALARM:
                    return alarm(call.integer("hora"), call.integer("minuto"), call.text("etiqueta"));
                case Tools.TIMER:
                    return timer(call.integer("segundos"), call.text("etiqueta"));
                case Tools.NAVIGATE:
                    return navigate(call.text("destino"));
                case Tools.YOUTUBE:
                    return youtube(call.text("pesquisa"));
                case Tools.TORCH:
                    return torch(call.bool("ligar"));
                default:
                    return Result.error("Ação desconhecida: " + call.name);
            }
        } catch (ActivityNotFoundException e) {
            return Result.error("Não há nenhuma app no telemóvel para isso.");
        } catch (SecurityException e) {
            return Result.error("O Android não deixou: " + e.getMessage());
        }
    }

    private Result openApp(String name) {
        if (name.isEmpty()) return Result.error("Falta o nome da app.");
        String n = normalize(name);
        if (n.matches(".*\\b(calendario|agenda)\\b.*")) return openCalendar();
        if (n.matches(".*\\b(definicoes|configuracoes|definicao|settings|ajustes)\\b.*")) {
            start(new Intent(Settings.ACTION_SETTINGS));
            return Result.done("Abri as definições.", true);
        }
        if (n.matches(".*\\b(camara|camera)\\b.*")) {
            start(new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA));
            return Result.done("Abri a câmara.", true);
        }
        ResolveInfo app = findApp(context.getPackageManager(), n);
        if (app == null) return Result.error("Não encontrei nenhuma app chamada «" + name + "».");
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(app.activityInfo.packageName);
        if (launch == null) return Result.error("Não consegui abrir «" + name + "».");
        start(launch.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED));
        return Result.done("Abri a app " + app.loadLabel(context.getPackageManager()) + ".", true);
    }

    /** Procura uma app pelo nome: igual > começa por > contém > todas as palavras. */
    static ResolveInfo findApp(PackageManager pm, String normalizedName) {
        String query = normalizedName.replaceFirst("^(a |o |app |aplicacao )+", "").trim();
        if (query.isEmpty()) return null;
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        ResolveInfo best = null;
        int bestScore = 0;
        for (ResolveInfo info : pm.queryIntentActivities(main, 0)) {
            String label = normalize(String.valueOf(info.loadLabel(pm)));
            int score = matchScore(label, query);
            if (score > bestScore) {
                best = info;
                bestScore = score;
            }
        }
        return best;
    }

    static int matchScore(String candidate, String query) {
        if (candidate.isEmpty() || query.isEmpty()) return 0;
        if (candidate.equals(query)) return 100;
        if (candidate.startsWith(query + " ") || candidate.startsWith(query)) return 80;
        if (candidate.contains(query)) return 60;
        String[] words = query.split("\\s+");
        for (String w : words) {
            if (!candidate.contains(w)) return 0;
        }
        return 40;
    }

    private Result googleSearch(String query) {
        if (query.isEmpty()) return Result.error("Falta o que pesquisar.");
        try {
            start(new Intent(Intent.ACTION_WEB_SEARCH).putExtra(SearchManager.QUERY, query));
        } catch (ActivityNotFoundException e) {
            start(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://www.google.com/search?q=" + encode(query))));
        }
        return Result.done("Pesquisei «" + query + "» no Google.", true);
    }

    private Result openSite(String url) {
        if (url.isEmpty()) return Result.error("Falta o endereço.");
        if (!url.matches("(?i)^https?://.*")) url = "https://" + url;
        start(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        return Result.done("Abri " + url + ".", true);
    }

    private Result whatsapp(String contactName, String message) {
        Object resolved = resolveContact(contactName);
        if (resolved instanceof Result) return (Result) resolved;
        Contact c = (Contact) resolved;
        String digits = c.number.replaceAll("[^0-9]", "");
        Uri uri = Uri.parse("https://api.whatsapp.com/send?phone=" + digits + "&text=" + encode(message));
        boolean opened = false;
        for (String pkg : new String[]{"com.whatsapp", "com.whatsapp.w4b", null}) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, uri);
                if (pkg != null) i.setPackage(pkg);
                start(i);
                opened = true;
                break;
            } catch (ActivityNotFoundException ignored) {
            }
        }
        if (!opened) return Result.error("O WhatsApp não está instalado.");
        AssistAccessibilityService a11y = AssistAccessibilityService.instance();
        if (a11y != null) {
            a11y.pressWhatsAppSendSoon();
            return Result.done("Mensagem enviada a " + c.name + " pelo WhatsApp.", true);
        }
        return Result.done("Abri a conversa com " + c.name + " no WhatsApp com a mensagem escrita; "
                + "falta tocar em enviar.", true);
    }

    @SuppressWarnings("deprecation")
    private Result sms(String contactName, String message) {
        if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            return Result.needsPermission(Manifest.permission.SEND_SMS, "Falta a permissão para enviar SMS.");
        }
        Object resolved = resolveContact(contactName);
        if (resolved instanceof Result) return (Result) resolved;
        Contact c = (Contact) resolved;
        SmsManager sms = Build.VERSION.SDK_INT >= 31
                ? context.getSystemService(SmsManager.class) : SmsManager.getDefault();
        ArrayList<String> parts = sms.divideMessage(message);
        sms.sendMultipartTextMessage(c.number, null, parts, null, null);
        return Result.done("SMS enviada a " + c.name + ".", false);
    }

    private Result phoneCall(String contactName) {
        Object resolved = resolveContact(contactName);
        if (resolved instanceof Result) return (Result) resolved;
        Contact c = (Contact) resolved;
        Uri tel = Uri.parse("tel:" + Uri.encode(c.number));
        if (context.checkSelfPermission(Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            start(new Intent(Intent.ACTION_CALL, tel));
            return Result.done("A ligar a " + c.name + ".", true);
        }
        start(new Intent(Intent.ACTION_DIAL, tel));
        return Result.done("Abri o telefone com o número de " + c.name + "; falta tocar em ligar.", true);
    }

    private Result openCalendar() {
        Uri uri = CalendarContract.CONTENT_URI.buildUpon().appendPath("time")
                .appendPath(String.valueOf(System.currentTimeMillis())).build();
        start(new Intent(Intent.ACTION_VIEW, uri));
        return Result.done("Abri o calendário.", true);
    }

    private Result createEvent(String title, String start, String end, String location) {
        long begin;
        long finish;
        try {
            begin = toMillis(start);
            finish = end.isEmpty() ? begin + 3_600_000L : toMillis(end);
        } catch (DateTimeParseException e) {
            return Result.error("Data inválida: use AAAA-MM-DDTHH:MM.");
        }
        Intent i = new Intent(Intent.ACTION_INSERT, CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.Events.TITLE, title)
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, begin)
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, finish);
        if (!location.isEmpty()) i.putExtra(CalendarContract.Events.EVENT_LOCATION, location);
        start(i);
        return Result.done("Abri o calendário com o evento «" + title + "» preenchido; falta guardar.", true);
    }

    static long toMillis(String isoLocal) {
        String s = isoLocal.length() == 16 ? isoLocal + ":00" : isoLocal;
        return LocalDateTime.parse(s).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private Result alarm(int hour, int minute, String label) {
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return Result.error("Hora inválida.");
        Intent i = new Intent(AlarmClock.ACTION_SET_ALARM)
                .putExtra(AlarmClock.EXTRA_HOUR, hour)
                .putExtra(AlarmClock.EXTRA_MINUTES, minute)
                .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        if (!label.isEmpty()) i.putExtra(AlarmClock.EXTRA_MESSAGE, label);
        start(i);
        return Result.done(String.format(Locale.ROOT, "Alarme criado para as %02d:%02d.", hour, minute), false);
    }

    private Result timer(int seconds, String label) {
        if (seconds <= 0) return Result.error("Duração inválida.");
        Intent i = new Intent(AlarmClock.ACTION_SET_TIMER)
                .putExtra(AlarmClock.EXTRA_LENGTH, seconds)
                .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        if (!label.isEmpty()) i.putExtra(AlarmClock.EXTRA_MESSAGE, label);
        start(i);
        return Result.done("Temporizador de " + seconds + " segundos iniciado.", false);
    }

    private Result navigate(String destination) {
        if (destination.isEmpty()) return Result.error("Falta o destino.");
        try {
            start(new Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=" + encode(destination)))
                    .setPackage("com.google.android.apps.maps"));
        } catch (ActivityNotFoundException e) {
            start(new Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=" + encode(destination))));
        }
        return Result.done("Abri o mapa para " + destination + ".", true);
    }

    private Result youtube(String query) {
        if (query.isEmpty()) return Result.error("Falta o que procurar.");
        try {
            start(new Intent(Intent.ACTION_SEARCH).setPackage("com.google.android.youtube")
                    .putExtra("query", query));
        } catch (ActivityNotFoundException e) {
            start(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://www.youtube.com/results?search_query=" + encode(query))));
        }
        return Result.done("Procurei «" + query + "» no YouTube.", true);
    }

    private Result torch(boolean on) {
        CameraManager cm = context.getSystemService(CameraManager.class);
        try {
            for (String id : cm.getCameraIdList()) {
                Boolean flash = cm.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if (Boolean.TRUE.equals(flash)) {
                    cm.setTorchMode(id, on);
                    return Result.done(on ? "Lanterna ligada." : "Lanterna desligada.", false);
                }
            }
        } catch (CameraAccessException e) {
            return Result.error("A câmara está a ser usada por outra app.");
        }
        return Result.error("Este telemóvel não tem lanterna.");
    }

    // ─────────────────────────────── contactos ───────────────────────────────

    /** Devolve um Contact, ou um Result de erro. */
    Object resolveContact(String nameOrNumber) {
        if (nameOrNumber.isEmpty()) return Result.error("Falta o contacto.");
        String digits = nameOrNumber.replaceAll("[^0-9+]", "");
        if (digits.replace("+", "").length() >= 6 && !nameOrNumber.matches(".*[a-zA-Z].*")) {
            return new Contact(nameOrNumber, toInternational(digits));
        }
        if (context.checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            return Result.needsPermission(Manifest.permission.READ_CONTACTS, "Falta a permissão dos contactos.");
        }
        Contact best = null;
        int bestScore = 0;
        String query = normalize(nameOrNumber);
        try (Cursor c = context.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                        ContactsContract.CommonDataKinds.Phone.NUMBER},
                null, null, null)) {
            while (c != null && c.moveToNext()) {
                String name = c.getString(0);
                String number = c.getString(1);
                if (name == null || number == null) continue;
                int score = matchScore(normalize(name), query);
                if (score > bestScore) {
                    best = new Contact(name, number);
                    bestScore = score;
                }
            }
        }
        if (best == null) return Result.error("Não encontrei «" + nameOrNumber + "» nos contactos.");
        return new Contact(best.name, toInternational(best.number));
    }

    /** Número no formato internacional (+244…), usando o país do cartão SIM. */
    String toInternational(String number) {
        if (number.startsWith("+")) return number.replaceAll("[^0-9+]", "");
        String country = null;
        TelephonyManager tm = context.getSystemService(TelephonyManager.class);
        if (tm != null) {
            country = tm.getSimCountryIso();
            if (country == null || country.isEmpty()) country = tm.getNetworkCountryIso();
        }
        if (country == null || country.isEmpty()) country = Locale.getDefault().getCountry();
        String e164 = country.isEmpty() ? null
                : PhoneNumberUtils.formatNumberToE164(number, country.toUpperCase(Locale.ROOT));
        return e164 != null ? e164 : number.replaceAll("[^0-9+]", "");
    }

    // ─────────────────────────────── utilitários ───────────────────────────────

    private void start(Intent intent) {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    static String normalize(String s) {
        String n = Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return n.replaceAll("[^a-z0-9+ ]", " ").replaceAll("\\s+", " ").trim();
    }

    private static String encode(String s) {
        try {
            return URLEncoder.encode(s, StandardCharsets.UTF_8.name()).replace("+", "%20");
        } catch (java.io.UnsupportedEncodingException e) {
            return s;
        }
    }

    static List<String> requiredPermissions() {
        List<String> list = new ArrayList<>();
        list.add(Manifest.permission.READ_CONTACTS);
        list.add(Manifest.permission.SEND_SMS);
        list.add(Manifest.permission.CALL_PHONE);
        return list;
    }
}
