@echo off
echo [INFO] Menghentikan EdgeTTS server...
cd /d "%~dp0"
docker compose down
echo [OK] EdgeTTS server dihentikan.
pause
