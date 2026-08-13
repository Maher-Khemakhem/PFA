# Faculte Connect - Setup Guide

## Quick Start

### Prerequisites
- Java 21
- Maven 3.6+
- Node.js 18+
- Docker Desktop (for MongoDB)
- MySQL Server

### Step 1: Setup Databases

#### MySQL (for Auth Service)
```bash
# Create database
mysql -u root -p
CREATE DATABASE auth_db;
exit;
```

#### MongoDB (Docker - Recommended)
```bash
# Run the provided script
./start-mongodb.bat
```

This will start 3 MongoDB instances:
- Event Service: `localhost:27019`
- Notification Service: `localhost:27020`
- Recommendation Service: `localhost:27021`

**Alternative: Manual MongoDB Setup**
```bash
# If you prefer running MongoDB manually on different ports
mongod --port 27019 --dbpath /data/event_db
mongod --port 27020 --dbpath /data/notification_db
mongod --port 27021 --dbpath /data/recommendation_db
```

**Alternative: Single MongoDB Instance**
If you want to use a single MongoDB instance:
1. Start MongoDB on default port (27017)
2. Update `application.yml` in each service:
   - `event-service`: `mongodb://localhost:27017/event_db`
   - `notification-service`: `mongodb://localhost:27017/notification_db`
   - `recommendation-service`: `mongodb://localhost:27017/recommendation_db`

### Step 2: Start Services

#### Option A: Using the Startup Script (Windows)
```bash
./start-services.bat
```

This will automatically start all services in the correct order with appropriate delays.

#### Option B: Manual Startup
Start each service in a separate terminal:

```bash
# 1. Eureka Discovery (wait 20 seconds)
cd backend/services/discovery
mvn spring-boot:run

# 2. Auth Service (wait 15 seconds)
cd backend/services/auth-service
mvn spring-boot:run

# 3. Project Service (wait 15 seconds)
cd backend/services/project-service
mvn spring-boot:run

# 4. Event Service (wait 15 seconds)
cd backend/services/event-service
mvn spring-boot:run

# 5. Notification Service (wait 15 seconds)
cd backend/services/notification-service
mvn spring-boot:run

# 6. Recommendation Service (wait 15 seconds)
cd backend/services/recommendation-service
mvn spring-boot:run

# 7. API Gateway (wait 15 seconds)
cd backend/services/gateway
mvn spring-boot:run

# 8. Frontend
cd frontend
npm install  # First time only
npm run dev
```

### Step 3: Verify Setup

1. **Check Eureka Dashboard**: http://localhost:8761
   - Should show 6 services registered:
     - AUTH-SERVICE
     - PROJECT-SERVICE
     - EVENT-SERVICE
     - NOTIFICATION-SERVICE
     - RECOMMENDATION-SERVICE
     - API-GATEWAY

2. **Test Gateway**: http://localhost:8080/actuator/health

3. **Test Frontend**: http://localhost:5173

4. **Test APIs**:
```bash
# List competences
curl http://localhost:8080/lists/competences

# List facultes
curl http://localhost:8080/lists/facultes

# Get events
curl http://localhost:8080/events

# Get notifications (replace with actual user email)
curl http://localhost:8080/notifications/user/test@example.com
```

## Service Ports Reference

| Service | Port | Database |
|---------|------|----------|
| Frontend | 5173 | - |
| API Gateway | 8080 | - |
| Eureka Discovery | 8761 | - |
| Auth Service | 8081 | MySQL:3308 |
| Project Service | 8082 | MongoDB:27017 |
| Event Service | 8083 | MongoDB:27019 |
| Notification Service | 8084 | MongoDB:27020 |
| Recommendation Service | 8085 | MongoDB:27021 |

## API Endpoints

### Auth Service (`/auth/**`, `/lists/**`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/users/{email}` - Get user by email
- `GET /lists/competences` - Get competences list
- `GET /lists/facultes` - Get facultes list

### Project Service (`/projets/**`)
- `POST /projets` - Create project
- `GET /projets` - List all projects
- `GET /projets/{id}` - Get project by ID
- `PUT /projets/{id}` - Update project
- `DELETE /projets/{id}` - Delete project

### Event Service (`/events/**`)
- `POST /events` - Create event
- `GET /events` - List all events
- `GET /events/upcoming` - List upcoming events
- `GET /events/{id}` - Get event by ID
- `GET /events/organisateur/{email}` - Events by organizer
- `GET /events/participations/{email}` - User's participations
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event
- `POST /events/{id}/participate` - Join event
- `DELETE /events/{id}/participate/{email}` - Leave event

