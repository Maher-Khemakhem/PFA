# Faculte Connect

Faculte Connect is a university collaboration platform that connects students and organizations around projects, events, and opportunities. The system is built as a Spring Boot microservices backend with a React (Vite) frontend.

## Key Features

- Role-based access for students, organizations, and admins
- Student profiles with competences, faculties, and university IDs
- Project management with members, tasks, and progress
- Event creation, participation, and organizer views
- Notifications with read/unread status
- Recommendations based on user competences

## Architecture Overview

```
Frontend (Vite + React, :5173)
	-> API Gateway (:8080)
		-> Eureka Discovery (:8761)
		-> Auth Service (:8081, MySQL)
		-> Project Service (:8082, MongoDB)
		-> Event Service (:8083, MongoDB)
		-> Notification Service (:8084, MongoDB)
		-> Recommendation Service (:8085, MongoDB)
```

All services register with Eureka and are routed through the API Gateway. The frontend proxies API calls to the gateway.

## Tech Stack

- Backend: Java 21, Spring Boot, Spring Cloud (Eureka, Gateway, OpenFeign)
- Databases: MySQL (auth), MongoDB (project/event/notification/recommendation)
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, React Query
- Tooling: Docker, Maven, Vitest, Playwright

## Repository Structure

```
faculte-connect/
├── backend/
│   └── services/
│       ├── discovery/                # Eureka Server
│       ├── gateway/                  # API Gateway
│       ├── auth-service/             # Auth + lists (MySQL)
│       ├── project-service/          # Projects (MongoDB)
│       ├── event-service/            # Events (MongoDB)
│       ├── notification-service/     # Notifications (MongoDB)
│       └── recommendation-service/   # Recommendations (MongoDB)
├── frontend/                         # React app (Vite)
├── start-mongodb.bat                 # Start MongoDB containers (3 instances)
├── stop-mongodb.bat                  # Stop MongoDB containers
├── start-services.bat                # Start all services in order
├── SETUP_GUIDE.md                    # Full setup instructions
├── API_OVERVIEW.md                   # Endpoint list
├── TEST_PLAN.md                      # Backend test plan
└── QUICK_TEST_GUIDE.md               # Quick validation steps
```

## Prerequisites

- Java 21
- Maven 3.6+
- Node.js 18+
- Docker Desktop (for MongoDB containers)
- MySQL Server

## Quick Start (Windows)

1. Start MongoDB instances (Event/Notification/Recommendation):

   ```bash
   ./start-mongodb.bat
   ```

2. Start backend services (Eureka -> services -> gateway):

   ```bash
   ./start-services.bat
   ```

3. Start frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Verify:
   - Eureka: http://localhost:8761
   - Gateway health: http://localhost:8080/actuator/health
   - Frontend: http://localhost:5173

## Manual Startup (If Needed)

Start each service in its own terminal (wait a few seconds between each):

```bash
cd backend/services/discovery
mvn spring-boot:run

cd backend/services/auth-service
mvn spring-boot:run

cd backend/services/project-service
mvn spring-boot:run

cd backend/services/event-service
mvn spring-boot:run

cd backend/services/notification-service
mvn spring-boot:run

cd backend/services/recommendation-service
mvn spring-boot:run

cd backend/services/gateway
mvn spring-boot:run
```

Then start the frontend as shown in Quick Start.

## Database Setup

### MySQL (Auth Service)

```bash
mysql -u root -p
CREATE DATABASE auth_db;
exit;
```

### MongoDB (Recommended)

Use the provided scripts to run three MongoDB instances:

```bash
./start-mongodb.bat
```

Ports used by the services:

- Event Service: 27019
- Notification Service: 27020
- Recommendation Service: 27021

### Single MongoDB Instance (Optional)

If you prefer a single MongoDB instance, update each service `application.yml`:

- event-service: `mongodb://localhost:27017/event_db`
- notification-service: `mongodb://localhost:27017/notification_db`
- recommendation-service: `mongodb://localhost:27017/recommendation_db`

## Service Ports

| Service                | Port | Database      |
| ---------------------- | ---- | ------------- |
| Frontend               | 5173 | -             |
| API Gateway            | 8080 | -             |
| Eureka Discovery       | 8761 | -             |
| Auth Service           | 8081 | MySQL:3308    |
| Project Service        | 8082 | MongoDB:27017 |
| Event Service          | 8083 | MongoDB:27019 |
| Notification Service   | 8084 | MongoDB:27020 |
| Recommendation Service | 8085 | MongoDB:27021 |

## API Endpoints

Full list: see API_OVERVIEW.md.

Base paths:

- `/auth/**` and `/lists/**` (Auth Service)
- `/projets/**` (Project Service)
- `/events/**` (Event Service)
- `/notifications/**` (Notification Service)
- `/recommendations/**` (Recommendation Service)

## Testing

- Quick validations: QUICK_TEST_GUIDE.md
- Full backend test plan: TEST_PLAN.md
- Frontend unit tests:
  ```bash
  cd frontend
  npm run test
  ```
- Frontend e2e (Playwright):
  ```bash
  cd frontend
  npm run test:watch
  ```

## Docker Notes

- Root docker-compose.yml includes discovery, auth, project, gateway, mysql, and a single mongo instance.
- backend/docker-compose.yml provides MongoDB, Mongo Express, and Kafka tooling.
- Event/Notification/Recommendation services are typically started with the .bat scripts.

## Troubleshooting

- Make sure Eureka is running before other services.
- If a service does not register, check its `application.yml` for Eureka URL.
- If MongoDB connection fails, verify ports and containers are running.
- If the frontend cannot reach APIs, verify the gateway and Vite proxy.

## Documentation

- Setup guide: SETUP_GUIDE.md
- API overview: API_OVERVIEW.md
- Implementation notes: IMPLEMENTATION_SUMMARY.md
- Frontend integration: FRONTEND_INTEGRATION_SUMMARY.md
- Test plan: TEST_PLAN.md

## Roadmap Ideas

- JWT authentication at gateway
- WebSocket notifications
- Pagination and advanced filtering
- Recommendation improvements

---

If you are setting up the project for the first time, start with SETUP_GUIDE.md and then follow the Quick Start section above.
