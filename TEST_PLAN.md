# Test Plan - Backend API Implementation

## Pre-requisites
- All services running (use `start-services.bat`)
- MongoDB instances running (use `start-mongodb.bat`)
- MySQL running with auth_db created

## Phase 1: Service Registration Tests

### Test 1.1: Verify Eureka Registration
**URL**: http://localhost:8761

**Expected Result**:
- Dashboard loads successfully
- 6 services listed under "Instances currently registered with Eureka":
  - AUTH-SERVICE (1 instance)
  - PROJECT-SERVICE (1 instance)
  - EVENT-SERVICE (1 instance)
  - NOTIFICATION-SERVICE (1 instance)
  - RECOMMENDATION-SERVICE (1 instance)
  - API-GATEWAY (1 instance)

**Status**: [ ] Pass [ ] Fail

---

## Phase 2: List Endpoints Tests (Auth Service)

### Test 2.1: Get Competences List
```bash
curl http://localhost:8080/lists/competences
```

**Expected Result**:
- HTTP 200 OK
- JSON array with 40+ competences
- Includes: "Java", "Python", "React", "Machine Learning", etc.

**Status**: [ ] Pass [ ] Fail

### Test 2.2: Get Facultes List
```bash
curl http://localhost:8080/lists/facultes
```

**Expected Result**:
- HTTP 200 OK
- JSON array with 12+ facultes
- Includes "Faculté des Sciences de Tunis", etc.

**Status**: [ ] Pass [ ] Fail

---

## Phase 3: Event Service Tests

### Test 3.1: Get All Events (Empty)
```bash
curl http://localhost:8080/events
```

**Expected Result**:
- HTTP 200 OK
- Empty array `[]` (no events yet)

**Status**: [ ] Pass [ ] Fail

### Test 3.2: Create Event
```bash
curl -X POST http://localhost:8080/events \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Workshop Spring Boot",
    "description": "Atelier pratique sur les microservices Spring Boot",
    "type": "Workshop",
    "organisateur": "org@fst.tn",
    "dateHeure": "2026-04-15T14:00:00",
    "lieu": "Salle 101, FST",
    "nombrePlaces": 30,
    "partenaires": ["Google", "Microsoft"],
    "affiche": "https://example.com/poster.jpg"
  }'
```

**Expected Result**:
- HTTP 201 Created
- JSON response with event details
- Contains: `id`, `titre`, `placesRestantes: 30`, `participants: []`

**Save Event ID**: _________________

**Status**: [ ] Pass [ ] Fail

### Test 3.3: Get Event by ID
```bash
curl http://localhost:8080/events/{EVENT_ID}
```

**Expected Result**:
- HTTP 200 OK
- Event details match created event

**Status**: [ ] Pass [ ] Fail

### Test 3.4: Participate in Event
```bash
curl -X POST http://localhost:8080/events/{EVENT_ID}/participate \
  -H "Content-Type: application/json" \
  -d '{"email": "student@fst.tn"}'
```

**Expected Result**:
- HTTP 200 OK
- `participants` array contains "student@fst.tn"
- `placesRestantes` decreased by 1 (now 29)

**Status**: [ ] Pass [ ] Fail

### Test 3.5: Get Upcoming Events
```bash
curl http://localhost:8080/events/upcoming
```

**Expected Result**:
- HTTP 200 OK
- Array with created event (date is in future)

**Status**: [ ] Pass [ ] Fail

### Test 3.6: Get User Participations
```bash
curl http://localhost:8080/events/participations/student@fst.tn
```

**Expected Result**:
- HTTP 200 OK
- Array with the event user participated in

**Status**: [ ] Pass [ ] Fail

---

## Phase 4: Notification Service Tests

### Test 4.1: Get User Notifications (Empty)
```bash
curl http://localhost:8080/notifications/user/student@fst.tn
```

**Expected Result**:
- HTTP 200 OK
- Empty array `[]`

**Status**: [ ] Pass [ ] Fail

### Test 4.2: Create Notification
```bash
curl -X POST http://localhost:8080/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "student@fst.tn",
    "titre": "Nouveau projet disponible",
    "message": "Un nouveau projet correspond à vos compétences",
    "type": "INFO",
    "relatedEntityType": "PROJECT",
    "relatedEntityId": "proj123"
  }'
```

**Expected Result**:
- HTTP 201 Created
- JSON response with notification details
- `lu: false` (unread)
- Contains timestamp

**Save Notification ID**: _________________

**Status**: [ ] Pass [ ] Fail

### Test 4.3: Get User Notifications
```bash
curl http://localhost:8080/notifications/user/student@fst.tn
```

**Expected Result**:
- HTTP 200 OK
- Array with 1 notification

**Status**: [ ] Pass [ ] Fail

### Test 4.4: Get Unread Count
```bash
curl http://localhost:8080/notifications/user/student@fst.tn/unread/count
```

**Expected Result**:
- HTTP 200 OK
- `{"count": 1}`

**Status**: [ ] Pass [ ] Fail

### Test 4.5: Mark Notification as Read
```bash
curl -X PATCH http://localhost:8080/notifications/{NOTIFICATION_ID}/read
```

**Expected Result**:
- HTTP 200 OK
- `lu: true` in response

**Status**: [ ] Pass [ ] Fail

### Test 4.6: Verify Unread Count Decreased
```bash
curl http://localhost:8080/notifications/user/student@fst.tn/unread/count
```

**Expected Result**:
- HTTP 200 OK
- `{"count": 0}`

**Status**: [ ] Pass [ ] Fail

---

## Phase 5: Recommendation Service Tests

### Test 5.1: Get Recommendations (Auto-generate)
```bash
curl http://localhost:8080/recommendations/user/student@fst.tn
```

