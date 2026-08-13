@echo off
echo ========================================
echo Starting Faculte Connect Microservices
echo ========================================
echo.

echo [1/8] Starting Eureka Discovery Service (Port 8761)...
start "Eureka Discovery" cmd /k "cd backend\services\discovery && mvn spring-boot:run"
timeout /t 20

echo [2/8] Starting Auth Service (Port 8081)...
start "Auth Service" cmd /k "cd backend\services\auth-service && mvn spring-boot:run"
timeout /t 15

echo [3/8] Starting Project Service (Port 8082)...
start "Project Service" cmd /k "cd backend\services\project-service && mvn spring-boot:run"
timeout /t 15

echo [4/8] Starting Event Service (Port 8083)...
start "Event Service" cmd /k "cd backend\services\event-service && mvn spring-boot:run"
timeout /t 15

echo [5/8] Starting Notification Service (Port 8084)...
start "Notification Service" cmd /k "cd backend\services\notification-service && mvn spring-boot:run"
timeout /t 15

echo [6/8] Starting Recommendation Service (Port 8085)...
start "Recommendation Service" cmd /k "cd backend\services\recommendation-service && mvn spring-boot:run"
timeout /t 15

echo [7/8] Starting API Gateway (Port 8080)...
start "API Gateway" cmd /k "cd backend\services\gateway && mvn spring-boot:run"
timeout /t 15

echo [8/8] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Eureka Dashboard: http://localhost:8761
echo API Gateway: http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause
