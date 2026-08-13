# Missing APIs Analysis

## 🚨 Critical Issues Found

### 1. **User Profile Fields Missing in Backend** ⚠️ CRITICAL

#### Problem
The **User entity in auth-service** is missing essential fields that the frontend expects and the recommendation service needs.

**Current User Entity** (backend/services/auth-service/src/main/java/tn/fst/authservice/entity/User.java):
```java
@Entity
public class User {
    private Long id;
    private String email;
    private String password;
    private String name;
    private Role role;
}
```

**What Frontend Expects** (used in ProfilePage, SignupPage, Recommendations):
```typescript
interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: UserRole;
    avatar?: string;
    faculte?: string;           // ❌ MISSING
    specialite?: string;        // ❌ MISSING
    competences?: string[];     // ❌ MISSING (Critical for recommendations!)
    idUniversitaire?: string;   // ❌ MISSING
}
```

#### Impact
- ✅ **Login/Register**: Works (only needs email, password, name, role)
- ❌ **Profile Page**: Will show empty/undefined for faculte, specialite, idUniversitaire, competences
- ❌ **Recommendations**: **Cannot work properly!** Needs user competences to match with projects
- ❌ **Signup Form**: Users can select competences/faculte but they're not saved to database

#### Solution Required
**Extend User entity**:
```java
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // ✨ NEW FIELDS NEEDED:
    private String faculte;

    private String specialite;

    private String idUniversitaire;

    private String avatar; // URL or path

    @ElementCollection
    @CollectionTable(name = "user_competences", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "competence")
    private List<String> competences = new ArrayList<>();
}
```

**Update DTOs**:
- `RegisterRequest` - Add faculte, specialite, idUniversitaire, competences
- `UserResponse` - Add faculte, specialite, idUniversitaire, competences, avatar
- `AuthResponse` - Include full user info

**Update Endpoints**:
- `POST /auth/register` - Accept additional fields
- `GET /auth/users/{email}` - Return full user info including competences
- `PUT /auth/users/{email}` - **NEW ENDPOINT** for profile updates

---

### 2. **Profile Update Endpoint Missing** ⚠️ HIGH PRIORITY

#### Problem
Users cannot update their profile information.

**Frontend Expectation**:
- ProfilePage has "Modifier" (Edit) button
- Needs to update: name, faculte, specialite, competences, avatar

**What's Missing**:
```java
// In AuthController.java
@PutMapping("/users/{email}")
public ResponseEntity<UserResponse> updateProfile(
    @PathVariable String email,
    @RequestBody UpdateProfileRequest request
) {
    return ResponseEntity.ok(authService.updateProfile(email, request));
}
```

**DTO Needed**:
```java
@Data
public class UpdateProfileRequest {
    private String name;
    private String faculte;
    private String specialite;
    private String idUniversitaire;
    private List<String> competences;
    private String avatar;
}
```

---

### 3. **Organization Profile Fields Missing** ⚠️ MEDIUM PRIORITY

#### Problem
Organization entity might need additional fields that signup form collects.

**Signup Form Collects**:
- Club name ✅ (stored as name)
- Type (Club/Association/Département) ❌ MISSING
- Official email ✅ (stored as email)
- Responsable info (nom, email, telephone) ❌ MISSING
- Sponsors (list) ❌ MISSING
- Logo ❌ MISSING

**Solution**:
Either extend User entity with organization-specific fields or create separate Organization entity linked to User.

---

### 4. **Statistics/Dashboard Endpoints** ℹ️ OPTIONAL

#### Current State
Dashboard pages calculate statistics on frontend by filtering existing data.

**Could Add** (optional optimization):
```java
// GET /auth/users/{email}/stats
{
    "totalProjects": 5,
    "activeProjects": 3,
    "completedTasks": 42,
    "totalTasks": 50,
    "eventsParticipated": 8,
    "badges": ["Premier projet", "5 tâches"]
}
```

This would reduce frontend API calls and data processing.

---

### 5. **File Upload Endpoints** ℹ️ NICE TO HAVE

#### Current State
- Event affiche: Uses URL string
- User avatar: Not implemented
- Project resources: Uses URL string

**Could Add**:
```java
// POST /upload/image
// Returns: { "url": "https://..." }
```

For now, users can use external image hosting (Imgur, Cloudinary, etc.)

---

## 📋 Complete Missing API List

### ⚠️ CRITICAL (Blocks Core Features)

1. **User Competences Field** - Backend entity update
   - **File**: `backend/services/auth-service/src/main/java/tn/fst/authservice/entity/User.java`
   - **Action**: Add competences, faculte, specialite, idUniversitaire fields
   - **Impact**: Recommendations won't work without this

### ⚠️ HIGH PRIORITY (User Experience)

2. **PUT /auth/users/{email}** - Update profile
   - **Endpoint**: `PUT /auth/users/{email}`
   - **Controller**: `AuthController`
   - **Service**: `AuthService.updateProfile()`
   - **DTO**: `UpdateProfileRequest`

3. **POST /auth/register** - Accept additional fields
   - **Current**: Only accepts email, password, name
   - **Needs**: faculte, specialite, idUniversitaire, competences

### ℹ️ MEDIUM PRIORITY (Nice to Have)

4. **Organization Extended Fields**
   - Type (Club/Association/Département)
   - Responsable details
   - Sponsors list
   - Logo URL

