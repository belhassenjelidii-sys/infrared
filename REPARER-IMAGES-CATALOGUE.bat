@echo off
setlocal
cd /d "%~dp0"
echo.
echo ===========================================
echo   InfraRed - Reparation images catalogue
echo ===========================================
echo.
echo Cette operation remplace les anciens liens Eye-oo casses par les fichiers locaux du projet.
echo Elle ne touche pas aux photos que vous avez uploadees manuellement.
echo.
call npx prisma generate
if errorlevel 1 goto :error
call npx tsx prisma/import-catalogue.ts
if errorlevel 1 goto :error
echo.
echo OK - Images catalogue reparees.
echo Redemarrez ensuite npm run dev et faites Ctrl+F5.
pause
exit /b 0
:error
echo.
echo ERREUR pendant la reparation. Verifiez DATABASE_URL et PostgreSQL.
pause
exit /b 1
