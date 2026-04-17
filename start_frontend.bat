@echo off
title Frontend React - port 5173
cd /d "%~dp0frontend"

echo ----------------------------------------
echo  Frontend React starting...
echo  http://localhost:5173
echo ----------------------------------------
echo.

npm run dev

echo.
echo Frontend stopped.
pause