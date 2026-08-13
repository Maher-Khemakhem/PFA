@echo off
echo ========================================
echo Starting MongoDB Instances for Services
echo ========================================
echo.

echo Checking if Docker is running...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting MongoDB for Event Service (Port 27019)...
docker run -d -p 27019:27017 --name event-mongo mongo:latest
if errorlevel 1 (
    echo Warning: event-mongo container might already exist. Trying to start it...
    docker start event-mongo
)

echo [2/3] Starting MongoDB for Notification Service (Port 27020)...
docker run -d -p 27020:27017 --name notification-mongo mongo:latest
if errorlevel 1 (
    echo Warning: notification-mongo container might already exist. Trying to start it...
    docker start notification-mongo
)

echo [3/3] Starting MongoDB for Recommendation Service (Port 27021)...
docker run -d -p 27021:27017 --name recommendation-mongo mongo:latest
if errorlevel 1 (
    echo Warning: recommendation-mongo container might already exist. Trying to start it...
    docker start recommendation-mongo
)

echo.
echo ========================================
echo MongoDB instances started successfully!
echo ========================================
echo.
echo Event Service MongoDB: localhost:27019
echo Notification Service MongoDB: localhost:27020
echo Recommendation Service MongoDB: localhost:27021
echo.
echo To stop all MongoDB instances, run: stop-mongodb.bat
echo.
pause
