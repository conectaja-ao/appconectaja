@echo off
title Conecta Já — Servidor Local
color 0A
echo.
echo  ============================================
echo   CONECTA JA - Servidor Local
echo   Abre: http://localhost:8080
echo  ============================================
echo.

:: Tenta Python 3
python --version >nul 2>&1
if %errorlevel%==0 (
  echo  [OK] Python encontrado. A iniciar servidor...
  echo  Abre o browser em: http://localhost:8080
  echo  Prima CTRL+C para parar.
  echo.
  python -m http.server 8080
  goto :end
)

:: Tenta Python antigo
py --version >nul 2>&1
if %errorlevel%==0 (
  echo  [OK] Python encontrado. A iniciar servidor...
  echo  Abre o browser em: http://localhost:8080
  py -m http.server 8080
  goto :end
)

:: Tenta Node.js http-server
npx http-server --version >nul 2>&1
if %errorlevel%==0 (
  echo  [OK] Node.js encontrado. A iniciar servidor...
  echo  Abre o browser em: http://localhost:8080
  npx http-server -p 8080 -o
  goto :end
)

:: Nada encontrado
echo  [ERRO] Python e Node.js nao encontrados.
echo.
echo  Opcoes:
echo  1. Instala Python: https://python.org/downloads
echo  2. Ou usa a extensao "Live Server" no VS Code
echo  3. Ou instala Node.js: https://nodejs.org
echo.
pause

:end
