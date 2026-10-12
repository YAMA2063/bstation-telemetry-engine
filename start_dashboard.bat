@echo off
title Bstation Booster Dashboard
cd /d "%~dp0"
echo ========================================================
echo       MEMBUKA BSTATION SMART BOOSTER DASHBOARD
echo ========================================================
echo.
echo Menjalankan server di http://localhost:3737 ...
start "" "http://localhost:3737"
node server.js
pause
