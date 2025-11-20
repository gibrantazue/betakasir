@echo off
echo ========================================
echo   BetaKasir Auto-Update Publisher
echo   Version 1.1.2
echo ========================================
echo.

REM Set GitHub Token
set GH_TOKEN=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

echo [1/3] Setting GitHub Token...
echo Token: %GH_TOKEN:~0,10%...
echo.

echo [2/3] Running publish script...
echo.
node scripts/publishUpdate.js 1.1.2

echo.
echo ========================================
echo   Process Complete!
echo ========================================
echo.
pause