**Expected Result**:
- HTTP 200 OK
- Array of recommendations (may be empty if no projects or user has no competences)
- If not empty, each has: `id`, `projetId`, `titre`, `competenceMatch`, `competencesMatched`

**Status**: [ ] Pass [ ] Fail

### Test 5.2: Refresh Recommendations
```bash
curl -X POST http://localhost:8080/recommendations/user/student@fst.tn/refresh
```

**Expected Result**:
- HTTP 200 OK
- Fresh recommendations generated

**Status**: [ ] Pass [ ] Fail

---

## Phase 6: Gateway Integration Tests

### Test 6.1: Auth Service through Gateway
```bash
curl http://localhost:8080/auth/health
```

**Expected Result**:
- Request routes through gateway to AUTH-SERVICE

**Status**: [ ] Pass [ ] Fail

### Test 6.2: Project Service through Gateway
```bash
curl http://localhost:8080/projets
```

**Expected Result**:
- Request routes through gateway to PROJECT-SERVICE

**Status**: [ ] Pass [ ] Fail

### Test 6.3: All New Services Accessible
Verify these all return proper responses (not 404):
- [ ] `curl http://localhost:8080/events`
- [ ] `curl http://localhost:8080/notifications/user/test@example.com`
- [ ] `curl http://localhost:8080/recommendations/user/test@example.com`
- [ ] `curl http://localhost:8080/lists/competences`

**Status**: [ ] Pass [ ] Fail

---

## Phase 7: Frontend Integration Tests

### Test 7.1: Frontend Loads
**URL**: http://localhost:5173

**Expected Result**:
- Application loads without errors
- No console errors related to API calls

**Status**: [ ] Pass [ ] Fail

### Test 7.2: Events Page
**Navigate to**: Events page

**Expected Result**:
- Page loads
- Events list displays (shows created event)
- Can view event details
- Can participate in events

**Status**: [ ] Pass [ ] Fail

### Test 7.3: Notifications Page
**Navigate to**: Notifications page

**Expected Result**:
- Page loads
- Notifications display
- Unread count shows in navigation
- Can mark as read

**Status**: [ ] Pass [ ] Fail

### Test 7.4: Recommendations Page
**Navigate to**: Recommendations page

**Expected Result**:
- Page loads
- Recommendations display (or empty state)
- Shows competence match percentage

**Status**: [ ] Pass [ ] Fail

### Test 7.5: Signup Form
**Navigate to**: Signup page

**Expected Result**:
- Competences dropdown loads
- Facultes dropdown loads
- Both show multiple options

**Status**: [ ] Pass [ ] Fail

---

## Phase 8: Error Handling Tests

### Test 8.1: Invalid Event ID
```bash
curl http://localhost:8080/events/invalid-id-123
```

**Expected Result**:
- HTTP 500 or 404
- Error message in response

**Status**: [ ] Pass [ ] Fail

### Test 8.2: Create Event with Missing Fields
```bash
curl -X POST http://localhost:8080/events \
  -H "Content-Type: application/json" \
  -d '{"titre": "Test"}'
```

**Expected Result**:
- HTTP 400 Bad Request
- Validation error messages

**Status**: [ ] Pass [ ] Fail

### Test 8.3: Service Down Handling
1. Stop Event Service
2. Try to access: `curl http://localhost:8080/events`

**Expected Result**:
- HTTP 503 Service Unavailable or connection error
- Gateway handles gracefully

**Status**: [ ] Pass [ ] Fail

---

## Phase 9: Cross-Service Integration Tests

### Test 9.1: Recommendations Use Auth Service
**Prerequisites**: Create user with competences in auth-service

```bash
# Verify recommendations fetch user data
curl http://localhost:8080/recommendations/user/{USER_EMAIL}/refresh
```

**Expected Result**:
- Recommendations generated based on user competences
- If user has "Java" competence, projects with "Java" in title/desc get recommended

**Status**: [ ] Pass [ ] Fail

### Test 9.2: Recommendations Use Project Service
**Prerequisites**: Create projects in project-service

```bash
# Verify recommendations fetch project data
curl http://localhost:8080/recommendations/user/student@fst.tn/refresh
```

**Expected Result**:
- Recommendations include existing projects
- Match scores calculated correctly

**Status**: [ ] Pass [ ] Fail

---

## Phase 10: Load and Performance Tests

### Test 10.1: Create Multiple Events
Create 10 events using the POST endpoint

**Expected Result**:
- All events created successfully
- GET /events returns all 10 events
- Response time < 1 second

**Status**: [ ] Pass [ ] Fail

### Test 10.2: Create Multiple Notifications
Create 50 notifications for a user

**Expected Result**:
- All notifications created
- GET /notifications/user/{email} returns all 50
- Sorted by timestamp (newest first)

**Status**: [ ] Pass [ ] Fail

---

## Test Summary

| Phase | Tests | Passed | Failed | Notes |
|-------|-------|--------|--------|-------|
| 1. Service Registration | 1 | | | |
| 2. List Endpoints | 2 | | | |
| 3. Event Service | 6 | | | |
| 4. Notification Service | 6 | | | |
| 5. Recommendation Service | 2 | | | |
| 6. Gateway Integration | 3 | | | |
| 7. Frontend Integration | 5 | | | |
| 8. Error Handling | 3 | | | |
| 9. Cross-Service Integration | 2 | | | |
| 10. Performance | 2 | | | |
| **TOTAL** | **32** | | | |

---

## Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Notes
- Test Date: _______________
- Tester: _______________
- Environment: Local Development
- All services version: 0.0.1-SNAPSHOT

## Sign-off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for further integration testing

**Tested by**: _______________
**Date**: _______________
**Signature**: _______________
