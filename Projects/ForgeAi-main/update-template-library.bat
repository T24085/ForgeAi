@echo off
setlocal

REM Regenerate ForgeAI template data with one click.
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] PowerShell was not found on this system.
  popd >nul
  pause
  exit /b 1
)

echo Updating templates-data.js ...
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\generate-templates.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] Template list update failed.
  popd >nul
  pause
  exit /b 1
)

echo.
echo [OK] Template list updated successfully.
echo Refresh templates.html to see new entries.

popd >nul
pause
exit /b 0
