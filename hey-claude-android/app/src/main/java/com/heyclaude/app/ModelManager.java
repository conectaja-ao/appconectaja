package com.heyclaude.app;

import android.content.Context;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Modelo de reconhecimento de voz do Vosk (inglês, ~40 MB). Não vem dentro da
 * APK (ficaria grande demais): é descarregado uma vez e guardado na app.
 */
final class ModelManager {
    static final String MODEL_NAME = "vosk-model-small-en-us-0.15";
    /** Pode ser trocado nos testes. */
    static String modelUrl = "https://alphacephei.com/vosk/models/" + MODEL_NAME + ".zip";

    interface Cancelled {
        boolean get();
    }

    /** Progresso da descarga em curso: -1 = nenhuma, 0 a 100 = percentagem. */
    private static volatile int progress = -1;
    private static volatile String lastError;

    private ModelManager() {}

    static File modelDir(Context c) {
        return new File(c.getFilesDir(), "model");
    }

    static boolean isReady(Context c) {
        return new File(modelDir(c), "am/final.mdl").isFile()
                && new File(modelDir(c), "uuid").isFile();
    }

    static int progress() {
        return progress;
    }

    static String lastError() {
        return lastError;
    }

    /** Descarrega o modelo se ainda não existir. Bloqueia; não chamar na thread principal. */
    static synchronized void ensure(Context c, Cancelled cancelled) throws IOException {
        if (isReady(c)) return;
        lastError = null;
        progress = 0;
        File zip = new File(c.getCacheDir(), "model.zip");
        File tmp = new File(c.getFilesDir(), "model.tmp");
        try {
            download(zip, cancelled);
            deleteRecursively(tmp);
            try (InputStream in = new java.io.FileInputStream(zip)) {
                extract(in, tmp, MODEL_NAME + "/");
            }
            if (!new File(tmp, "am/final.mdl").isFile()) {
                throw new IOException("o ficheiro descarregado não tem o modelo");
            }
            write(new File(tmp, "uuid"), MODEL_NAME);
            File dir = modelDir(c);
            deleteRecursively(dir);
            if (!tmp.renameTo(dir)) {
                throw new IOException("não foi possível guardar o modelo");
            }
        } catch (IOException e) {
            lastError = e.getMessage();
            throw e;
        } finally {
            progress = -1;
            //noinspection ResultOfMethodCallIgnored
            zip.delete();
            deleteRecursively(tmp);
        }
    }

    private static void download(File target, Cancelled cancelled) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(modelUrl).openConnection();
        conn.setConnectTimeout(15_000);
        conn.setReadTimeout(30_000);
        try {
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                throw new IOException("o servidor respondeu " + conn.getResponseCode());
            }
            long total = conn.getContentLengthLong();
            long done = 0;
            byte[] buffer = new byte[64 * 1024];
            try (InputStream in = conn.getInputStream();
                 OutputStream out = new FileOutputStream(target)) {
                int n;
                while ((n = in.read(buffer)) > 0) {
                    if (cancelled.get()) throw new IOException("descarga cancelada");
                    out.write(buffer, 0, n);
                    done += n;
                    if (total > 0) progress = (int) Math.min(99, done * 100 / total);
                }
            }
        } finally {
            conn.disconnect();
        }
    }

    /** Extrai o zip para `target`, tirando o prefixo da pasta de topo. */
    static void extract(InputStream zipStream, File target, String stripPrefix) throws IOException {
        String targetPath = target.getCanonicalPath() + File.separator;
        try (ZipInputStream zip = new ZipInputStream(zipStream)) {
            ZipEntry entry;
            byte[] buffer = new byte[64 * 1024];
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.startsWith(stripPrefix)) name = name.substring(stripPrefix.length());
                if (name.isEmpty()) continue;
                File out = new File(target, name);
                // Proteção contra entradas com "../" que escapariam da pasta.
                if (!out.getCanonicalPath().startsWith(targetPath)) {
                    throw new IOException("entrada inválida no zip: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    //noinspection ResultOfMethodCallIgnored
                    out.mkdirs();
                    continue;
                }
                //noinspection ResultOfMethodCallIgnored
                out.getParentFile().mkdirs();
                try (OutputStream os = new FileOutputStream(out)) {
                    int n;
                    while ((n = zip.read(buffer)) > 0) os.write(buffer, 0, n);
                }
            }
        }
    }

    private static void write(File f, String text) throws IOException {
        try (OutputStream os = new FileOutputStream(f)) {
            os.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private static void deleteRecursively(File f) {
        File[] children = f.listFiles();
        if (children != null) {
            for (File child : children) deleteRecursively(child);
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
