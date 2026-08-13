# Quick Test Guide - New Profile APIs

## 🚀 Quick Start

### 1. Restart Auth Service
The User entity has changed, so restart the auth-service to apply database changes:

```bash
# Stop the auth-service (Ctrl+C in its terminal)
# Then restart it
cd backend/services/auth-service
mvn spring-boot:run
```

**What happens**: JPA will automatically create the new tables (`user_competences`, `user_sponsors`) and add new columns to the `users` table.

---

## ✅ Test Scenarios

### Scenario 1: New Student Signup with Competences

**Frontend Test**:
1. Navigate to http://localhost:5173/signup/student
2. Fill all fields:
   - Nom: Ben Ali
   - Prénom: Ahmed
   - Email: ahmed@fst.tn
   - Password: password123
   - Faculté: Select "Faculté des Sciences de Tunis"
   - Compétences: Add "Java", "Python", "React"
   - ID Universitaire: FST2024001
3. Click "Créer un compte"
4. Should redirect to dashboard

**Backend Test**:
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@fst.tn",
    "password": "password123",
    "name": "Test User",
    "role": "INDIVIDU",
    "faculte": "Faculté des Sciences de Tunis",
    "specialite": "Informatique",
    "idUniversitaire": "FST2024001",
    "competences": ["Java", "Python", "React"]
  }'
```

**Expected**: User created with competences saved

---

### Scenario 2: Verify User Profile Has Competences

**Frontend Test**:
1. Login with the user created above
2. Navigate to Profile page
3. Should see:
   - Faculté displayed
   - Spécialité displayed
   - ID universitaire displayed
   - Competences shown as badges

**Backend Test**:
```bash
curl http://localhost:8080/auth/users/ahmed@fst.tn
# or
curl http://localhost:8080/auth/users/test@fst.tn
```

**Expected Response**:
```json
{
  "id": 1,
  "email": "ahmed@fst.tn",
  "name": "Ahmed Ben Ali",
  "role": "INDIVIDU",
  "faculte": "Faculté des Sciences de Tunis",
  "specialite": "Faculté des Sciences de Tunis",
  "idUniversitaire": "FST2024001",
  "competences": ["Java", "Python", "React"],
  "avatar": null,
  "organizationType": null,
  "responsableNom": null,
  "responsableEmail": null,
  "responsableTelephone": null,
  "sponsors": [],
  "logo": null
}
```

---

### Scenario 3: Edit Profile

**Frontend Test**:
1. On Profile page, click "Modifier" button
2. Should navigate to /profile/edit
3. Form should be pre-filled with current data
4. Change competences:
   - Remove "Python"
   - Add "Spring Boot"
   - Add "Docker"
5. Change Spécialité to "Génie Logiciel"
6. Click "Enregistrer"
7. Should redirect to /profile
8. Profile should show updated data

**Backend Test**:
```bash
curl -X PUT http://localhost:8080/auth/users/ahmed@fst.tn \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ben Ali",
    "faculte": "Faculté des Sciences de Tunis",
    "specialite": "Génie Logiciel",
    "idUniversitaire": "FST2024001",
    "competences": ["Java", "React", "Spring Boot", "Docker"]
  }'
```

**Expected**: HTTP 200, profile updated

---

### Scenario 4: Test Recommendations with Competences

**Prerequisites**: Create a project that matches user competences

**Step 1**: Create a project with "Java" in title/description
```bash
# Login first to get token, or create via frontend
curl -X POST http://localhost:8080/projets \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Java Spring Boot Microservices",
    "desc": "Build scalable microservices using Java and Spring Boot framework",
    "chefProjet": "chef@fst.tn",
    "organisation": "Tech Club",
    "deadline": "2026-12-31",
    "validite": true,
    "status": "EN_COURS",
    "progression": 0,
    "membres": []
  }'
```

**Step 2**: Get recommendations
```bash
curl http://localhost:8080/recommendations/user/ahmed@fst.tn
```

**Expected Response**:
```json
[
  {
    "id": "...",
    "userId": "ahmed@fst.tn",
    "projetId": "...",
    "titre": "Java Spring Boot Microservices",
    "categorie": "Tech Club",
    "competenceMatch": 40,
    "dateRecommendation": "2026-03-29T...",
    "competencesMatched": ["Java", "Spring Boot"]
  }
]
```

**Match Score Calculation**:
- "Java" found in title/description → +20%
- "Spring Boot" found in title/description → +20%
- **Total**: 40% match

**Frontend Test**:
1. Navigate to /recommendations
2. Should see project recommendations
3. Match percentage should be displayed
4. Matched competences shown as badges
5. Click "Actualiser" to refresh recommendations

---

### Scenario 5: Organization Signup

**Frontend Test**:
1. Navigate to http://localhost:5173/signup/organization
2. Fill fields:
   - Nom du club: "Club IEEE FST"
   - Type: "Club"
   - Email: club@fst.tn
   - Password: password123
   - Responsable Nom: "Fatima Zahra"
   - Responsable Email: fatima@fst.tn
   - Responsable Téléphone: "+216 12345678"
   - Add sponsor: "Microsoft"
3. Click "Créer le compte organisationnel"
4. Should redirect to dashboard

**Backend Test**:
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "club@fst.tn",
    "password": "password123",
    "name": "Club IEEE FST",
    "role": "ORGANISATION",
    "organizationType": "Club",
    "responsableNom": "Fatima Zahra",
    "responsableEmail": "fatima@fst.tn",
    "responsableTelephone": "+216 12345678",
    "sponsors": ["Microsoft", "Google"]
  }'
```

