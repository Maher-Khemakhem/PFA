# Integration Test Checklist

## Pre-Test Setup

### Backend Services Status
- [ ] Eureka Discovery running on port 8761
- [ ] API Gateway running on port 8080
- [ ] Auth Service running on port 8081
- [ ] Project Service running on port 8082
- [ ] Event Service running on port 8083
- [ ] Notification Service running on port 8084
- [ ] Recommendation Service running on port 8085
- [ ] All services registered in Eureka dashboard

### Database Status
- [ ] MySQL running (auth_db)
- [ ] MongoDB running on 27017 (project_db)
- [ ] MongoDB running on 27019 (event_db)
- [ ] MongoDB running on 27020 (notification_db)
- [ ] MongoDB running on 27021 (recommendation_db)

### Frontend Status
- [ ] Frontend dev server running on port 5173
- [ ] No console errors on initial load
- [ ] Can access login page

---

## Test Scenarios

### 1. User Registration & Login
- [ ] Register as student with competences selection
- [ ] Competences dropdown loads from `/lists/competences`
- [ ] Facultes dropdown loads from `/lists/facultes`
- [ ] Can select multiple competences
- [ ] Login with registered credentials
- [ ] Redirects to dashboard after login

### 2. Events Integration Tests

#### As Organization (Event Creator)
- [ ] Navigate to Events page
- [ ] Click "Créer Event" button
- [ ] Fill event creation form:
  - [ ] Titre: "Workshop Spring Boot"
  - [ ] Description: "Atelier pratique..."
  - [ ] Type: Workshop
  - [ ] Lieu: "Salle 101"
  - [ ] Date/Heure: Future date
  - [ ] Nombre de places: 30
- [ ] Submit form
- [ ] See success toast notification
- [ ] Event appears in events table
- [ ] View participant count (0/30)
- [ ] Click "Modifier" button (link should work)
- [ ] Click "Supprimer" button
- [ ] Confirm deletion
- [ ] Event removed from table

#### As Student (Event Participant)
- [ ] Login as student
- [ ] Navigate to Events page
- [ ] See events in card grid layout
- [ ] Click on event card
- [ ] Modal opens with event details
- [ ] See "Participer" button
- [ ] Click "Participer"
- [ ] See success toast
- [ ] Button changes to "Annuler"
- [ ] Places restantes decreases by 1
- [ ] Close modal
- [ ] Card shows updated participation status
- [ ] Click "Annuler" button
- [ ] See success toast
- [ ] Participation removed

### 3. Notifications Integration Tests

#### Viewing Notifications
- [ ] Check dashboard header
- [ ] See notification bell icon
- [ ] If unread notifications exist, see red badge with count
- [ ] Click bell icon or navigate to /notifications
- [ ] See list of notifications
- [ ] Unread notifications highlighted with colored border
- [ ] Different icon types visible (task, project, event, system)

#### Managing Notifications
- [ ] Click mark as read button on unread notification
- [ ] Notification loses highlight
- [ ] Bell count decreases
- [ ] Click "Tout marquer comme lu"
- [ ] All notifications marked as read
- [ ] Bell badge disappears
- [ ] Click delete button on notification
- [ ] Confirm deletion dialog appears
- [ ] Notification removed from list

#### Real-time Updates
- [ ] Create notification via backend API
- [ ] Wait up to 30 seconds
- [ ] Unread count updates automatically
- [ ] Navigate to notifications page
- [ ] New notification appears

### 4. Recommendations Integration Tests

#### First Visit
- [ ] Login as student (with competences in profile)
- [ ] Navigate to Recommendations page
- [ ] Recommendations auto-generate on first visit
- [ ] See loading indicator
- [ ] Recommendations display in card grid
- [ ] Each card shows:
  - [ ] Project title
  - [ ] Category badge
  - [ ] Match percentage (circular badge)
  - [ ] Matched competences as tags
  - [ ] "Voir projet" button

#### Refresh Functionality
- [ ] Click "Actualiser" button
- [ ] See spinning refresh icon
- [ ] Recommendations update
- [ ] See success toast
- [ ] Match percentages may change

#### Empty State
- [ ] Create user with no competences
- [ ] Navigate to recommendations
- [ ] See empty state message
- [ ] See "Générer des recommandations" button
- [ ] Click button
- [ ] See message about completing profile

#### Navigation
- [ ] Click "Voir projet" on any recommendation
- [ ] Navigates to project details page
- [ ] Project loads correctly

### 5. Lists API Integration Tests

#### Student Signup
- [ ] Go to student signup page
- [ ] Open "Faculté / Spécialité" dropdown
- [ ] See 12+ facultes loaded from API
- [ ] Select a faculte
- [ ] Open "Compétences" dropdown
- [ ] See 40+ competences loaded from API
- [ ] Select "Java"
- [ ] Java badge appears below
- [ ] Select "React"
- [ ] React badge appears
- [ ] Click X on Java badge
- [ ] Java removed from selected competences
- [ ] Java reappears in dropdown

