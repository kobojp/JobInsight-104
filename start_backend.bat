@echo off
title Backend FastAPI - port 8000
cd /d "%~dp0"

echo ----------------------------------------
echo  Backend FastAPI starting...
echo  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ----------------------------------------
echo.

pipenv run uvicorn backend.main:app --reload --port 8000

echo.
echo Backend stopped.
pause