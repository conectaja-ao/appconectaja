package com.heyclaude.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

final class Notifications {
    static final int ID_LISTENING = 1;
    private static final int ID_TAP_TO_START = 2;
    private static final int ID_TAP_TO_OPEN = 3;
    private static final String CH_LISTENING = "escuta";
    private static final String CH_ALERTS = "avisos";

    private Notifications() {}

    private static NotificationManager manager(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH_LISTENING) == null) {
            nm.createNotificationChannel(new NotificationChannel(
                    CH_LISTENING, "A ouvir", NotificationManager.IMPORTANCE_LOW));
            nm.createNotificationChannel(new NotificationChannel(
                    CH_ALERTS, "Avisos", NotificationManager.IMPORTANCE_HIGH));
        }
        return nm;
    }

    @SuppressWarnings("deprecation")
    private static Notification.Builder builder(Context c, String channel) {
        manager(c);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, channel)
                : new Notification.Builder(c).setPriority(CH_ALERTS.equals(channel)
                        ? Notification.PRIORITY_HIGH : Notification.PRIORITY_LOW);
        return b.setSmallIcon(R.drawable.ic_stat_mic);
    }

    private static PendingIntent activity(Context c, int code, Intent intent) {
        return PendingIntent.getActivity(c, code, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Notificação fixa enquanto o serviço está a ouvir (obrigatória no Android). */
    static Notification listening(Context c) {
        PendingIntent open = activity(c, 10, new Intent(c, MainActivity.class));
        PendingIntent stop = PendingIntent.getService(c, 11,
                new Intent(c, WakeWordService.class).setAction(WakeWordService.ACTION_STOP),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return builder(c, CH_LISTENING)
                .setContentTitle("Hey Claude está a ouvir")
                .setContentText("Diz «Hey Claude» para chamar o assistente")
                .setContentIntent(open)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(null, "Desligar", stop).build())
                .build();
    }

    /** O Android não deixou ligar o microfone sozinho: o utilizador tem de tocar. */
    static void showTapToStart(Context c, String reason) {
        Notification n = builder(c, CH_ALERTS)
                .setContentTitle("Hey Claude desligado")
                .setContentText(reason + " Toca aqui para voltar a ligar.")
                .setStyle(new Notification.BigTextStyle().bigText(reason + " Toca aqui para voltar a ligar."))
                .setContentIntent(activity(c, 20, new Intent(c, StartActivity.class)))
                .setAutoCancel(true)
                .build();
        notifySafely(c, ID_TAP_TO_START, n);
    }

    static void cancelTapToStart(Context c) {
        manager(c).cancel(ID_TAP_TO_START);
    }

    /** Alternativa quando o Android não deixa abrir o Claude em segundo plano. */
    static void showTapToOpen(Context c) {
        Intent open = new Intent(c, AssistActivity.class);
        Notification.Builder b = builder(c, CH_ALERTS)
                .setContentTitle("Ouvi «Hey Claude»")
                .setContentText("Toca para falar com o Claude")
                .setContentIntent(activity(c, 30, open))
                .setAutoCancel(true);
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(30_000);
        notifySafely(c, ID_TAP_TO_OPEN, b.build());
    }

    private static void notifySafely(Context c, int id, Notification n) {
        try {
            manager(c).notify(id, n);
        } catch (SecurityException ignored) {
            // Sem permissão de notificações (Android 13+).
        }
    }
}
