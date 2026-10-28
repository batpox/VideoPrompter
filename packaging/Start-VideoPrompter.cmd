@echo off
setlocal
cd /d "%~dp0"
if not exist "VideoPrompter.exe" (
  echo VideoPrompter.exe was not found in this folder.
  pause
  exit /b 1
)
echo Starting VideoPrompter on http://127.0.0.1:5088
start "VideoPrompter Server" "%~dp0VideoPrompter.exe" --urls http://127.0.0.1:5088
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5088"
echo If the browser does not open, visit http://127.0.0.1:5088
echo Close the VideoPrompter Server console window to stop the application.
