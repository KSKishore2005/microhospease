@echo off
REM Stop all HospEase services by their window titles

echo Stopping all HospEase services...
taskkill /F /FI "WINDOWTITLE eq service-registry*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq user-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq room-housekeeping-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq guest-reservation-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq service-order-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq finance-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq reporting-service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq api-gateway*" >nul 2>&1
echo Done.
pause
