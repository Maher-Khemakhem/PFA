@echo off
echo ========================================
echo Stopping MongoDB Instances
echo ========================================
echo.

echo Stopping Event Service MongoDB...
docker stop event-mongo

echo Stopping Notification Service MongoDB...
docker stop notification-mongo

echo Stopping Recommendation Service MongoDB...
docker stop recommendation-mongo

echo.
echo ========================================
echo All MongoDB instances stopped!
echo ========================================
echo.
echo To remove the containers completely, run:
echo docker rm event-mongo notification-mongo recommendation-mongo
echo.
pause