### Notification Service (`/notifications/**`)
- `POST /notifications` - Create notification
- `GET /notifications/user/{email}` - Get user notifications
- `GET /notifications/user/{email}/unread` - Get unread notifications
- `GET /notifications/user/{email}/unread/count` - Count unread
- `PATCH /notifications/{id}/read` - Mark as read
- `PATCH /notifications/user/{email}/read-all` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification

### Recommendation Service (`/recommendations/**`)
- `GET /recommendations/user/{email}` - Get recommendations (auto-generates)
- `POST /recommendations/user/{email}/refresh` - Refresh recommendations
- `DELETE /recommendations/{id}` - Delete recommendation

## Troubleshooting

### Service won't start
- Check if the port is already in use
- Verify Java version: `java -version` (should be 21)
- Check Maven installation: `mvn -version`

### MongoDB connection error
- Verify MongoDB containers are running: `docker ps`
- Check MongoDB logs: `docker logs event-mongo`
- Restart MongoDB: `./stop-mongodb.bat` then `./start-mongodb.bat`

### Service not registering with Eureka
- Wait at least 30 seconds after starting Eureka
- Check Eureka logs for errors
- Verify `application.yml` has correct Eureka URL

### Gateway routing errors
- Ensure all services are registered with Eureka
- Check service names match exactly (case-sensitive)
- Verify Gateway is the last service started

### Frontend can't reach backend
- Check if Gateway is running on port 8080
- Verify proxy configuration in `vite.config.ts`
- Check browser console for CORS errors

### MySQL connection error
- Verify MySQL is running: `mysql --version`
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `auth-service/application.yml`

## Development Tips

### Hot Reload
- **Frontend**: Changes auto-reload (Vite HMR)
- **Backend**: Use Spring DevTools or restart service

### Viewing Logs
Each service window shows its own logs. Look for:
- ✅ "Started [ServiceName]Application"
- ✅ "Registering application AUTH-SERVICE with eureka"

### Database Clients
- **MongoDB**: MongoDB Compass (GUI) or mongosh (CLI)
- **MySQL**: MySQL Workbench (GUI) or mysql CLI

### Testing APIs
Use any of these tools:
- **curl** (command line)
- **Postman** (GUI)
- **Thunder Client** (VS Code extension)
- **Insomnia** (GUI)

## Stopping Services

### Stop MongoDB
```bash
./stop-mongodb.bat
```

### Stop All Services
Close all terminal windows or press `Ctrl+C` in each terminal.

### Clean Docker Containers (Optional)
```bash
# Remove MongoDB containers
docker rm -f event-mongo notification-mongo recommendation-mongo

# Remove MongoDB volumes (deletes all data!)
docker volume prune
```

## Next Steps

1. ✅ Setup completed - all services running
2. 🔐 Implement JWT authentication in Gateway
3. 📝 Test all endpoints with Postman
4. 🎨 Connect frontend pages to new APIs
5. 🧪 Write integration tests
6. 📊 Add monitoring and logging
7. 🚀 Deploy to production

## Support

For issues or questions:
1. Check the logs in service terminal windows
2. Verify Eureka dashboard shows all services
3. Review `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Check `backend/services/[service-name]/src/main/resources/application.yml` for configuration

## File Structure

```
faculte-connect/
├── backend/
│   └── services/
│       ├── discovery/          # Eureka Server (8761)
│       ├── gateway/            # API Gateway (8080)
│       ├── auth-service/       # Auth + Lists (8081)
│       ├── project-service/    # Projects (8082)
│       ├── event-service/      # Events (8083) ⭐ NEW
│       ├── notification-service/ # Notifications (8084) ⭐ NEW
│       └── recommendation-service/ # Recommendations (8085) ⭐ NEW
├── frontend/                   # React App (5173)
├── start-services.bat          # Auto-start script
├── start-mongodb.bat           # MongoDB setup script
├── stop-mongodb.bat            # MongoDB cleanup script
├── SETUP_GUIDE.md             # This file
└── IMPLEMENTATION_SUMMARY.md   # Technical details
```

---

**Ready to go!** Run `./start-mongodb.bat` then `./start-services.bat` and you're all set! 🚀
