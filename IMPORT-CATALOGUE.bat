@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==============================================
echo   InfraRed - Import catalogue HD (30 modeles)
echo ==============================================
echo.
echo L'import modifie uniquement categories, marques, produits et galeries.
echo Boutiques, utilisateurs, parametres et mots de passe restent inchanges.
echo Les photos ajoutees manuellement dans Supabase ou /uploads sont conservees.
echo.
call npx prisma generate
if errorlevel 1 goto :error
call npm run catalogue:import
if errorlevel 1 goto :error
echo.
echo IMPORT TERMINE. Relancez npm run dev puis faites Ctrl+F5.
pause
exit /b 0
:error
echo.
echo ECHEC DE L'IMPORT. Verifiez DATABASE_URL, PostgreSQL et les messages ci-dessus.
pause
exit /b 1
