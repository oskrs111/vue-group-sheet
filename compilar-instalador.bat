@echo off
setlocal
pushd "%~dp0" || exit /b 1

where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_node

if not exist "node_modules\.bin\vite.cmd" (
    call npm ci --no-audit --no-fund
    if errorlevel 1 goto :error
)
if not exist "vue-group-sheet-desktop\node_modules\.bin\electron-builder.cmd" (
    call npm --prefix "vue-group-sheet-desktop" ci --no-audit --no-fund
    if errorlevel 1 goto :error
)

call npm --prefix "vue-group-sheet-desktop" run dist:win
if errorlevel 1 goto :error
echo.
echo Instalador generado en "%CD%\vue-group-sheet-desktop\release".
popd
if not defined CI pause
exit /b 0

:missing_node
echo Instala Node.js 22 o posterior, incluido npm, y vuelve a ejecutar este archivo.
:error
echo No se pudo compilar el instalador. Revisa el error anterior.
popd
if not defined CI pause
exit /b 1
