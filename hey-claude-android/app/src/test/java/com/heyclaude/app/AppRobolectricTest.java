package com.heyclaude.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

import android.Manifest;
import android.app.Application;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Intent;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
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
        Prefs.setVoiceLabel(app, "");
    }

    @Test
    public void mainScreenShowsChecklistWithoutMicPermission() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        TextView status = activity.findViewById(R.id.status);
        assertTrue(status.getText().toString().startsWith("Desligado"));
        TextView mic = activity.findViewById(R.id.step_mic);
        assertTrue(mic.getText().toString().contains("Microfone"));
        assertTrue(mic.getText().toString().startsWith("⚠️"));
        assertEquals(View.VISIBLE, activity.findViewById(R.id.btn_mic).getVisibility());
        TextView claude = activity.findViewById(R.id.step_claude);
        assertTrue(claude.getText().toString().startsWith("⚠️"));
    }

    @Test
    public void micPermissionTurnsStepGreen() {
        shadowOf(app).grantPermissions(Manifest.permission.RECORD_AUDIO);
        ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup();
        MainActivity activity = controller.get();
        TextView mic = activity.findViewById(R.id.step_mic);
        assertTrue(mic.getText().toString().startsWith("✅"));
        assertEquals(View.GONE, activity.findViewById(R.id.btn_mic).getVisibility());
    }

    @Test
    public void turningOnWithoutMicAsksForPermission() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        Switch enabled = activity.findViewById(R.id.switch_enabled);
        enabled.setChecked(true);
        ShadowActivity.PermissionsRequest request = shadowOf(activity).getLastRequestedPermission();
        assertNotNull(request);
        assertEquals(Manifest.permission.RECORD_AUDIO, request.requestedPermissions[0]);
        assertTrue(Prefs.enabled(app));
    }

    @Test
    public void turningOnWithMicStartsService() {
        shadowOf(app).grantPermissions(Manifest.permission.RECORD_AUDIO,
                Manifest.permission.POST_NOTIFICATIONS);
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        ((Switch) activity.findViewById(R.id.switch_enabled)).setChecked(true);
        Intent started = shadowOf(app).getNextStartedService();
        assertNotNull(started);
        assertEquals(WakeWordService.class.getName(), started.getComponent().getClassName());
    }

    @Test
    public void serviceWithoutMicPermissionStopsAndAsksForTap() {
        WakeWordService service = Robolectric.buildService(WakeWordService.class).create().get();
        service.onStartCommand(new Intent(app, WakeWordService.class), 0, 1);
        assertTrue(shadowOf(service).isStoppedBySelf());
        assertFalse(WakeWordService.isRunning());
        assertEquals(1, shadowOf(notifications()).size());
    }

    @Test
    public void serviceWithMicGoesForeground() {
        shadowOf(app).grantPermissions(Manifest.permission.RECORD_AUDIO);
        WakeWordService service = Robolectric.buildService(WakeWordService.class).create().get();
        service.onStartCommand(new Intent(app, WakeWordService.class), 0, 1);
        Notification n = shadowOf(service).getLastForegroundNotification();
        assertNotNull(n);
        assertEquals("Hey Claude está a ouvir",
                n.extras.getCharSequence(Notification.EXTRA_TITLE).toString());
        assertTrue(WakeWordService.isRunning());
        service.onDestroy();
        assertFalse(WakeWordService.isRunning());
    }

    @Test
    public void stopActionTurnsOff() {
        Prefs.setEnabled(app, true);
        WakeWordService service = Robolectric.buildService(WakeWordService.class).create().get();
        service.onStartCommand(new Intent(app, WakeWordService.class)
                .setAction(WakeWordService.ACTION_STOP), 0, 1);
        assertTrue(shadowOf(service).isStoppedBySelf());
        assertFalse(Prefs.enabled(app));
    }

    @Test
    public void bootOnAndroid14AsksForTapWhenEnabled() {
        Prefs.setEnabled(app, true);
        new BootReceiver().onReceive(app, new Intent(Intent.ACTION_BOOT_COMPLETED));
        assertEquals(1, shadowOf(notifications()).size());
    }

    @Test
    public void bootDoesNothingWhenDisabled() {
        new BootReceiver().onReceive(app, new Intent(Intent.ACTION_BOOT_COMPLETED));
        assertEquals(0, shadowOf(notifications()).size());
    }

    @Test
    @Config(sdk = 29)
    public void bootOnAndroid10StartsServiceDirectly() {
        Prefs.setEnabled(app, true);
        new BootReceiver().onReceive(app, new Intent(Intent.ACTION_BOOT_COMPLETED));
        Intent started = shadowOf(app).getNextStartedService();
        assertNotNull(started);
        assertEquals(WakeWordService.class.getName(), started.getComponent().getClassName());
    }

    @Test
    public void wakeWithoutClaudeInstalledOpensStore() {
        WakeActivity activity = Robolectric.buildActivity(WakeActivity.class,
                new Intent(app, WakeActivity.class).putExtra(WakeActivity.EXTRA_VOICE, true)).setup().get();
        Intent next = shadowOf(activity).getNextStartedActivity();
        assertNotNull(next);
        assertEquals(Intent.ACTION_VIEW, next.getAction());
        assertTrue(next.getDataString().contains(ClaudeLauncher.CLAUDE_PACKAGE));
        assertTrue(activity.isFinishing());
    }

    @Test
    public void wakeFromBackgroundWithoutAccessibilityShowsNotification() {
        ClaudeLauncher.launchFromBackground(app, true);
        assertEquals(1, shadowOf(notifications()).size());
    }

    @Test
    public void findsVoiceModeButtonAndSkipsDictation() {
        AccessibilityNodeInfo root = AccessibilityNodeInfo.obtain();
        AccessibilityNodeInfo dictate = node("Dictate");
        AccessibilityNodeInfo voice = node("Start voice mode");
        AccessibilityNodeInfo send = node("Send message");
        shadowOf(root).addChild(dictate);
        shadowOf(root).addChild(voice);
        shadowOf(root).addChild(send);
        root.setVisibleToUser(true);
        // O Robolectric devolve cópias dos elementos: compara pelo nome.
        assertEquals("Start voice mode",
                VoiceButtonService.labelOf(VoiceButtonService.findVoiceButton(root, "")));
        assertEquals("Send message",
                VoiceButtonService.labelOf(VoiceButtonService.findVoiceButton(root, "Send message")));
    }

    @Test
    public void modelStepOffersDownload() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        TextView step = activity.findViewById(R.id.step_model);
        assertTrue(step.getText().toString().contains("Modelo de voz"));
        assertEquals(View.VISIBLE, activity.findViewById(R.id.btn_model).getVisibility());
        assertFalse(ModelManager.isReady(app));
    }

    @Test
    public void modelDownloadFailureIsReported() {
        try {
            ModelManager.ensure(app, () -> false);
            throw new AssertionError("devia falhar");
        } catch (java.io.IOException expected) {
            assertNotNull(ModelManager.lastError());
            assertEquals(-1, ModelManager.progress());
            assertFalse(ModelManager.isReady(app));
        }
    }

    @Test
    public void extractStripsTopFolder() throws Exception {
        java.io.File target = new java.io.File(app.getFilesDir(), "extract-test");
        ModelManager.extract(new java.io.ByteArrayInputStream(zip(
                ModelManager.MODEL_NAME + "/", null,
                ModelManager.MODEL_NAME + "/am/final.mdl", "abc",
                ModelManager.MODEL_NAME + "/conf/model.conf", "x")), target, ModelManager.MODEL_NAME + "/");
        assertTrue(new java.io.File(target, "am/final.mdl").isFile());
        assertTrue(new java.io.File(target, "conf/model.conf").isFile());
    }

    @Test(expected = java.io.IOException.class)
    public void extractRejectsPathTraversal() throws Exception {
        java.io.File target = new java.io.File(app.getFilesDir(), "extract-evil");
        ModelManager.extract(new java.io.ByteArrayInputStream(zip("../../evil.txt", "x")), target, "");
    }

    private static byte[] zip(String... nameAndContent) throws java.io.IOException {
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        try (java.util.zip.ZipOutputStream z = new java.util.zip.ZipOutputStream(bytes)) {
            for (int i = 0; i < nameAndContent.length; i += 2) {
                z.putNextEntry(new java.util.zip.ZipEntry(nameAndContent[i]));
                if (nameAndContent[i + 1] != null) {
                    z.write(nameAndContent[i + 1].getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                z.closeEntry();
            }
        }
        return bytes.toByteArray();
    }

    private static AccessibilityNodeInfo node(String description) {
        AccessibilityNodeInfo n = AccessibilityNodeInfo.obtain();
        n.setContentDescription(description);
        n.setClickable(true);
        n.setEnabled(true);
        n.setVisibleToUser(true);
        return n;
    }

    private NotificationManager notifications() {
        return app.getSystemService(NotificationManager.class);
    }
}
