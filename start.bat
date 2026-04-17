@echo off
title JobInsight-104 Launcher
set ROOT=%~dp0

echo.
echo  ============================================
echo    JobInsight-104  Starting...
echo  ============================================
echo.

echo [1/2] Starting Backend FastAPI  (port 8000) ...
start "Backend FastAPI :8000" cmd /k "%ROOT%start_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend React   (port 5173) ...
start "Frontend React :5173" cmd /k "%ROOT%start_frontend.bat"

timeout /t 4 /nobreak >nul

echo.
echo  ============================================
echo    Ready! Open in browser:
echo.
echo    Frontend  -  http://localhost:5173
echo    API Docs  -  http://localhost:8000/docs
echo.
echo    Close each CMD window to stop.
echo  ============================================
echo.
pause