package com.heyclaude.app;

import android.Manifest;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * O assistente: a bolinha que aparece por cima de tudo. Ouve o pedido
 * (reconhecimento de voz do Android), pergunta ao Claude o que fazer, executa
 * as ações no telefone e responde em voz alta.
 *
 * Também é aberto pelo sistema como "assistente digital" (tocar sem soltar no
 * botão ligar/início), se a app estiver escolhida para isso.
 */
public class AssistActivity extends Activity {
    private static final int REQ_PERMISSION = 1;
    private static final long FINISH_DELAY_MS = 2500;

    private static volatile boolean showing;

    /** O WakeWordService larga o microfone enquanto isto for verdade. */
    static boolean isShowing() {
        return showing;
    }

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Runnable finisher = this::finish;

    private OrbView orb;
    private TextView heardView;
    private TextView replyView;
    private TextView hintView;
    private View confirmRow;
    private TextView confirmText;

    private SpeechRecognizer recognizer;
    private boolean listeningForConfirmation;
    private TextToSpeech tts;
    private boolean ttsReady;
    private boolean speaking;
    private int utterance;
    private Runnable afterSpeech;

    private DeviceActions actions;
    /** Só é usado na thread `worker` (criado lá, para não atrasar a abertura). */
    private volatile ClaudeBrain brain;
    private boolean hasKey;

    // Ações da resposta atual.
    private final ArrayDeque<ToolCall> queue = new ArrayDeque<>();
    private final List<ClaudeBrain.ToolResult> results = new ArrayList<>();
    private boolean leavesAssistant;
    private boolean hadError;
    private boolean cancelled;
    private boolean localMode;
    private int toolRounds;
    private String lastSpoken = "";

    // ───────────────────────────── ciclo de vida ─────────────────────────────

    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showing = true;
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        setContentView(R.layout.activity_assist);
        orb = findViewById(R.id.orb);
        heardView = findViewById(R.id.heard);
        replyView = findViewById(R.id.reply);
        hintView = findViewById(R.id.hint);
        confirmRow = findViewById(R.id.confirm_row);
        confirmText = findViewById(R.id.confirm_text);

        findViewById(R.id.root).setOnClickListener(v -> finish());
        findViewById(R.id.btn_close).setOnClickListener(v -> finish());
        findViewById(R.id.btn_mic).setOnClickListener(v -> {
            stopSpeaking();
            listen(false);
        });
        findViewById(R.id.btn_yes).setOnClickListener(v -> answerConfirmation(true));
        findViewById(R.id.btn_no).setOnClickListener(v -> answerConfirmation(false));

        actions = new DeviceActions(this);
        String key = Prefs.apiKey(this);
        hasKey = !key.isEmpty();
        if (hasKey) {
            String model = Prefs.model(this);
            worker.execute(() -> {
                try {
                    brain = new ClaudeBrain(key, model);
                } catch (RuntimeException e) {
                    Diagnostics.add("Não consegui preparar o Claude: " + e.getMessage());
                }
            });
        } else {
            hintView.setText("Sem chave da API: só percebo comandos simples.");
        }
        tts = new TextToSpeech(this, this::onTtsReady);