#### Competences List Content
Verify these competences are available:
- [ ] Java
- [ ] Python
- [ ] JavaScript
- [ ] React
- [ ] Spring Boot
- [ ] Machine Learning
- [ ] Cloud Computing
- [ ] Docker
- [ ] MongoDB

#### Facultes List Content
Verify these facultes are available:
- [ ] Faculté des Sciences de Tunis
- [ ] École Nationale d'Ingénieurs de Tunis
- [ ] Institut Supérieur d'Informatique

---

## Cross-Integration Tests

### Event → Notification Flow
- [ ] Create event as organization
- [ ] Manually create notification via API:
  ```bash
  curl -X POST http://localhost:8080/notifications \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "student@fst.tn",
      "titre": "Nouvel événement",
      "message": "Workshop Spring Boot créé",
      "type": "INFO",
      "relatedEntityType": "EVENT",
      "relatedEntityId": "event-id"
    }'
  ```
- [ ] Login as student
- [ ] See notification in bell
- [ ] Notification links to event (conceptually)

### Recommendation → Project Flow
- [ ] Have user with "Java" competence
- [ ] Create project with "Java" in title/description
- [ ] Refresh recommendations
- [ ] See project recommended
- [ ] Match score > 0%
- [ ] "Java" appears in matched competences

---

## Error Handling Tests

### Network Errors
- [ ] Stop backend services
- [ ] Try to load events page
- [ ] See empty state (not crash)
- [ ] Try to participate in event
- [ ] See error toast
- [ ] Try to refresh recommendations
- [ ] See error toast

### Invalid Data
- [ ] Try to create event with missing fields
- [ ] See error toast
- [ ] Try to participate in full event
- [ ] See error message
- [ ] Try to delete already-deleted notification
- [ ] Handles gracefully

### Authentication Errors
- [ ] Logout user
- [ ] Try to access protected page
- [ ] Redirects to login
- [ ] Try API call without token
- [ ] See error handling

---

## Performance Tests

### Loading Times
- [ ] Events page loads in < 2 seconds
- [ ] Notifications page loads in < 1 second
- [ ] Recommendations page loads in < 3 seconds
- [ ] Lists load in < 500ms

### Caching
- [ ] Load events page
- [ ] Navigate away
- [ ] Return to events page
- [ ] Loads instantly from cache
- [ ] Same for notifications and recommendations

### Concurrent Actions
- [ ] Participate in event
- [ ] Immediately click cancel (while first request pending)
- [ ] Handles gracefully
- [ ] No duplicate participations

---

## UI/UX Tests

### Responsive Design
- [ ] Test on mobile view (375px)
- [ ] Test on tablet view (768px)
- [ ] Test on desktop view (1920px)
- [ ] All cards/tables responsive
- [ ] No horizontal scroll

### Accessibility
- [ ] Tab navigation works
- [ ] Buttons have proper labels
- [ ] Images have alt text
- [ ] Color contrast sufficient

### Visual Feedback
- [ ] Loading spinners appear
- [ ] Success toasts show
- [ ] Error toasts show in red
- [ ] Buttons disable during loading
- [ ] Hover states work

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Final Verification

### API Coverage
- [ ] All 21 endpoints integrated
- [ ] All return expected data format
- [ ] All mutations work correctly

### Data Integrity
- [ ] Event participants persist
- [ ] Notification read status persists
- [ ] Recommendations regenerate correctly
- [ ] Lists data accurate

### User Flow
- [ ] Complete user journey works:
  1. Signup with competences
  2. Login
  3. View recommendations
  4. View event
  5. Participate in event
  6. Receive notification
  7. Mark notification as read
  8. Logout

---

## Sign-off

- [ ] All critical tests passed
- [ ] All integration points verified
- [ ] Error handling confirmed
- [ ] Performance acceptable
- [ ] UI/UX satisfactory
- [ ] Ready for deployment

**Tested by**: _______________
**Date**: _______________
**Signature**: _______________

---

## Notes
_Record any issues found during testing:_

```
Issue #1:


Issue #2:


Issue #3:

```

---

## Quick Test Commands

### Create Event
```bash
curl -X POST http://localhost:8080/events \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Event",
    "description": "Test Description",
    "type": "Workshop",
    "organisateur": "org@fst.tn",
    "dateHeure": "2026-05-15T14:00:00",
    "lieu": "Room 101",
    "nombrePlaces": 50
  }'
```

### Create Notification
```bash
curl -X POST http://localhost:8080/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@fst.tn",
    "titre": "Test Notification",
    "message": "This is a test",
    "type": "INFO"
  }'
```

### Get Recommendations
```bash
curl http://localhost:8080/recommendations/user/student@fst.tn
```

### Get Competences
```bash
curl http://localhost:8080/lists/competences
```

### Get Facultes
```bash
curl http://localhost:8080/lists/facultes
```
