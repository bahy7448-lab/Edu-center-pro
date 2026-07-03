@echo off
echo ============================================
echo       EduCenter Pro - بدء التشغيل
echo ============================================
echo.

echo [1/2] تشغيل الباك اند...
start cmd /k "cd backend && npm install && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] تشغيل الفرونت اند...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ============================================
echo  الفرونت اند: http://localhost:5173
echo  الباك اند:   http://localhost:3001
echo ============================================
pause
