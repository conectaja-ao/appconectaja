@echo off
setlocal
title Hey Claude - Testar
set "APP=%LOCALAPPDATA%\HeyClaude"

if not exist "%APP%\venv\Scripts\python.exe" (
  echo  O Hey Claude ainda nao esta instalado. Corre primeiro o instalar.bat
  pause
  exit /b 1
)

echo  A abrir o Claude como se tivesses dito "Hey Claude"...
"%APP%\venv\Scripts\python.exe" "%APP%\hey_claude.py" --testar
