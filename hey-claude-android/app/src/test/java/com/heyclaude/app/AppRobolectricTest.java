package com.heyclaude.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

import android.Manifest;
import android.app.Application;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ResolveInfo;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.telephony.TelephonyManager;
import android.view.View;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.Switch;
import android.widget.TextView;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowActivity;

import java.util.LinkedHashMap;
import java.util.Map;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34)
public class AppRobolectricTest {
    private Application app;

    @Before
    public void setUp() {
        app = RuntimeEnvironment.getApplication();
        // Nos testes nunca se descarrega o modelo verdadeiro.
        ModelManager.modelUrl = "http://127.0.0.1:9/nada.zip";
        Prefs.setEnabled(app, false);
        Prefs.setApiKey(app, "");
        Prefs.setModel(app, ClaudeBrain.DEFAULT_MODEL);
    }

    private static ToolCall call(String name, Object... kv) {
        Map<String, Object> input = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) input.put((String) kv[i], kv[i + 1]);
        return new ToolCall("t", name, input);
    }

    private NotificationManager notifications() {
        return app.getSystemService(NotificationManager.class);
    }

    // ─────────────────────────── ecrã de configuração ───────────────────────────

    @Test
    public void mainScreenShowsChecklist() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        assertTrue(((TextView) activity.findViewById(R.id.status)).getText().toString().startsWith("Desligado"));
        String mic = ((TextView) activity.findViewById(R.id.step_mic)).getText().toString();
        assertTrue(mic.startsWith("⚠️") && mic.contains("Microfone"));
        String key = ((TextView) activity.findViewById(R.id.step_key)).getText().toString();
        assertTrue(key.contains("Chave da API"));
        assertEquals(View.VISIBLE, activity.findViewById(R.id.btn_overlay).getVisibility());
        assertTrue(((RadioButton) activity.findViewById(R.id.model_opus)).isChecked());
    }

    @Test
    public void savesApiKeyAndModel() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        EditText field = activity.findViewById(R.id.api_key);
        field.setText("chave-errada");
        activity.findViewById(R.id.btn_save_key).performClick();
        assertEquals("", Prefs.apiKey(app));

        field.setText("  sk-ant-api03-abcdefghijklmnop  ");
        activity.findViewById(R.id.btn_save_key).performClick();
        assertEquals("sk-ant-api03-abcdefghijklmnop", Prefs.apiKey(app));
        assertEquals("", field.getText().toString());
        String step = ((TextView) activity.findViewById(R.id.step_key)).getText().toString();
        assertTrue(step, step.startsWith("✅") && step.contains("sk-ant-…mnop"));

        ((RadioButton) activity.findViewById(R.id.model_haiku)).setChecked(true);
        assertEquals("claude-haiku-5-5", Prefs.model(app));
    }

    @Test
    public void turningOnWithoutMicAsksForPermission() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        ((Switch) activity.findViewById(R.id.switch_enabled)).setChecked(true);
        ShadowActivity.PermissionsRequest request = shadowOf(activity).getLastRequestedPermission();
        assertNotNull(request);
        assertEquals(Manifest.permission.RECORD_AUDIO, request.requestedPermissions[0]);
    }

    @Test
    public void turningOnWithMicStartsService() {
        shadowOf(app).grantPermissions(Manifest.permission.RECORD_AUDIO, Manifest.permission.POST_NOTIFICATIONS);
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        ((Switch) activity.findViewById(R.id.switch_enabled)).setChecked(true);
        Intent started = shadowOf(app).getNextStartedService();
        assertNotNull(started);
        assertEquals(WakeWordService.class.getName(), started.getComponent().getClassName());
    }

    @Test
    public void talkButtonOpensAssistant() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        activity.findViewById(R.id.btn_talk).performClick();
        Intent next = shadowOf(activity).getNextStartedActivity();
        assertEquals(AssistActivity.class.getName(), next.getComponent().getClassName());
    }

    // ─────────────────────────── serviço de escuta ───────────────────────────

    @Test
    public void serviceWithoutMicPermissionStopsAndAsksForTap() {
        WakeWordService service = Robolectric.buildService(WakeWordService.class).create().get();
        service.onStartCommand(new Intent(app, WakeWordService.class), 0, 1);
        assertTrue(shadowOf(service).isStoppedBySelf());
        assertEquals(1, shadowOf(notifications()).size());
    }

    @Test
    public void serviceWithMicGoesForeground() {
        shadowOf(app).grantPermissions(Manifest.permission.RECORD_AUDIO);
        WakeWordService service = Robolectric.buildService(WakeWordService.class).create().get();
        service.onStartCommand(new Intent(app, WakeWordService.class), 0, 1);
        Notification n = shadowOf(service).getLastForegroundNotification();
        assertEquals("Hey Claude está a ouvir", n.extras.getCharSequence(Notification.EXTRA_TITLE).toString());
        assertTrue(WakeWordService.isRunning());
        service.onDestroy();
        assertFalse(WakeWordService.isRunning());
    }

    @Test
    public void bootOnAndroid14AsksForTapWhenEnabled() {
        Prefs.setEnabled(app, true);
        new BootReceiver().onReceive(app, new Intent(Intent.ACTION_BOOT_COMPLETED));
        assertEquals(1, shadowOf(notifications()).size());
    }

    @Test
    @Config(sdk = 29)
    public void bootOnAndroid10StartsServiceDirectly() {
        Prefs.setEnabled(app, true);
        new BootReceiver().onReceive(app, new Intent(Intent.ACTION_BOOT_COMPLETED));
        Intent started = shadowOf(app).getNextStartedService();
        assertEquals(WakeWordService.class.getName(), started.getComponent().getClassName());
    }

    @Test
    public void wakeWordWithoutOverlayOrAccessibilityShowsNotification() {
        AssistantLauncher.launchFromBackground(app);
        assertEquals(1, shadowOf(notifications()).size());
    }

    // ─────────────────────────────── ações ───────────────────────────────

    @Test
    public void findsAppByName() {
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        shadowOf(app.getPackageManager()).addResolveInfoForIntent(main, launcher("com.google.android.youtube", "YouTube"));
        shadowOf(app.getPackageManager()).addResolveInfoForIntent(main, launcher("com.google.android.apps.youtube.music", "YouTube Music"));
        shadowOf(app.getPackageManager()).addResolveInfoForIntent(main, launcher("com.android.chrome", "Chrome"));
        ResolveInfo yt = DeviceActions.findApp(app.getPackageManager(), DeviceActions.normalize("o YouTube"));
        assertEquals("com.google.android.youtube", yt.activityInfo.packageName);
        ResolveInfo music = DeviceActions.findApp(app.getPackageManager(), DeviceActions.normalize("youtube music"));
        assertEquals("com.google.android.apps.youtube.music", music.activityInfo.packageName);
        assertNull(DeviceActions.findApp(app.getPackageManager(), "instagram"));
    }

    private static ResolveInfo launcher(String pkg, String label) {
        ResolveInfo info = new ResolveInfo();
        info.activityInfo = new ActivityInfo();
        info.activityInfo.packageName = pkg;
        info.activityInfo.name = pkg + ".Main";
        info.nonLocalizedLabel = label;
        return info;
    }

    @Test
    public void googleSearchAlarmAndEventIntents() {
        DeviceActions actions = new DeviceActions(app);
        assertTrue(actions.execute(call(Tools.GOOGLE, "pesquisa", "tempo em Luanda")).ok);
        Intent search = shadowOf(app).getNextStartedActivity();
        assertEquals(Intent.ACTION_WEB_SEARCH, search.getAction());
        assertEquals("tempo em Luanda", search.getStringExtra("query"));

        DeviceActions.Result alarm = actions.execute(call(Tools.ALARM, "hora", 7, "minuto", 30, "etiqueta", ""));
        assertTrue(alarm.ok);
        assertFalse(alarm.leavesAssistant);
        Intent a = shadowOf(app).getNextStartedActivity();
        assertEquals(AlarmClock.ACTION_SET_ALARM, a.getAction());
        assertEquals(7, a.getIntExtra(AlarmClock.EXTRA_HOUR, -1));
        assertEquals(30, a.getIntExtra(AlarmClock.EXTRA_MINUTES, -1));

        assertTrue(actions.execute(call(Tools.EVENT, "titulo", "Reunião", "inicio", "2026-10-13T15:00",
                "fim", "", "local", "Escritório")).ok);
        Intent e = shadowOf(app).getNextStartedActivity();
        assertEquals(Intent.ACTION_INSERT, e.getAction());
        long begin = e.getLongExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, 0);
        assertEquals(DeviceActions.toMillis("2026-10-13T15:00"), begin);
        assertEquals(begin + 3_600_000L, e.getLongExtra(CalendarContract.EXTRA_EVENT_END_TIME, 0));
        assertEquals("Reunião", e.getStringExtra(CalendarContract.Events.TITLE));

        assertFalse(actions.execute(call(Tools.ALARM, "hora", 25, "minuto", 0, "etiqueta", "")).ok);
        assertFalse(actions.execute(call(Tools.EVENT, "titulo", "x", "inicio", "amanhã", "fim", "", "local", "")).ok);
    }

    @Test
    public void whatsappUsesInternationalNumber() {
        shadowOf(app.getSystemService(TelephonyManager.class)).setSimCountryIso("ao");
        DeviceActions actions = new DeviceActions(app);
        assertEquals("+244923456789", actions.toInternational("923 456 789"));

        Object question = actions.describeForConfirmation(
                call(Tools.WHATSAPP, "contacto", "923456789", "mensagem", "Olá, chego às 5"));
        assertEquals("Enviar «Olá, chego às 5» a 923456789 (+244923456789) pelo WhatsApp?", question);

        DeviceActions.Result r = actions.execute(
                call(Tools.WHATSAPP, "contacto", "923456789", "mensagem", "Olá"));
        assertTrue(r.ok);
        Intent i = shadowOf(app).getNextStartedActivity();
        assertEquals("com.whatsapp", i.getPackage());
        assertEquals("https://api.whatsapp.com/send?phone=244923456789&text=Ol%C3%A1", i.getDataString());
    }

    @Test
    public void contactNameNeedsPermission() {
        Object r = new DeviceActions(app).resolveContact("Ana");
        assertTrue(r instanceof DeviceActions.Result);
        assertEquals(Manifest.permission.READ_CONTACTS, ((DeviceActions.Result) r).missingPermission);
    }

    // ─────────────────────────────── a bolinha ───────────────────────────────

    @Test
    public void assistantWithoutKeyRunsSimpleCommands() {
        ActivityController<AssistActivity> controller = Robolectric.buildActivity(AssistActivity.class).setup();
        AssistActivity activity = controller.get();
        assertTrue(AssistActivity.isShowing());
        assertTrue(((TextView) activity.findViewById(R.id.hint)).getText().toString().contains("Sem chave"));

        activity.onUtterance("abre o calendário");
        Intent next = shadowOf(activity).getNextStartedActivity();
        assertEquals(Intent.ACTION_VIEW, next.getAction());
        assertTrue(next.getDataString().startsWith("content://com.android.calendar/time/"));

        controller.destroy();
        assertFalse(AssistActivity.isShowing());
    }

    @Test
    public void assistantAsksBeforeSendingMessage() {
        shadowOf(app.getSystemService(TelephonyManager.class)).setSimCountryIso("ao");
        AssistActivity activity = Robolectric.buildActivity(AssistActivity.class).setup().get();
        activity.onUtterance("manda mensagem ao 923456789 a dizer olá");
        assertEquals(View.VISIBLE, activity.findViewById(R.id.confirm_row).getVisibility());
        String question = ((TextView) activity.findViewById(R.id.confirm_text)).getText().toString();
        assertTrue(question, question.contains("olá") && question.contains("+244923456789"));
        assertNull(shadowOf(activity).getNextStartedActivity()); // ainda nada enviado

        activity.findViewById(R.id.btn_yes).performClick();
        Intent sent = shadowOf(activity).getNextStartedActivity();
        assertNotNull(sent);
        assertTrue(sent.getDataString().contains("phone=244923456789"));
        assertEquals(View.GONE, activity.findViewById(R.id.confirm_row).getVisibility());
    }

    @Test
    public void assistantCancelSendsNothing() {
        AssistActivity activity = Robolectric.buildActivity(AssistActivity.class).setup().get();
        activity.onUtterance("liga para o 923456789");
        assertEquals(View.VISIBLE, activity.findViewById(R.id.confirm_row).getVisibility());
        activity.findViewById(R.id.btn_no).performClick();
        assertNull(shadowOf(activity).getNextStartedActivity());
        assertEquals("Cancelado.", ((TextView) activity.findViewById(R.id.reply)).getText().toString());
    }

    @Test
    public void assistantReportsErrors() {
        AssistActivity activity = Robolectric.buildActivity(AssistActivity.class).setup().get();
        activity.onUtterance("abre o instagram");
        String reply = ((TextView) activity.findViewById(R.id.reply)).getText().toString();
        assertTrue(reply, reply.contains("instagram"));
    }
}
