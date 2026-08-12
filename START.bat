@echo off
title InfraRed Optic-Store
cd /d "%~dp0"
echo ==========================================
echo   InfraRed Optic-Store
echo ==========================================
echo.

if not exist .env (
  echo ERREUR: .env introuvable.
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo ERREUR: Docker Desktop n'est pas installe ou accessible.
  pause
  exit /b 1
)

echo [1/4] Installation / verification des dependances...
call npm install
if errorlevel 1 (
  echo Une etape a echoue pendant npm install.
  pause
  exit /b 1
)

echo [2/4] Demarrage PostgreSQL...
call docker compose up -d postgres
if errorlevel 1 (
  echo Impossible de demarrer PostgreSQL.
  pause
  exit /b 1
)

echo [3/4] Prisma: generation + migrations...
call npx prisma generate
if errorlevel 1 (
  echo Prisma generate a echoue.
  pause
  exit /b 1
)
call npx prisma migrate deploy
if errorlevel 1 (
  echo Prisma migrate deploy a echoue.
  echo Si c'est la premiere installation et que la base est vide, verifiez DATABASE_URL.
  pause
  exit /b 1
)

echo [4/4] Demarrage du site...
echo.
echo Site: http://localhost:3000
echo Dashboard Admin: http://localhost:3000/admin
echo Dashboard Commercial: http://localhost:3000/commercial
echo.
call npm run dev
pause
