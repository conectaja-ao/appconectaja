package com.heyclaude.app;

import android.Manifest;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioRecordingConfiguration;
import android.media.MediaRecorder;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;

import org.vosk.Model;
import org.vosk.android.StorageService;

import java.io.IOException;

/** Serviço em primeiro plano que ouve o microfone à espera de "Hey Claude". */
public class WakeWordService extends Service {
    static final String ACTION_STOP = "com.heyclaude.app.STOP";

    private static final int SAMPLE_RATE = 16000;
    /** Depois de abrir o Claude, larga o microfone durante este tempo. */
    private static final long PAUSE_AFTER_WAKE_MS = 15_000;
    /** Áudio só com zeros durante este tempo = o Android está a bloquear o microfone. */
    private static final long SILENCED_LIMIT_MS = 8_000;

    private static volatile boolean running;

    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean stopRequested;
    private volatile long pausedUntil;
    private Thread worker;

    static boolean isRunning() {
        return running;
    }

    static boolean hasMicPermission(Context c) {
        return c.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    /** Liga o serviço a partir de um ecrã da app (que está à frente). */
    static void start(Context c) {
        Prefs.setEnabled(c, true);
        if (!hasMicPermission(c)) {
            c.startActivity(new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return;
        }
        Intent i = new Intent(c, WakeWordService.class);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
        else c.startService(i);
    }

    /**
     * Tenta ligar o serviço sem ninguém a tocar no telefone (arranque do telefone,
     * serviço de acessibilidade). Se o Android não deixar, mostra uma notificação.
     * Usa startService (e não startForegroundService) para nunca fazer a app ir abaixo.
     */
    static void startFromBackground(Context c, boolean allowForegroundStart) {
        Intent i = new Intent(c, WakeWordService.class);
        try {
            if (allowForegroundStart && Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
            else c.startService(i);
        } catch (RuntimeException e) {
            Notifications.showTapToStart(c, "O Android não deixou ligar o microfone sozinho.");
        }
    }

    static void stop(Context c) {
        Prefs.setEnabled(c, false);
        c.stopService(new Intent(c, WakeWordService.class));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            Prefs.setEnabled(this, false);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!hasMicPermission(this)) {
            Notifications.showTapToStart(this, "Falta a permissão do microfone.");
            stopSelf();
            return START_NOT_STICKY;
        }
        try {
            // O tipo "microfone" só existe a partir do Android 11.
            if (Build.VERSION.SDK_INT >= 30) {
                startForeground(Notifications.ID_LISTENING, Notifications.listening(this),
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            } else {
                startForeground(Notifications.ID_LISTENING, Notifications.listening(this));
            }
        } catch (RuntimeException e) {
            // Android 14+: não se pode ligar o microfone a partir de segundo plano.
            Notifications.showTapToStart(this, "O Android não deixou ligar o microfone sozinho.");
            stopSelf();
            return START_NOT_STICKY;
        }
        if (worker == null || !worker.isAlive()) {
            stopRequested = false;
            worker = new Thread(this::run, "hey-claude-mic");
            worker.start();
        }
        running = true;
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopRequested = true;
        running = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ───────────────────────────── escuta ─────────────────────────────

    private void run() {
        Model model;
        try {
            model = new Model(StorageService.sync(this, "model-en-us", "model"));
        } catch (IOException | LinkageError e) {
            Diagnostics.add("Erro a carregar o modelo de voz: " + e.getMessage());
            main.post(this::stopSelf);
            return;
        }
        Diagnostics.add("A ouvir. Diz «Hey Claude».");
        try {
            while (!stopRequested) {
                long wait = pausedUntil - SystemClock.elapsedRealtime();
                if (wait > 0) {
                    sleep(Math.min(wait, 500));
                    continue;
                }
                try {
                    listen(model);
                } catch (IOException | RuntimeException e) {
                    Diagnostics.add("Microfone: " + e.getMessage() + " (nova tentativa em 3 s)");
                    sleep(3000);
                }
            }
        } finally {
            model.close();
        }
    }

    /** Ouve até pedirem para parar ou até à próxima pausa. */
    private void listen(Model model) throws IOException {
        int minBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        AudioRecord recorder;
        try {
            recorder = new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT,
                    Math.max(minBuffer, SAMPLE_RATE));
        } catch (SecurityException e) {
            throw new IllegalStateException("sem permissão");
        }
        if (recorder.getState() != AudioRecord.STATE_INITIALIZED) {
            recorder.release();
            throw new IllegalStateException("não foi possível abrir o microfone");
        }
        try (WakeWordDetector detector = new WakeWordDetector(model, SAMPLE_RATE)) {
            recorder.startRecording();
            if (recorder.getRecordingState() != AudioRecord.RECORDSTATE_RECORDING) {
                throw new IllegalStateException("o microfone está a ser usado por outra app");
            }
            short[] buffer = new short[SAMPLE_RATE / 10];
            long zerosSince = -1;
            boolean heardAudio = false;
            while (!stopRequested && SystemClock.elapsedRealtime() >= pausedUntil) {
                int n = recorder.read(buffer, 0, buffer.length);
                if (n < 0) {
                    throw new IllegalStateException("erro ao ler o microfone (" + n + ")");
                }
                if (n == 0) continue;

                long now = SystemClock.elapsedRealtime();
                if (isAllZeros(buffer, n)) {
                    if (zerosSince < 0) {
                        zerosSince = now;
                    } else if (now - zerosSince > SILENCED_LIMIT_MS && silencedBySystem(recorder)) {
                        Diagnostics.add("O Android está a bloquear o microfone.");
                        Notifications.showTapToStart(this,
                                "O Hey Claude não está a conseguir ouvir o microfone.");
                        stopRequested = true;
                        main.post(this::stopSelf);
                        return;
                    }
                } else {
                    zerosSince = -1;
                    if (!heardAudio) {
                        heardAudio = true;
                        Notifications.cancelTapToStart(this);
                    }
                }

                WakeWordDetector.Heard heard = detector.feed(buffer, n);
                if (heard != null) {
                    Diagnostics.add(heard.describe());
                    if (heard.activated) {
                        pausedUntil = SystemClock.elapsedRealtime() + PAUSE_AFTER_WAKE_MS;
                        main.post(this::onWakeWord);
                    }
                }
            }
        } finally {
            try {
                recorder.stop();
            } catch (IllegalStateException ignored) {
            }
            recorder.release();
        }
    }

    private static boolean isAllZeros(short[] buffer, int n) {
        for (int i = 0; i < n; i++) {
            if (buffer[i] != 0) return false;
        }
        return true;
    }

    /**
     * Zeros sem mais nenhuma app a gravar = o Android silenciou-nos (por exemplo,
     * serviço ligado em segundo plano) ou o acesso ao microfone está desligado.
     * Se outra app estiver a gravar (como o modo de voz do Claude), é normal.
     */
    private boolean silencedBySystem(AudioRecord recorder) {
        if (Build.VERSION.SDK_INT < 29) return false;
        AudioManager am = getSystemService(AudioManager.class);
        int ours = recorder.getAudioSessionId();
        for (AudioRecordingConfiguration cfg : am.getActiveRecordingConfigurations()) {
            if (cfg.getClientAudioSessionId() != ours) return false;
        }
        return true;
    }

    // ─────────────────────────── ativação ────────────────────────────

    private void onWakeWord() {
        playFeedback();
        ClaudeLauncher.launchFromBackground(this, Prefs.autoVoice(this));
    }

    @SuppressWarnings("deprecation")
    private void playFeedback() {
        try {
            ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80);
            tone.startTone(ToneGenerator.TONE_PROP_ACK, 200);
            main.postDelayed(tone::release, 500);
        } catch (RuntimeException ignored) {
        }
        Vibrator vibrator = getSystemService(Vibrator.class);
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createOneShot(60, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(60);
            }
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            stopRequested = true;
        }
    }
}
