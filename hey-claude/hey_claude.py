#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hey Claude — ativação por voz para o Claude no Windows.

Fica a ouvir o microfone em segundo plano (100% offline, com o Vosk) e,
quando ouve "Hey Claude" (ou "Hey Cloud"), abre o Claude — a app de
desktop, se estiver instalada, ou o claude.ai no navegador — e liga o
ditado por voz do Windows (Win+H) para poderes falar logo a tua pergunta.

Uso:
  pythonw hey_claude.py                 corre em segundo plano (usado no arranque do Windows)
  python  hey_claude.py --consola       mostra no ecrã o que está a ouvir (diagnóstico)
  python  hey_claude.py --testar        abre o Claude agora, como se tivesses dito "Hey Claude"
  python  hey_claude.py --parar         pára a instância que está a correr em segundo plano
  python  hey_claude.py --baixar-modelo descarrega só o modelo de voz
  python  hey_claude.py --wav A.wav ... procura a frase de ativação em ficheiros WAV
"""
from __future__ import annotations

import argparse
import json
import logging
import logging.handlers
import os
import queue
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import wave
import webbrowser
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

APP_DIR = Path(__file__).resolve().parent
CONFIG_PATH = APP_DIR / "config.json"
MODEL_DIR = APP_DIR / "modelo"
STOP_FLAG = APP_DIR / "parar.flag"
LOG_PATH = APP_DIR / "hey_claude.log"
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
MUTEX_NAME = "Local\\HeyClaude-wakeword"
IS_WINDOWS = sys.platform == "win32"

DEFAULT_CONFIG = {
    # Frases que ativam o assistente (palavras em inglês, minúsculas).
    "frases_ativacao": ["hey claude", "hey cloud", "hi claude", "okay claude"],
    # 0 a 1. Mais alto = menos ativações falsas, mas pode exigir pronúncia mais clara.
    "confianca_minima": 0.6,
    # "auto" (app de desktop se existir, senão navegador), "app" ou "web".
    "abrir": "auto",
    "url_web": "https://claude.ai/new",
    # Caminho para o executável do Claude, se estiver num sítio fora do normal.
    "caminho_app": "",
    # Atalho carregado depois de a janela do Claude estar à frente ("" para nenhum).
    # "win+h" liga o ditado por voz do Windows, para falares a pergunta.
    "atalho_apos_abrir": "win+h",
    "atraso_atalho_segundos": 1.5,
    "espera_maxima_janela_segundos": 15,
    "som_confirmacao": True,
    "pausa_apos_ativacao_segundos": 8,
    # null = microfone padrão do Windows; ou parte do nome / número do dispositivo.
    "microfone": None,
}

# Palavras com som parecido às frases de ativação. Entram na gramática do
# reconhecedor para "absorverem" falas como "they called" ou "hey, call me",
# que de outra forma seriam forçadas a encaixar em "hey cloud".
DISTRACTORS = ["they", "called", "call", "cold", "clown", "clue", "club", "hello"]
# Pausa máxima (segundos) entre as palavras da frase de ativação.
MAX_WORD_GAP = 0.6

log = logging.getLogger("hey_claude")


# ───────────────────────── configuração e registo ─────────────────────────

def setup_logging(to_console: bool) -> None:
    log.setLevel(logging.INFO)
    try:
        fh = logging.handlers.RotatingFileHandler(
            LOG_PATH, maxBytes=512_000, backupCount=1, encoding="utf-8")
        fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s",
                                          "%Y-%m-%d %H:%M:%S"))
        log.addHandler(fh)
    except OSError:
        pass
    # Com pythonw não há consola: sys.stderr é None.
    if to_console and sys.stderr is not None:
        sh = logging.StreamHandler()
        sh.setFormatter(logging.Formatter("%(message)s"))
        log.addHandler(sh)


def config_mtime() -> float:
    try:
        return CONFIG_PATH.stat().st_mtime
    except OSError:
        return 0.0


def load_config() -> dict:
    cfg = dict(DEFAULT_CONFIG)
    if CONFIG_PATH.exists():
        try:
            # utf-8-sig: o Bloco de Notas às vezes grava com BOM.
            with open(CONFIG_PATH, encoding="utf-8-sig") as f:
                user = json.load(f)
            cfg.update({k: v for k, v in user.items() if k in DEFAULT_CONFIG})
        except (OSError, ValueError) as e:
            log.error("config.json inválido (%s); a usar a configuração padrão.", e)
    return cfg


# ───────────────────────────── modelo de voz ──────────────────────────────

def model_ready() -> bool:
    return (MODEL_DIR / "am" / "final.mdl").is_file()


_last_pct = -1


def _download_progress(blocks: int, block_size: int, total: int) -> None:
    global _last_pct
    if total > 0 and sys.stdout is not None:
        pct = min(100, blocks * block_size * 100 // total)
        if pct != _last_pct:
            _last_pct = pct
            print(f"\r  {pct:3d}%", end="" if pct < 100 else "\n", flush=True)


def ensure_model() -> None:
    if model_ready():
        return
    log.info("A descarregar o modelo de voz (~40 MB)...")
    with tempfile.TemporaryDirectory(dir=APP_DIR) as tmp:
        zip_path = Path(tmp) / "modelo.zip"
        urllib.request.urlretrieve(MODEL_URL, zip_path, _download_progress)
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(tmp)
        inner = next(p for p in Path(tmp).iterdir() if p.is_dir())
        if MODEL_DIR.exists():
            shutil.rmtree(MODEL_DIR)
        shutil.move(str(inner), str(MODEL_DIR))
    log.info("Modelo de voz pronto.")


def load_model():
    from vosk import Model, SetLogLevel
    SetLogLevel(-1)
    return Model(str(MODEL_DIR))


# ─────────────────────────── deteção da frase ─────────────────────────────

@dataclass
class Heard:
    text: str                 # o que o Vosk reconheceu (ex.: "[unk] hey claude")
    phrase: Optional[str]     # frase de ativação encontrada, se alguma
    confidence: float         # confiança dessa frase (0 a 1)
    activated: bool


class WakeWordDetector:
    """Reconhecedor do Vosk limitado às frases de ativação, a palavras parecidas
    e a "[unk]" (qualquer outra fala)."""

    def __init__(self, model, sample_rate: float, phrases: List[str], min_confidence: float):
        from vosk import KaldiRecognizer
        self.phrases: List[List[str]] = []
        for phrase in phrases:
            words = str(phrase).lower().split()
            missing = [w for w in words if model.vosk_model_find_word(w) < 0]
            if missing:
                log.warning("Frase %r ignorada: o modelo não conhece %s.", phrase, ", ".join(missing))
            elif words:
                self.phrases.append(words)
        if not self.phrases:
            raise ValueError("Nenhuma frase de ativação válida em config.json.")
        self.min_confidence = float(min_confidence)
        wake_words = {w for p in self.phrases for w in p}
        fillers = [w for w in DISTRACTORS
                   if w not in wake_words and model.vosk_model_find_word(w) >= 0]
        grammar = [" ".join(p) for p in self.phrases] + fillers + ["[unk]"]
        self.rec = KaldiRecognizer(model, float(sample_rate), json.dumps(grammar))
        self.rec.SetWords(True)

    def feed(self, data: bytes) -> Optional[Heard]:
        """Recebe áudio PCM 16-bit mono; devolve um Heard no fim de cada frase falada."""
        if self.rec.AcceptWaveform(data):
            return self._match(json.loads(self.rec.Result()))
        return None

    def finish(self) -> Optional[Heard]:
        return self._match(json.loads(self.rec.FinalResult()))

    def _match(self, result: dict) -> Optional[Heard]:
        text = result.get("text", "")
        if not text:
            return None
        words = result.get("result") or []
        tokens = [w.get("word") for w in words]
        best_phrase, best_conf = None, 0.0
        for phrase in self.phrases:
            n = len(phrase)
            for i in range(len(tokens) - n + 1):
                span = words[i:i + n]
                if tokens[i:i + n] != phrase:
                    continue
                gaps = [b.get("start", 0.0) - a.get("end", 0.0) for a, b in zip(span, span[1:])]
                if any(g > MAX_WORD_GAP for g in gaps):
                    continue
                conf = min(w.get("conf", 0.0) for w in span)
                if best_phrase is None or conf > best_conf:
                    best_phrase, best_conf = " ".join(phrase), conf
        activated = best_phrase is not None and best_conf >= self.min_confidence
        return Heard(text, best_phrase, best_conf, activated)


# ─────────────────────────── ações no Windows ─────────────────────────────

VK_NAMES = {
    "ctrl": 0x11, "control": 0x11, "alt": 0x12, "shift": 0x10,
    "win": 0x5B, "windows": 0x5B, "space": 0x20, "espaco": 0x20, "espaço": 0x20,
    "enter": 0x0D, "tab": 0x09, "esc": 0x1B, "escape": 0x1B,
    "up": 0x26, "down": 0x28, "left": 0x25, "right": 0x27,
    "home": 0x24, "end": 0x23, "pageup": 0x21, "pagedown": 0x22,
    "insert": 0x2D, "delete": 0x2E,
}
VK_EXTENDED = {0x5B, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2D, 0x2E}


def parse_hotkey(text: str) -> List[int]:
    """Converte "ctrl+alt+space" em códigos de tecla virtuais do Windows."""
    keys = []
    for part in text.lower().replace(" ", "").split("+"):
        if part in VK_NAMES:
            keys.append(VK_NAMES[part])
        elif len(part) == 1 and part.isascii() and part.isalnum():
            keys.append(ord(part.upper()))
        elif re.fullmatch(r"f([1-9]|1[0-9]|2[0-4])", part):
            keys.append(0x6F + int(part[1:]))
        else:
            raise ValueError(f"tecla desconhecida no atalho {text!r}: {part!r}")
    return keys


_USER32 = None


def _user32():
    """user32.dll com os tipos dos argumentos declarados (handles de 64 bits)."""
    global _USER32
    if _USER32 is None:
        import ctypes
        from ctypes import wintypes
        u = ctypes.WinDLL("user32", use_last_error=True)
        u.WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        u.EnumWindows.argtypes = [u.WNDENUMPROC, wintypes.LPARAM]
        u.IsWindowVisible.argtypes = [wintypes.HWND]
        u.GetWindowTextLengthW.argtypes = [wintypes.HWND]
        u.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
        u.IsIconic.argtypes = [wintypes.HWND]
        u.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
        u.SetForegroundWindow.argtypes = [wintypes.HWND]
        u.GetForegroundWindow.restype = wintypes.HWND
        u.keybd_event.argtypes = [ctypes.c_ubyte, ctypes.c_ubyte, wintypes.DWORD, ctypes.c_size_t]
        _USER32 = u
    return _USER32


def _key(vk: int, up: bool = False) -> None:
    flags = (0x1 if vk in VK_EXTENDED else 0) | (0x2 if up else 0)  # EXTENDEDKEY | KEYUP
    _user32().keybd_event(vk, 0, flags, 0)


def send_hotkey(text: str) -> None:
    if not IS_WINDOWS:
        log.info("(simulação) atalho %s", text)
        return
    keys = parse_hotkey(text)
    for vk in keys:
        _key(vk)
        time.sleep(0.02)
    for vk in reversed(keys):
        _key(vk, up=True)
        time.sleep(0.02)


def play_chime() -> None:
    if not IS_WINDOWS:
        return

    def beep():
        try:
            import winsound
            winsound.Beep(880, 90)
            winsound.Beep(1320, 130)
        except (RuntimeError, OSError):
            pass
    threading.Thread(target=beep, daemon=True).start()


def desktop_app_candidates(custom: str) -> List[Path]:
    paths = []
    if custom:
        paths.append(Path(os.path.expandvars(custom)))
    local = os.environ.get("LOCALAPPDATA")
    if local:
        paths.append(Path(local, "AnthropicClaude", "claude.exe"))
        paths.append(Path(local, "Programs", "Claude", "Claude.exe"))
    for var in ("ProgramFiles", "ProgramFiles(x86)"):
        if os.environ.get(var):
            paths.append(Path(os.environ[var], "Claude", "Claude.exe"))
    return paths


def _protocol_registered(name: str) -> bool:
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, name) as key:
            winreg.QueryValueEx(key, "URL Protocol")
            return True
    except OSError:
        return False


def launch_desktop_app(custom: str) -> bool:
    if not IS_WINDOWS:
        return False
    # Nota: não procuramos "claude" no PATH — esse costuma ser o Claude Code (linha de comandos).
    for exe in desktop_app_candidates(custom):
        if exe.is_file():
            subprocess.Popen([str(exe)], cwd=str(exe.parent), close_fds=True)
            return True
    if _protocol_registered("claude"):
        os.startfile("claude://")
        return True
    return False


# Janela do Claude: app de desktop ("Claude") ou separador do navegador ("... - Claude - Chrome").
_CLAUDE_TITLE = re.compile(r"(?<![\w-])Claude(?![\w-])")
_OWN_TITLE = re.compile(r"hey[ _-]?claude", re.IGNORECASE)


def _is_claude_title(title: str) -> bool:
    return bool(_CLAUDE_TITLE.search(title)) and not _OWN_TITLE.search(title)


def _find_claude_window():
    import ctypes
    user32 = _user32()
    found = []

    @user32.WNDENUMPROC
    def visit(hwnd, _lparam):
        if user32.IsWindowVisible(hwnd):
            n = user32.GetWindowTextLengthW(hwnd)
            if n:
                buf = ctypes.create_unicode_buffer(n + 1)
                user32.GetWindowTextW(hwnd, buf, n + 1)
                if _is_claude_title(buf.value):
                    found.append(hwnd)
                    return False
        return True

    user32.EnumWindows(visit, 0)
    return found[0] if found else None


def _bring_to_front(hwnd) -> bool:
    user32 = _user32()
    if user32.IsIconic(hwnd):
        user32.ShowWindow(hwnd, 9)  # SW_RESTORE
    # O Windows só deixa um processo em segundo plano trazer uma janela para a
    # frente logo a seguir a uma tecla Alt; simulamos uma.
    _key(0x12)
    user32.SetForegroundWindow(hwnd)
    _key(0x12, up=True)
    time.sleep(0.2)
    return user32.GetForegroundWindow() == hwnd


def focus_claude_window(timeout: float) -> bool:
    if not IS_WINDOWS:
        return False
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        hwnd = _find_claude_window()
        if hwnd and _bring_to_front(hwnd):
            return True
        time.sleep(0.5)
    return False


def open_claude(cfg: dict) -> str:
    mode = str(cfg.get("abrir") or "auto").lower()
    if mode in ("auto", "app"):
        if launch_desktop_app(str(cfg.get("caminho_app") or "")):
            log.info("A abrir a app de desktop do Claude.")
            return "app"
        if mode == "app":
            log.warning("App de desktop do Claude não encontrada; a abrir no navegador.")
    url = cfg.get("url_web") or DEFAULT_CONFIG["url_web"]
    log.info("A abrir %s no navegador.", url)
    webbrowser.open(url)
    return "web"


def activate(cfg: dict) -> None:
    try:
        if cfg.get("som_confirmacao"):
            play_chime()
        open_claude(cfg)
        hotkey = str(cfg.get("atalho_apos_abrir") or "").strip()
        if not IS_WINDOWS:
            return
        if focus_claude_window(float(cfg.get("espera_maxima_janela_segundos", 15))):
            if hotkey:
                time.sleep(float(cfg.get("atraso_atalho_segundos", 1.5)))
                send_hotkey(hotkey)
        elif hotkey:
            log.warning("A janela do Claude não ficou à frente; o atalho %s não foi enviado.", hotkey)
    except Exception:
        log.exception("Erro ao abrir o Claude.")


# ─────────────────────── instância única e paragem ────────────────────────

class SingleInstance:
    """Mutex com nome do Windows: garante que só corre um Hey Claude de cada vez."""

    def __init__(self):
        self.handle = None

    def acquire(self) -> bool:
        if not IS_WINDOWS:
            return True
        import ctypes
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.CreateMutexW.restype = ctypes.c_void_p
        self.handle = kernel32.CreateMutexW(None, False, MUTEX_NAME)
        return ctypes.get_last_error() != 183  # ERROR_ALREADY_EXISTS


def instance_running() -> bool:
    if not IS_WINDOWS:
        return False
    import ctypes
    kernel32 = ctypes.windll.kernel32
    kernel32.OpenMutexW.restype = ctypes.c_void_p
    handle = kernel32.OpenMutexW(0x00100000, False, MUTEX_NAME)  # SYNCHRONIZE
    if handle:
        kernel32.CloseHandle(ctypes.c_void_p(handle))
        return True
    return False


def should_stop() -> bool:
    return STOP_FLAG.exists()


def wait_or_stop(seconds: float) -> bool:
    """Espera `seconds`; devolve True se entretanto pediram para parar."""
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if should_stop():
            return True
        time.sleep(0.5)
    return should_stop()


def stop_running_instance(timeout: float = 10) -> bool:
    """Pede à instância em segundo plano para terminar. Devolve True se havia uma."""
    if not instance_running():
        return False
    STOP_FLAG.touch()
    deadline = time.monotonic() + timeout
    while instance_running() and time.monotonic() < deadline:
        time.sleep(0.25)
    if not instance_running():
        try:
            STOP_FLAG.unlink()
        except FileNotFoundError:
            pass
    return True


def start_background() -> None:
    exe = Path(sys.executable)
    pythonw = exe.with_name("pythonw.exe")
    flags = 0x00000008 | 0x00000200 if IS_WINDOWS else 0  # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    subprocess.Popen(
        [str(pythonw if IS_WINDOWS and pythonw.exists() else exe), str(Path(__file__).resolve())],
        cwd=str(APP_DIR), creationflags=flags, close_fds=True,
        stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# ──────────────────────────── ciclo principal ─────────────────────────────

def print_heard(heard: Heard, min_conf: float, paused: bool) -> None:
    if heard.phrase is None:
        print(f'  ouvi: "{heard.text}"  (não é a frase de ativação)', flush=True)
    elif heard.activated:
        print(f'  ouvi: "{heard.text}"  -> "{heard.phrase}" confiança {heard.confidence:.2f}'
              + ("  (em pausa: acabou de ativar)" if paused else "  >>> ATIVADO"), flush=True)
    else:
        print(f'  ouvi: "{heard.text}"  -> "{heard.phrase}" confiança {heard.confidence:.2f}'
              f'  (abaixo do mínimo {min_conf:.2f})', flush=True)


def listen(model, cfg: dict, cfg_mtime: float, console: bool) -> None:
    """Ouve o microfone até pedirem para parar ou o config.json mudar."""
    import sounddevice as sd

    device = cfg.get("microfone")
    info = sd.query_devices(device, "input")
    rate = int(info["default_samplerate"])
    detector = WakeWordDetector(model, rate, cfg["frases_ativacao"], cfg["confianca_minima"])
    hotkey = str(cfg.get("atalho_apos_abrir") or "").strip()
    if hotkey:
        parse_hotkey(hotkey)  # valida já, para o erro aparecer no registo

    audio: "queue.Queue[bytes]" = queue.Queue()

    def on_audio(indata, frames, time_info, status):
        audio.put(bytes(indata))

    cooldown_until = 0.0
    last_audio = last_cfg_check = time.monotonic()
    with sd.RawInputStream(samplerate=rate, blocksize=int(rate * 0.2), device=device,
                           dtype="int16", channels=1, callback=on_audio):
        log.info('A ouvir no microfone "%s". Diz "%s" para abrir o Claude.',
                 info["name"], " ".join(detector.phrases[0]))
        while not should_stop():
            now = time.monotonic()
            if now - last_cfg_check > 2:
                last_cfg_check = now
                if config_mtime() != cfg_mtime:
                    log.info("config.json alterado; a recarregar.")
                    return
            try:
                data = audio.get(timeout=0.5)
            except queue.Empty:
                if time.monotonic() - last_audio > 10:
                    raise RuntimeError("o microfone deixou de enviar áudio")
                continue
            last_audio = time.monotonic()
            heard = detector.feed(data)
            if heard is None:
                continue
            paused = last_audio < cooldown_until
            if console:
                print_heard(heard, detector.min_confidence, paused)
            if heard.activated and not paused:
                cooldown_until = last_audio + float(cfg["pausa_apos_ativacao_segundos"])
                log.info('Ouvi "%s" (confiança %.2f): a abrir o Claude.',
                         heard.phrase, heard.confidence)
                threading.Thread(target=activate, args=(cfg,), daemon=True).start()


def run_listener(console: bool) -> int:
    instance = SingleInstance()
    if not instance.acquire():
        log.info("O Hey Claude já está a correr.")
        return 0
    try:
        STOP_FLAG.unlink()
    except FileNotFoundError:
        pass

    while not model_ready():
        try:
            ensure_model()
        except Exception as e:
            log.error("Não consegui descarregar o modelo de voz (%s). Nova tentativa em 60 s.", e)
            if wait_or_stop(60):
                return 0
    model = load_model()

    while not should_stop():
        mtime = config_mtime()
        cfg = load_config()
        try:
            listen(model, cfg, mtime, console)
        except Exception as e:
            log.error("Erro ao ouvir o microfone (%s). Nova tentativa em 5 s.", e)
            if wait_or_stop(5):
                break
    log.info("Hey Claude terminado.")
    return 0


def scan_wav_files(paths: List[str]) -> int:
    ensure_model()
    model = load_model()
    cfg = load_config()
    for path in paths:
        with wave.open(path, "rb") as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
                print(f"{path}: precisa de ser WAV mono de 16 bits")
                continue
            detector = WakeWordDetector(model, wf.getframerate(), cfg["frases_ativacao"],
                                        cfg["confianca_minima"])
            results = []
            while True:
                data = wf.readframes(4000)
                if not data:
                    break
                heard = detector.feed(data)
                if heard:
                    results.append(heard)
            heard = detector.finish()
            if heard:
                results.append(heard)
        activated = any(h.activated for h in results)
        detail = "; ".join(
            f'"{h.text}"' + (f" ({h.phrase} {h.confidence:.2f})" if h.phrase else "")
            for h in results) or "(silêncio)"
        print(f"{'ATIVA ' if activated else 'nada  '} {path}: {detail}")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Abre o Claude quando dizes \"Hey Claude\".")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--consola", action="store_true",
                       help="mostra no ecrã o que o microfone está a ouvir")
    group.add_argument("--testar", action="store_true",
                       help="abre o Claude agora, como se tivesses dito a frase")
    group.add_argument("--parar", action="store_true",
                       help="pára a instância em segundo plano")
    group.add_argument("--baixar-modelo", action="store_true",
                       help="descarrega o modelo de voz e sai")
    group.add_argument("--wav", nargs="+", metavar="FICHEIRO",
                       help="procura a frase de ativação em ficheiros WAV")
    args = parser.parse_args(argv)
    setup_logging(to_console=True)

    if args.parar:
        if stop_running_instance():
            print("Hey Claude parado.")
        else:
            print("O Hey Claude não estava a correr.")
        return 0
    if args.baixar_modelo:
        ensure_model()
        return 0
    if args.testar:
        activate(load_config())
        return 0
    if args.wav:
        return scan_wav_files(args.wav)
    if args.consola:
        was_running = stop_running_instance()
        if was_running:
            print("(A instância em segundo plano foi pausada e volta quando saíres.)")
        print("Modo de diagnóstico — fala para o microfone. Ctrl+C para sair.\n")
        try:
            return run_listener(console=True)
        except KeyboardInterrupt:
            return 0
        finally:
            if was_running:
                start_background()
    try:
        return run_listener(console=False)
    except Exception:
        log.exception("Erro fatal; o Hey Claude parou.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
