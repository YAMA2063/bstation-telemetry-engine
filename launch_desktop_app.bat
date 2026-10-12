@echo off
title Bstation Booster Desktop App
cd /d "%~dp0"

:: Cek apakah server sudah berjalan di port 3737
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3737/api/status' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo Server sudah aktif! Membuka jendela aplikasi...
    goto OPEN_WINDOW
)

echo Memulai Bstation Engine...
start /b "" node server.js

:: Tunggu 1-2 detik agar server siap
timeout /t 2 /nobreak >nul

:OPEN_WINDOW
:: Cek keberadaan Microsoft Edge atau Chrome untuk App Mode
where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3737 --window-size=1200,820
    exit
)

where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3737 --window-size=1200,820
    exit
)

start "" http://localhost:3737
exit
