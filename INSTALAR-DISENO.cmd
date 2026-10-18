@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Debes tener Node.js instalado y disponible en PATH.
  echo Puedes ejecutar en VS Code: node --version
  pause
  exit /b 1
)
node "tools\instalar_diseno_premium.cjs"
if errorlevel 1 (
  echo No se completaron los cambios. Revisa la terminal.
  pause
  exit /b 1
)
echo.
pause