---

## 🐛 Troubleshooting

### Issue: "competences" field not saving

**Solution**: Restart auth-service after updating User entity
```bash
cd backend/services/auth-service
# Ctrl+C to stop
mvn spring-boot:run
```

### Issue: Database error on startup

**Solution**: The JPA schema update might conflict. Check auth-service logs:
```bash
# Look for:
# "Schema-validation: missing table [user_competences]"
# or
# "Schema-validation: missing column [faculte]"
```

If you see errors, you can either:
1. **Option A**: Drop and recreate the database (⚠️ loses data)
   ```sql
   DROP DATABASE auth_db;
   CREATE DATABASE auth_db;
   ```

2. **Option B**: Manually add the columns (preserves data)
   ```sql
   USE auth_db;
   ALTER TABLE users ADD COLUMN faculte VARCHAR(255);
   ALTER TABLE users ADD COLUMN specialite VARCHAR(255);
   ALTER TABLE users ADD COLUMN id_universitaire VARCHAR(255);
   ALTER TABLE users ADD COLUMN avatar VARCHAR(255);
   -- ... add other columns

   CREATE TABLE user_competences (
       user_id BIGINT NOT NULL,
       competence VARCHAR(255),
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

### Issue: Recommendations return empty array

**Check**:
1. User has competences: `curl http://localhost:8080/auth/users/{email}`
2. Projects exist: `curl http://localhost:8080/projets`
3. Projects have keywords matching competences in title/description

**Debug**:
```bash
# Check recommendation service logs for errors
# Look for: "Error generating recommendations"
```

### Issue: Frontend shows "undefined" for faculte/competences

**Solution**:
1. Check network tab - does API return the fields?
2. Clear browser cache and reload
3. Check if user was created before or after the entity update
   - Old users: Won't have competences, need to edit profile
   - New users: Should have competences from signup

---

## 📊 Success Indicators

### ✅ Everything is working if:

1. **Registration**:
   - Student signup saves competences to database
   - GET /auth/users/{email} returns competences array

2. **Profile**:
   - Profile page displays faculte, specialite, competences
   - Edit profile page loads with current data
   - Profile updates persist to database

3. **Recommendations**:
   - GET /recommendations returns non-empty array
   - Match scores are > 0%
   - Matched competences listed correctly

4. **Database**:
   - `user_competences` table exists
   - `users` table has new columns
   - Data persists after restart

---

## 🎯 Quick Validation Commands

Run these to verify everything works:

```bash
# 1. Create user with competences
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fst.tn","password":"pass","name":"Test","role":"INDIVIDU","competences":["Java","Python"]}'

# 2. Verify competences saved
curl http://localhost:8080/auth/users/test@fst.tn | grep -o '"competences":\[[^]]*\]'

# Expected: "competences":["Java","Python"]

# 3. Update profile
curl -X PUT http://localhost:8080/auth/users/test@fst.tn \
  -H "Content-Type: application/json" \
  -d '{"competences":["Java","React","Docker"]}'

# 4. Verify update
curl http://localhost:8080/auth/users/test@fst.tn | grep -o '"competences":\[[^]]*\]'

# Expected: "competences":["Java","React","Docker"]

# 5. Test recommendations
curl http://localhost:8080/recommendations/user/test@fst.tn

# Expected: Array of recommendations (may be empty if no matching projects)
```

---

## 🎉 Complete Test Checklist

- [ ] Auth service restarted after entity changes
- [ ] Database schema updated (new tables/columns created)
- [ ] Student signup with competences works
- [ ] User profile displays competences
- [ ] Profile edit page works
- [ ] Profile updates persist
- [ ] Recommendations API returns results
- [ ] Organization signup with responsable details works
- [ ] Frontend shows all new fields
- [ ] No console errors in browser
- [ ] No errors in backend logs

**If all checked**: 🎊 **Everything is working perfectly!**

---

## 💡 Tips

1. **Clear browser cache** if you see old data
2. **Check backend logs** for detailed error messages
3. **Use browser DevTools Network tab** to see API responses
4. **Test with Postman/Insomnia** for direct API testing
5. **Verify database** using MySQL Workbench or command line

---

## 📞 Need Help?

Check these logs:
- Auth Service: Look for JPA schema updates on startup
- Recommendation Service: Look for "generating recommendations" messages
- Frontend Console: Check for API errors
- Network Tab: Verify API responses contain new fields
