@echo off
setlocal
title Hey Claude - Desinstalar
set "APP=%LOCALAPPDATA%\HeyClaude"

if exist "%APP%\venv\Scripts\python.exe" "%APP%\venv\Scripts\python.exe" "%APP%\hey_claude.py" --parar
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v HeyClaude /f >nul 2>&1
if exist "%APP%" rmdir /s /q "%APP%"

echo.
if exist "%APP%" (
  echo  Nao foi possivel apagar tudo. Reinicia o computador e apaga a pasta:
  echo  %APP%
) else (
  echo  Hey Claude desinstalado.
)
echo.
pause
