@echo off
setlocal
title Hey Claude - Instalacao
cd /d "%~dp0"

call :find_python
if not defined PY (
  echo.
  echo  Python nao encontrado. A instalar o Python 3.12 com o winget...
  echo.
  winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
  call :find_python
)
if not defined PY (
  echo.
  echo  [ERRO] Nao consegui encontrar nem instalar o Python.
  echo  Instala-o a partir de https://www.python.org/downloads/
  echo  marca a opcao "Add python.exe to PATH" e volta a correr este ficheiro.
  echo.
  pause
  exit /b 1
)

%PY% "%~dp0instalar.py"
set "RC=%errorlevel%"
echo.
pause
exit /b %RC%

:find_python
set "PY="
py -3 --version >nul 2>&1 && set "PY=py -3" && goto :eof
for %%v in (314 313 312 311 310) do if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe" set "PY="%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe""
if defined PY goto :eof
rem O "python" da Microsoft Store nao serve (grava o registo numa copia privada).
python -c "import sys; sys.exit('WindowsApps' in sys.executable)" >nul 2>&1 && set "PY=python"
goto :eof
