#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instala o Hey Claude no Windows (é chamado pelo instalar.bat).

1. Copia o programa para %LOCALAPPDATA%\\HeyClaude
2. Cria um ambiente Python próprio e instala o Vosk e o sounddevice
3. Descarrega o modelo de reconhecimento de voz (~40 MB, só da primeira vez)
4. Regista o programa para arrancar com o Windows e põe-no a correr já
"""
import os
import shutil
import struct
import subprocess
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
APP_FILES = ["hey_claude.py", "requirements.txt", "README.md"]
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
RUN_VALUE = "HeyClaude"


def run(cmd):
    subprocess.check_call([str(c) for c in cmd])


def set_autostart(command: str) -> None:
    import winreg
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as key:
        winreg.SetValueEx(key, RUN_VALUE, 0, winreg.REG_SZ, command)


def main() -> int:
    if sys.platform != "win32":
        print("Este instalador é para Windows.")
        return 1
    if sys.version_info < (3, 8) or struct.calcsize("P") != 8:
        print("É preciso o Python 3.8 ou mais recente, versão de 64 bits.")
        return 1
    if "WindowsApps" in sys.executable:
        # O Python da Microsoft Store grava o registo e o AppData numa cópia
        # privada, por isso o arranque automático não funcionaria.
        print("O Python da Microsoft Store não serve para isto. Instala o de python.org")
        print("(ou corre: winget install -e --id Python.Python.3.12) e volta a tentar.")
        return 1

    dest = Path(os.environ["LOCALAPPDATA"]) / "HeyClaude"
    venv_dir = dest / "venv"
    python = venv_dir / "Scripts" / "python.exe"
    pythonw = venv_dir / "Scripts" / "pythonw.exe"
    script = dest / "hey_claude.py"
    print(f"A instalar o Hey Claude em {dest}\n")

    # Se já estiver instalado e a correr, pára-o (senão o pip não consegue
    # substituir ficheiros em uso).
    if python.exists() and script.exists():
        subprocess.run([str(python), str(script), "--parar"], check=False)

    dest.mkdir(parents=True, exist_ok=True)
    for name in APP_FILES:
        shutil.copy2(SRC_DIR / name, dest / name)
    if (dest / "config.json").exists():
        print("(A tua config.json foi mantida.)")
    else:
        shutil.copy2(SRC_DIR / "config.json", dest / "config.json")

    print("[1/4] A preparar o ambiente Python...")
    if not python.exists():
        run([sys.executable, "-m", "venv", venv_dir])

    print("[2/4] A instalar as dependências (vosk, sounddevice)...")
    run([python, "-m", "pip", "install", "--disable-pip-version-check", "--upgrade",
         "-r", dest / "requirements.txt"])

    print("[3/4] A descarregar o modelo de reconhecimento de voz (só da primeira vez)...")
    run([python, script, "--baixar-modelo"])

    print("[4/4] A configurar o arranque automático com o Windows...")
    set_autostart(f'"{pythonw}" "{script}"')
    subprocess.Popen([str(pythonw), str(script)], cwd=str(dest), close_fds=True,
                     creationflags=0x00000008 | 0x00000200)  # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP

    print(f"""
==============================================================
  Hey Claude instalado e a correr!

  Diz "Hey Claude" (ou "Hey Cloud") perto do microfone.
  Vais ouvir um "bip", o Claude abre e o ditado do Windows
  liga-se para falares a tua pergunta.

  Arranca sozinho sempre que ligares o computador.
  Configuração: {dest / "config.json"}
  Problemas?    corre o diagnostico.bat
==============================================================""")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as e:
        print(f"\n[ERRO] Falhou o passo: {' '.join(map(str, e.cmd))}")
        print("Verifica a ligação à internet e volta a correr o instalar.bat.")
        sys.exit(1)
