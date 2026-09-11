@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo  INFRARED - IMPORT CATALOGUE + PHOTOS REELLES
echo ================================================
echo.
call npx prisma generate || goto :error
call npx tsx prisma/import-catalogue.ts || goto :error
call npx tsx scripts/cache-catalogue-images.ts
if errorlevel 2 goto :partial
if errorlevel 1 goto :error
echo.
echo OK - catalogue importe et photos stockees localement.
echo Les photos sont dans public\images\catalogue-real\
goto :end
:partial
echo.
echo ATTENTION - le catalogue est importe mais certaines photos n'ont pas pu etre telechargees.
echo Relance ce fichier avec une connexion Internet active. Les galeries en echec n'ont pas ete ecrasees.
goto :end
:error
echo.
echo ERREUR - l'import n'a pas pu se terminer.
:end
pause
endlocal
