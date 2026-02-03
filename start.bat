@echo off
title Wealth Ranker Server

echo.
echo ========================================
echo   Starting Wealth Ranker Backend...
echo ========================================
echo.

:: Start server and open browser in parallel
start /B cmd /C "timeout /t 3 /nobreak > nul && start http://localhost:3000"

:: Start the server (keeps window open)
node server.js
