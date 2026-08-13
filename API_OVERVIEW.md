# API Overview

This file lists the REST endpoints defined in the backend services.

## Auth Service

Base path: /auth

- POST /auth/register
  - Register a new user.
- POST /auth/login
  - Login and receive auth response.
- GET /auth/users/{email}
  - Get user profile by email.
- GET /auth/users/{email}/exists
  - Check if a user exists by email.
- PUT /auth/users/{email}
  - Update user profile by email.

## List Service

Base path: /lists

- GET /lists/competences
  - List available competences.
- GET /lists/facultes
  - List available facultes.

## Project Service

Base path: /projets

- POST /projets
  - Create a project.
- GET /projets
  - List all projects.
- GET /projets/{id}
  - Get project by id.
- GET /projets/chef/{email}
  - Get projects by chef email.
- GET /projets/membre/{email}
  - Get projects by member email.
- GET /projets/organisation/{organisation}
  - Get projects by organisation.
- GET /projets/status/{status}
  - Get projects by status.
- GET /projets/approbation/{approbation}
  - Get projects by approval status.
- PATCH /projets/{id}/approbation
  - Update project approval.
- PATCH /projets/{id}/progression?valeur={progress}
  - Update project progression.
- PUT /projets/{id}
  - Update a project.
- DELETE /projets/{id}
  - Delete a project.

### Project Members

- GET /projets/{id}/membres
  - List project members.
- POST /projets/{id}/membres
  - Add a member to project.
- PUT /projets/{id}/membres/{email}
  - Update a member email in project.
- DELETE /projets/{id}/membres/{email}
  - Remove a member from project.

### Project Tasks

- POST /projets/{projetId}/taches
  - Create a task (no members assigned yet).
- PUT /projets/{projetId}/taches/{tacheId}
  - Update a task.
- DELETE /projets/{projetId}/taches/{tacheId}
  - Delete a task.
- GET /projets/{projetId}/taches/membre/{email}
  - Get tasks for a member in a project.

#### Task Members

- GET /projets/{projetId}/taches/{tacheId}/membres
  - List members assigned to a task.
- POST /projets/{projetId}/taches/{tacheId}/membres
  - Add members to a task.
- PUT /projets/{projetId}/taches/{tacheId}/membres
  - Replace all members for a task.
- DELETE /projets/{projetId}/taches/{tacheId}/membres/{email}
  - Remove a member from a task.

## Event Service

Base path: /events

- POST /events
  - Create an event.
- GET /events
  - List all events.
- GET /events/upcoming
  - List upcoming events.
- GET /events/{id}
  - Get event by id.
- GET /events/organisateur/{email}
  - Get events by organiser email.
- GET /events/participations/{email}
  - Get events a user participates in.
- PUT /events/{id}
  - Update an event.
- DELETE /events/{id}
  - Delete an event.
- POST /events/{id}/participate
  - Participate in an event.
- DELETE /events/{id}/participate/{email}
  - Cancel participation.

## Notification Service

Base path: /notifications

- POST /notifications
  - Create a notification.
- GET /notifications/user/{email}
  - Get notifications for a user.
- GET /notifications/user/{email}/unread
  - Get unread notifications for a user.
- GET /notifications/user/{email}/unread/count
  - Get unread notification count.
- PATCH /notifications/{id}/read
  - Mark a notification as read.
- PATCH /notifications/user/{email}/read-all
  - Mark all notifications as read.
- DELETE /notifications/{id}
  - Delete a notification.

## Recommendation Service

Base path: /recommendations

- GET /recommendations/user/{email}
  - Get recommendations for a user (generates if empty).
- POST /recommendations/user/{email}/refresh
  - Refresh recommendations for a user.
- DELETE /recommendations/{id}
  - Delete a recommendation.
