@echo off
title ORCA Mission Control - SIH26176
color 0b
echo ======================================================================
echo    ORCA Marine Ecosystem Reasoning with Collaborative Agents
echo                     SIH Problem Statement 26176
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Launching FastAPI LangGraph Multi-Agent Backend (:8000)...
start "ORCA FastAPI Backend (:8000)" cmd /k "color 0a && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Waiting for FastAPI Multi-Agent Engine to initialize...
timeout /t 3 /nobreak > nul

echo [3/3] Launching Next.js Ocean Intelligence Frontend (:3000)...
start "ORCA Next.js Frontend (:3000)" cmd /k "color 0b && cd landing && npm run dev"

echo.
echo ======================================================================
echo  ORCA System Operational:
echo  - Backend Multi-Agent API: http://127.0.0.1:8000 (LangGraph DAG)
echo  - Interactive Web App:     http://localhost:3000
echo ======================================================================
echo.
timeout /t 3 /nobreak > nul
start http://localhost:3000
