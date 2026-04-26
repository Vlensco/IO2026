@echo off
title Simulacra EdgeTTS Server
echo =============================================
echo   Simulacra EdgeTTS Server (Python)
echo   Tidak perlu Docker!
echo =============================================
echo.

cd /d "%~dp0"

REM Cek Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan!
    echo Unduh Python di: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Install dependencies jika belum ada
echo [INFO] Mengecek dan menginstall dependencies...
pip install -r requirements.txt -q

echo.
echo [OK] Memulai server di http://localhost:5050 ...
echo [INFO] Tekan Ctrl+C untuk menghentikan server
echo.

python server.py

pause
