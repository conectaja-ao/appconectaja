@echo off
setlocal
title Hey Claude - Diagnostico
set "APP=%LOCALAPPDATA%\HeyClaude"

if not exist "%APP%\venv\Scripts\python.exe" (
  echo  O Hey Claude ainda nao esta instalado. Corre primeiro o instalar.bat
  pause
  exit /b 1
)

"%APP%\venv\Scripts\python.exe" "%APP%\hey_claude.py" --consola
pause