5. **GET /auth/users/{email}/stats** - User statistics
   - Project counts
   - Task completion rate
   - Event participation
   - Badges/achievements

### ℹ️ LOW PRIORITY (Future Enhancement)

6. **POST /upload/image** - File upload
   - For avatars
   - For event posters
   - Returns image URL

7. **GET /projects/{id}/members** - Detailed member info
   - With avatars and competences
   - Currently returns basic member list

8. **GET /events/upcoming** - Filter upcoming events
   - ✅ Already implemented! (in EventService)

---

## 🔧 Implementation Priority

### Phase 1: Fix Critical Issues (Required for MVP)

**Task 1.1**: Extend User Entity
```bash
Files to modify:
- backend/services/auth-service/src/main/java/tn/fst/authservice/entity/User.java
- backend/services/auth-service/src/main/java/tn/fst/authservice/dto/RegisterRequest.java
- backend/services/auth-service/src/main/java/tn/fst/authservice/dto/UserResponse.java
- backend/services/auth-service/src/main/java/tn/fst/authservice/service/AuthService.java
```

**Task 1.2**: Update Register Endpoint
```bash
Files to modify:
- backend/services/auth-service/src/main/java/tn/fst/authservice/controller/AuthController.java
- backend/services/auth-service/src/main/java/tn/fst/authservice/service/AuthService.java
```

**Task 1.3**: Update Frontend Signup
```bash
Files to modify:
- frontend/src/pages/SignupStudentPage.tsx (pass competences to API)
- frontend/src/lib/auth-context.tsx (update signup function)
```

### Phase 2: Add Profile Management (High Priority)

**Task 2.1**: Create Update Profile Endpoint
```bash
New files:
- backend/services/auth-service/src/main/java/tn/fst/authservice/dto/UpdateProfileRequest.java

Files to modify:
- backend/services/auth-service/src/main/java/tn/fst/authservice/controller/AuthController.java
- backend/services/auth-service/src/main/java/tn/fst/authservice/service/AuthService.java
```

**Task 2.2**: Create Profile Edit Page
```bash
New files:
- frontend/src/pages/EditProfilePage.tsx

Files to modify:
- frontend/src/lib/api.ts (add updateProfile function)
- frontend/src/pages/ProfilePage.tsx (link to edit page)
```

### Phase 3: Optional Enhancements

**Task 3.1**: Add Statistics Endpoint
**Task 3.2**: Add File Upload Service
**Task 3.3**: Extend Organization Fields

---

## 🧪 Testing After Implementation

### Test User Profile Update
```bash
# 1. Register with competences
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@fst.tn",
    "password": "password123",
    "name": "Ahmed Ben Ali",
    "role": "STUDENT",
    "faculte": "Faculté des Sciences de Tunis",
    "specialite": "Informatique",
    "idUniversitaire": "FST2024001",
    "competences": ["Java", "Python", "React"]
  }'

# 2. Get user with competences
curl http://localhost:8080/auth/users/test@fst.tn

# Expected response:
{
  "id": "1",
  "email": "test@fst.tn",
  "name": "Ahmed Ben Ali",
  "role": "STUDENT",
  "faculte": "Faculté des Sciences de Tunis",
  "specialite": "Informatique",
  "idUniversitaire": "FST2024001",
  "competences": ["Java", "Python", "React"]
}

# 3. Update profile
curl -X PUT http://localhost:8080/auth/users/test@fst.tn \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ben Ali",
    "faculte": "Faculté des Sciences de Tunis",
    "specialite": "Génie Logiciel",
    "competences": ["Java", "Spring Boot", "React", "Docker"]
  }'

# 4. Test recommendations with competences
curl http://localhost:8080/recommendations/user/test@fst.tn
```

---

## 📊 API Coverage Status

| Feature | Frontend Ready | Backend Ready | Status |
|---------|---------------|---------------|--------|
| Events | ✅ | ✅ | ✅ Complete |
| Notifications | ✅ | ✅ | ✅ Complete |
| Recommendations | ✅ | ✅ | ⚠️ Needs user competences |
| Lists (Competences/Facultes) | ✅ | ✅ | ✅ Complete |
| User Registration | ✅ | ⚠️ | ⚠️ Missing fields |
| User Profile View | ✅ | ⚠️ | ⚠️ Missing fields |
| User Profile Edit | ✅ UI exists | ❌ | ❌ No endpoint |
| Organization Signup | ✅ | ⚠️ | ⚠️ Basic only |
| File Upload | ❌ | ❌ | ❌ Not implemented |
| Statistics | ✅ Computed | ❌ | ℹ️ Optional |

---

## 🎯 Recommendation

### Immediate Action Required:

1. **Extend User Entity** with competences, faculte, specialite, idUniversitaire
2. **Update Register Endpoint** to accept and save these fields
3. **Add Profile Update Endpoint** (PUT /auth/users/{email})

### Why Critical:
- **Recommendations don't work** without user competences
- **Profile page shows empty data** without these fields
- **User experience is broken** - users can select competences but they're not saved

### Estimated Time:
- **User Entity Extension**: 30 minutes
- **Register Endpoint Update**: 20 minutes
- **Profile Update Endpoint**: 40 minutes
- **Testing**: 30 minutes
- **Total**: ~2 hours

Would you like me to implement these missing pieces now?
