@echo off
title BLOCK EMPIRE - The Syndicate v14
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 24 or newer is required. Install it from https://nodejs.org
  pause
  exit /b 1
)
node start-local.mjs --open
pause
