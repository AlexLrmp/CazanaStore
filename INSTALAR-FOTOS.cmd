@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Necesitas Node.js para aplicar esta actualizacion.
  echo Puedes ejecutar el instalador desde la terminal de VS Code.
  pause
  exit /b 1
)
node "tools\instalar_fotos_reales.cjs"
echo.
pause