        // Dá tempo ao WakeWordService para largar o microfone.
        ui.postDelayed(() -> listen(false), 350);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Disseram "Hey Claude" (ou carregaram no botão) outra vez: nova pergunta.
        stopSpeaking();
        if (confirmRow.getVisibility() != View.VISIBLE) listen(false);
    }

    @Override
    protected void onStop() {
        super.onStop();
        // Saiu para outra app: termina quando acabar de falar.
        if (!isFinishing()) whenSpeechDone(this::finish);
    }

    @Override
    protected void onDestroy() {
        showing = false;
        WakeWordService.pauseFor(1500); // não ouvir o fim da nossa própria voz
        ui.removeCallbacksAndMessages(null);
        if (recognizer != null) recognizer.destroy();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        worker.execute(() -> {
            if (brain != null) brain.close();
        });
        worker.shutdown();
        super.onDestroy();
    }

    // ─────────────────────────────── ouvir ───────────────────────────────

    private void listen(boolean forConfirmation) {
        ui.removeCallbacks(finisher);
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            showReply("Preciso da permissão do microfone.");
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_PERMISSION);
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            showReply("Este telemóvel não tem reconhecimento de voz. Instala ou atualiza a app Google.");
            orb.setState(OrbView.State.IDLE);
            return;
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(listener);
        } else {
            recognizer.cancel();
        }
        listeningForConfirmation = forConfirmation;
        orb.setState(OrbView.State.LISTENING);
        if (!forConfirmation) {
            heardView.setText("A ouvir…");
            replyView.setText("");
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, speechLanguage())
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        recognizer.startListening(intent);
    }

    private static String speechLanguage() {
        Locale l = Locale.getDefault();
        return "pt".equals(l.getLanguage()) ? l.toLanguageTag() : "pt-PT";
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onRmsChanged(float rmsdB) {
            orb.setRms(rmsdB);
        }

        @Override
        public void onEndOfSpeech() {
            orb.setRms(0);
        }

        @Override
        public void onPartialResults(Bundle partial) {
            String text = first(partial);
            if (!listeningForConfirmation && !text.isEmpty()) heardView.setText(text);
        }

        @Override
        public void onResults(Bundle bundle) {
            String text = first(bundle);
            if (listeningForConfirmation) {
                onConfirmationSpoken(text);
            } else if (text.isEmpty()) {
                nothingHeard();
            } else {
                onUtterance(text);
            }
        }

        @Override
        public void onError(int error) {
            orb.setState(OrbView.State.IDLE);
            if (listeningForConfirmation) {
                hintView.setText("Toca em Confirmar ou Cancelar.");
                return;
            }
            switch (error) {
                case SpeechRecognizer.ERROR_NO_MATCH:
                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                    nothingHeard();
                    break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                    showReply("Sem internet para perceber a voz.");
                    ui.postDelayed(finisher, FINISH_DELAY_MS * 2);
                    break;
                case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                    ui.postDelayed(() -> listen(false), 600);
                    break;
                default:
                    showReply("O reconhecimento de voz falhou (erro " + error + ").");
                    ui.postDelayed(finisher, FINISH_DELAY_MS * 2);
            }
        }
    };

    private static String first(Bundle bundle) {
        if (bundle == null) return "";
        ArrayList<String> list = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return list == null || list.isEmpty() || list.get(0) == null ? "" : list.get(0).trim();
    }

    private void nothingHeard() {
        heardView.setText("Não ouvi nada.");
        hintView.setText("Toca em Falar para tentar outra vez.");
        ui.postDelayed(finisher, FINISH_DELAY_MS * 2);
    }

    // ───────────────────────────── perceber ─────────────────────────────

    /** O utilizador disse um pedido. */
    void onUtterance(String text) {
        heardView.setText(text);
        Diagnostics.add("Pedido: «" + text + "»");
        if (!hasKey) {
            localMode = true;
            startActions("", Collections.singletonList(LocalCommands.parse(text)));
        } else {
            think(() -> brain.send(text));
        }
    }

    private void think(Callable<ClaudeBrain.Reply> request) {
        orb.setState(OrbView.State.THINKING);
        replyView.setText("");
        worker.execute(() -> {
            try {
                ClaudeBrain.Reply reply = request.call();
                ui.post(() -> onReply(reply));
            } catch (ClaudeBrain.BrainException e) {
                ui.post(() -> onBrainError(e.getMessage()));
            } catch (Exception e) {
                ui.post(() -> onBrainError("Não consegui falar com o Claude."));
            }
        });
    }

    private void onReply(ClaudeBrain.Reply reply) {
        if (isFinishing() || isDestroyed()) return;
        if (reply.calls.isEmpty()) {
            String text = reply.text.isEmpty() ? "Feito." : reply.text;
            showReply(text);
            speak(text, () -> {
                if (text.endsWith("?")) listen(false);
                else ui.postDelayed(finisher, FINISH_DELAY_MS);
            });
            return;
        }
        startActions(reply.text, reply.calls);
    }

    private void onBrainError(String message) {
        if (isFinishing() || isDestroyed()) return;
        Diagnostics.add("Claude: " + message);
        showReply(message);
        speak(message, () -> ui.postDelayed(finisher, FINISH_DELAY_MS));
    }

    // ───────────────────────────── ações ─────────────────────────────

    private void startActions(String spokenIntro, List<ToolCall> calls) {
        queue.clear();
        queue.addAll(calls);
        results.clear();
        leavesAssistant = false;
        hadError = false;
        cancelled = false;
        lastSpoken = "";
        if (!spokenIntro.isEmpty()) {
            showReply(spokenIntro);
            speak(spokenIntro, null);
        }
        KeyguardManager km = getSystemService(KeyguardManager.class);
        if (Build.VERSION.SDK_INT >= 26 && km != null && km.isKeyguardLocked()) {
            // Nada de mexer no telemóvel com ele bloqueado: pede o desbloqueio primeiro.
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override
                public void onDismissSucceeded() {
                    processNext();
                }

                @Override
                public void onDismissCancelled() {
                    finishWith("Desbloqueia o telemóvel para eu fazer isso.");
                }

                @Override
                public void onDismissError() {
                    finishWith("Desbloqueia o telemóvel para eu fazer isso.");
                }
            });
        } else {
            processNext();
        }
    }

    private void processNext() {
        if (isFinishing() || isDestroyed()) return;
        ToolCall call = queue.peek();
        if (call == null) {
            finishRound();
            return;
        }
        Diagnostics.add("Ação: " + call);
        if (Tools.needsConfirmation(call.name)) {
            Object question = actions.describeForConfirmation(call);
            if (question instanceof DeviceActions.Result) {
                handleResult(call, (DeviceActions.Result) question);
            } else {
                whenSpeechDone(() -> askConfirmation((String) question));
            }
            return;
        }
        handleResult(call, actions.execute(call));
    }

    private void handleResult(ToolCall call, DeviceActions.Result result) {
        if (result.missingPermission != null
                && checkSelfPermission(result.missingPermission) != PackageManager.PERMISSION_GRANTED) {
            showReply(result.message);
            requestPermissions(new String[]{result.missingPermission}, REQ_PERMISSION);
            return; // onRequestPermissionsResult volta a tentar esta ação
        }
        queue.poll();
        results.add(new ClaudeBrain.ToolResult(call.id, result.message, !result.ok));
        if (result.ok && result.leavesAssistant) leavesAssistant = true;
        if (!result.ok) hadError = true;
        processNext();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(requestCode, permissions, grants);
        boolean granted = grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED;
        if (Manifest.permission.RECORD_AUDIO.equals(permissions.length > 0 ? permissions[0] : "")) {
            if (granted) listen(false);
            else finishWith("Sem o microfone não te consigo ouvir.");
            return;
        }
        ToolCall call = queue.peek();
        if (call == null) return;
        if (granted) {
            processNext();
        } else {
            queue.poll();
            results.add(new ClaudeBrain.ToolResult(call.id, "O utilizador não deu a permissão.", true));
            hadError = true;
            processNext();
        }
    }

    private void askConfirmation(String question) {
        confirmText.setText(question);
        confirmRow.setVisibility(View.VISIBLE);
        hintView.setText("Diz «sim» ou «não», ou toca num botão.");
        speak(question, () -> listen(true));
    }

    private void onConfirmationSpoken(String text) {
        String t = DeviceActions.normalize(text);
        if (t.matches("^(sim|envia|enviar|manda|mandar|pode|podes|confirmo|confirma|confirmar|ok|"
                + "okay|claro|liga|ligar|isso|exato|yes)\\b.*")) {
            answerConfirmation(true);
        } else if (t.matches("^(nao|cancela|cancelar|para|parar|esquece|no)\\b.*")) {
            answerConfirmation(false);
        } else {
            orb.setState(OrbView.State.IDLE);
            hintView.setText("Não percebi. Toca em Confirmar ou Cancelar.");
        }
    }

    private void answerConfirmation(boolean yes) {
        if (confirmRow.getVisibility() != View.VISIBLE) return;
        confirmRow.setVisibility(View.GONE);
        hintView.setText("");
        if (recognizer != null) recognizer.cancel();
        ToolCall call = queue.peek();
        if (call == null) return;
        if (yes) {
            handleResult(call, actions.execute(call));
        } else {
            queue.poll();
            results.add(new ClaudeBrain.ToolResult(call.id, "O utilizador cancelou.", false));
            cancelled = true;
            processNext();
        }
    }

    /** Todas as ações desta resposta foram tratadas. */
    private void finishRound() {
        if (!localMode && hasKey && hadError && toolRounds < 3) {
            // Algo falhou: o Claude explica ou tenta de outra forma.
            toolRounds++;
            List<ClaudeBrain.ToolResult> sent = new ArrayList<>(results);
            think(() -> brain.sendToolResults(sent));
            return;
        }
        if (hasKey) {
            List<ClaudeBrain.ToolResult> done = new ArrayList<>(results);
            worker.execute(() -> {
                if (brain != null) brain.recordToolResults(done);
            });
        }
        String say = null;
        if (cancelled) {
            say = "Cancelado.";
        } else if (localMode || lastSpoken.isEmpty()) {
            // Sem o Claude (ou ele não disse nada): lê o resultado da última ação.
            ClaudeBrain.ToolResult last = results.isEmpty() ? null : results.get(results.size() - 1);
            if (last != null && (last.isError || !leavesAssistant)) say = last.content;
        }
        if (say != null) {
            showReply(say);
            speak(say, null);
        }
        whenSpeechDone(() -> ui.postDelayed(finisher, leavesAssistant ? 300 : FINISH_DELAY_MS));
    }

    private void finishWith(String message) {
        showReply(message);
        speak(message, () -> ui.postDelayed(finisher, FINISH_DELAY_MS));
    }

    private void showReply(String text) {
        replyView.setText(text);
    }

    // ─────────────────────────────── falar ───────────────────────────────

    private void onTtsReady(int status) {
        if (status != TextToSpeech.SUCCESS || tts == null) return;
        int lang = tts.setLanguage(new Locale("pt", "PT"));
        if (lang < 0) tts.setLanguage(Locale.getDefault());
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}

            @Override
            public void onDone(String id) {
                ui.post(() -> speechFinished(id));
            }

            @Override
            @SuppressWarnings("deprecation")
            public void onError(String id) {
                ui.post(() -> speechFinished(id));
            }
        });
        ttsReady = true;
    }

    private void speak(String text, Runnable then) {
        lastSpoken = text;
        if (text.isEmpty() || !ttsReady) {
            if (then != null) ui.postDelayed(then, text.isEmpty() ? 0 : 400);
            return;
        }
        speaking = true;
        afterSpeech = then;
        orb.setState(OrbView.State.SPEAKING);
        String id = "u" + (++utterance);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
    }

    private void speechFinished(String id) {
        if (!id.equals("u" + utterance)) return;
        speaking = false;
        orb.setState(OrbView.State.IDLE);
        Runnable next = afterSpeech;
        afterSpeech = null;
        if (next != null) next.run();
    }

    /** Corre `r` quando acabar de falar (ou já, se não estiver a falar). */
    private void whenSpeechDone(Runnable r) {
        if (!speaking) {
            r.run();
            return;
        }
        Runnable previous = afterSpeech;
        afterSpeech = () -> {
            if (previous != null) previous.run();
            r.run();
        };
    }

    private void stopSpeaking() {
        if (tts != null && speaking) tts.stop();
        speaking = false;
        afterSpeech = null;
    }
}
