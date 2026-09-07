# ORCA Unified Mission Control Launcher (SIH26176)
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ORCA Marine Ecosystem Reasoning with Collaborative Agents" -ForegroundColor Cyan
Write-Host "                    SIH Problem Statement 26176" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "[1/3] Starting FastAPI LangGraph Multi-Agent Engine on :8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir'; uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Next.js Ocean Intelligence Frontend on :3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\landing'; npm run dev"

Write-Host "[3/3] Launching ORCA Dashboard in default browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " ORCA Mission Control is running!" -ForegroundColor Green
Write-Host " - Multi-Agent Backend (FastAPI + LangGraph): http://127.0.0.1:8000" -ForegroundColor White
Write-Host " - User Interface (Next.js 16 App):          http://localhost:3000" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
