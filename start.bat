@echo off
REM ============================================================
REM HospEase - Start All Microservices
REM ============================================================

set ROOT=%~dp0

REM Use system JAVA_HOME if already set, otherwise auto-detect
if not defined JAVA_HOME (
    REM Try common Java locations
    if exist "C:\Program Files\Java\jdk-21" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    ) else if exist "C:\Program Files\OpenJDK\jdk-21" (
        set "JAVA_HOME=C:\Program Files\OpenJDK\jdk-21"
    ) else if exist "C:\Java\jdk-21" (
        set "JAVA_HOME=C:\Java\jdk-21"
    ) else (
        echo ERROR: JAVA_HOME not set and JDK not found in standard locations
        echo Please set JAVA_HOME environment variable to your JDK installation folder
        pause
        exit /b 1
    )
)

REM Validate JAVA_HOME
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: JAVA_HOME pointing to invalid location: %JAVA_HOME%
    echo Please verify JAVA_HOME contains bin\java.exe
    pause
    exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME: %JAVA_HOME%

echo ============================================================
echo HospEase Microservices Startup
echo Project root: %ROOT%
echo ============================================================
echo.

echo [1/9] Starting service-registry (Eureka)... waiting 35s for it to be ready
start "service-registry" cmd /k "cd /d %ROOT%service-registry && mvn spring-boot:run"
timeout /t 35 /nobreak

echo [2/9] Starting config-server... waiting 20s for it to be ready
start "config-server" cmd /k "cd /d %ROOT%config-server && mvn spring-boot:run"
timeout /t 20 /nobreak

echo [3/9] Starting user-service... waiting 15s
start "user-service" cmd /k "cd /d %ROOT%user-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [4/9] Starting room-housekeeping-service... waiting 15s
start "room-housekeeping-service" cmd /k "cd /d %ROOT%room-housekeeping-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [5/9] Starting guest-reservation-service... waiting 15s
start "guest-reservation-service" cmd /k "cd /d %ROOT%guest-reservation-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [6/9] Starting service-order-service... waiting 15s
start "service-order-service" cmd /k "cd /d %ROOT%service-order-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [7/9] Starting finance-service... waiting 15s
start "finance-service" cmd /k "cd /d %ROOT%finance-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [8/9] Starting reporting-service... waiting 15s
start "reporting-service" cmd /k "cd /d %ROOT%reporting-service && mvn spring-boot:run"
timeout /t 15 /nobreak

echo [9/9] Starting api-gateway...
start "api-gateway" cmd /k "cd /d %ROOT%api-gateway && mvn spring-boot:run"

echo.
echo ============================================================
echo All 9 services launched in separate windows.
echo.
echo Wait ~1-2 minutes for everything to finish registering.
echo Check Eureka dashboard:  http://localhost:8761
echo Check Config Server:     http://localhost:8888/reporting-service/default
echo.
echo To stop everything: run stop-hospease.bat
echo ============================================================
pause
