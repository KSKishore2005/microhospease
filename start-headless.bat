@echo off
set ROOT=%~dp0
set "JAVA_HOME=C:\Users\Kishore\Downloads\jdk-21.0.10"
if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "C:\Program Files\Java\jdk-21" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    ) else if exist "C:\Program Files\OpenJDK\jdk-21" (
        set "JAVA_HOME=C:\Program Files\OpenJDK\jdk-21"
    ) else if exist "C:\Java\jdk-21" (
        set "JAVA_HOME=C:\Java\jdk-21"
    )
)
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME: %JAVA_HOME%

echo [1/9] Starting service-registry (Eureka)...
start "service-registry" cmd /c "cd /d %ROOT%service-registry && mvn spring-boot:run"
ping 127.0.0.1 -n 15 >nul

echo [2/9] Starting config-server...
start "config-server" cmd /c "cd /d %ROOT%config-server && mvn spring-boot:run"
ping 127.0.0.1 -n 15 >nul

echo [3/9] Starting user-service...
start "user-service" cmd /c "cd /d %ROOT%user-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [4/9] Starting room-housekeeping-service...
start "room-housekeeping-service" cmd /c "cd /d %ROOT%room-housekeeping-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [5/9] Starting guest-reservation-service...
start "guest-reservation-service" cmd /c "cd /d %ROOT%guest-reservation-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [6/9] Starting service-order-service...
start "service-order-service" cmd /c "cd /d %ROOT%service-order-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [7/9] Starting finance-service...
start "finance-service" cmd /c "cd /d %ROOT%finance-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [8/9] Starting reporting-service...
start "reporting-service" cmd /c "cd /d %ROOT%reporting-service && mvn spring-boot:run"
ping 127.0.0.1 -n 5 >nul

echo [9/9] Starting api-gateway...
start "api-gateway" cmd /c "cd /d %ROOT%api-gateway && mvn spring-boot:run"

echo All 9 services launched.
