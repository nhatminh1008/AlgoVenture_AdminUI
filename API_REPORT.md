# API Testing Report

**Project:** AlgoVenture Backend + Frontend  
**Date:** 2026-11-04  
**Purpose:** Comprehensive list of all APIs for testing

---

## 1. Backend APIs

### 1.1 Authentication APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| GET | `/api/health` | Health check | ✅ Existing | Low |
| GET | `/api/auth/csrf` | Get CSRF token | ✅ Existing | High |
| POST | `/api/auth/login` | Login | ✅ Existing | High |
| POST | `/api/auth/logout` | Logout | ✅ Existing | High |
| GET | `/api/auth/me` | Get current user info | ✅ Existing | High |
| POST | `/api/auth/forgot-password` | Request password reset | ✅ **NEW** | High |
| POST | `/api/auth/reset-password` | Reset password with token | ✅ **NEW** | High |

### 1.2 Admin User Management APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| GET | `/api/admin/users` | List users (paginated, search, filter) | ✅ Existing | High |
| GET | `/api/admin/users/{id}` | Get user details | ✅ Existing | High |
| POST | `/api/admin/users` | Create user | ✅ Existing | High |
| PUT | `/api/admin/users/{id}` | Update user (name, role, status) | ✅ Existing | High |
| PUT | `/api/admin/users/{id}/role` | Change user role | ✅ **NEW** | High |
| PUT | `/api/admin/users/{id}/status` | Activate/Deactivate user | ✅ **NEW** | High |

### 1.3 Admin Instructor Management APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| GET | `/api/admin/instructors` | List instructors (paginated, search, filter) | ✅ Existing | High |
| POST | `/api/admin/instructors` | Create instructor | ✅ Existing | High |
| GET | `/api/admin/instructors/{id}` | Get instructor details | ✅ Existing | High |
| PUT | `/api/admin/instructors/{id}` | Update instructor name | ✅ Existing | High |
| PUT | `/api/admin/instructors/{id}/status` | Activate/Deactivate instructor | ✅ Existing | High |

### 1.4 Admin Content Management APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| GET | `/api/admin/algorithms` | List algorithms | ✅ Existing | Medium |
| PUT | `/api/admin/algorithms/{id}` | Configure algorithm | ✅ Existing | Medium |
| GET | `/api/admin/features` | List feature toggles | ✅ Existing | Medium |
| PUT | `/api/admin/features/{id}` | Toggle feature | ✅ Existing | Medium |
| GET | `/api/admin/settings` | Get system settings | ✅ Existing | Medium |
| PUT | `/api/admin/settings` | Update system settings | ✅ Existing | Medium |
| GET | `/api/admin/analytics` | Get system analytics | ✅ Existing | Medium |
| GET | `/api/admin/export` | Export data | ✅ Existing | Low |
| GET | `/api/admin/classes` | List classes | ✅ Existing | Medium |
| PUT | `/api/admin/classes/{id}/instructor` | Assign instructor to class | ✅ Existing | Medium |
| POST | `/api/admin/classes/{id}/members` | Enroll member to class | ✅ Existing | Medium |
| GET | `/api/admin/classes/{id}/members` | List class members | ✅ Existing | Medium |
| DELETE | `/api/admin/classes/{id}/members/{uid}` | Remove member from class | ✅ Existing | Medium |

### 1.5 Instructor APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| GET | `/api/instructor/state` | Get instructor state | ✅ Existing | High |
| GET | `/api/instructor/curriculum` | Get curriculum | ✅ Existing | Medium |
| POST | `/api/instructor/classes` | Create class | ✅ Existing | High |
| PUT | `/api/instructor/classes/{id}` | Update class | ✅ Existing | High |
| POST | `/api/instructor/assignments` | Create assignment | ✅ Existing | High |
| PUT | `/api/instructor/assignments/{id}` | Update assignment | ✅ Existing | High |
| POST | `/api/instructor/quizzes` | Create quiz | ✅ Existing | High |
| PUT | `/api/instructor/quizzes/{id}` | Update quiz | ✅ Existing | High |
| DELETE | `/api/instructor/quizzes/{id}` | Delete quiz | ✅ Existing | High |
| GET | `/api/instructor/classes/{cid}/materials` | List materials | ✅ Existing | Medium |
| POST | `/api/instructor/classes/{cid}/materials` | Upload material | ✅ Existing | Medium |
| GET | `/api/instructor/classes/{cid}/materials/{id}/download` | Download material | ✅ Existing | Medium |
| DELETE | `/api/instructor/classes/{cid}/materials/{id}` | Delete material | ✅ Existing | Medium |

### 1.6 Learner APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| POST | `/api/learner/sessions` | Create learner session | ✅ Existing | High |
| GET | `/api/learner/profile` | Get learner profile | ✅ Existing | High |
| PUT | `/api/learner/profile` | Update learner profile | ✅ Existing | High |
| POST | `/api/learner/practice` | Submit practice event | ✅ Existing | High |
| GET | `/api/learner/progress` | Get learner progress | ✅ Existing | High |

### 1.7 Game APIs

| Method | Endpoint | Purpose | Status | Test Priority |
|--------|----------|---------|--------|----------------|
| POST | `/api/game/auth/register` | Game auth register | ✅ Existing | High |
| POST | `/api/game/auth/login` | Game auth login | ✅ Existing | High |
| POST | `/api/game/start` | Start game session | ✅ Existing | High |
| POST | `/api/game/action` | Submit game action | ✅ Existing | High |
| POST | `/api/game/submit` | Submit game result | ✅ Existing | High |

---

## 2. Frontend API Calls

### 2.1 Admin Portal (`algoventure-admin`)

#### Authentication
- `GET /api/auth/csrf` - Get CSRF token
- `POST /api/auth/login` - Login (email, password)
- `POST /api/auth/logout` - Logout

#### User Management (`UserManagement.jsx`)
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user (email, name, role, status)

#### Admin Classes (`AdminClasses.jsx`)
- `GET /api/admin/users` - Get users list (filter for instructors)
- `GET /api/admin/classes` - List classes
- `PUT /api/admin/classes/{id}/instructor` - Assign instructor

#### Dashboard (`Dashboard.jsx`)
- `GET /api/admin/analytics` - Get analytics

#### Content Levels (`ContentLevels.jsx`)
- `GET /api/admin/algorithms` - List algorithms

#### Feature Toggles (`FeatureToggles.jsx`)
- `GET /api/admin/features` - List features
- `PUT /api/admin/features/{id}` - Toggle feature

#### Settings (`Settings.jsx`)
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

#### System Analytics (`SystemAnalytics.jsx`)
- `GET /api/admin/analytics` - Get analytics

### 2.2 Instructor Portal (`algoventure-admin/src/instructor`)

#### Classroom Management
- `GET /api/instructor/state` - Get instructor state
- `GET /api/instructor/classes` - List classes
- `POST /api/instructor/classes` - Create class
- `PUT /api/instructor/classes/{id}` - Update class

#### Materials (`materials.js`)
- `GET /api/instructor/classes/{classId}/materials` - List materials
- `POST /api/instructor/classes/{classId}/materials` - Upload material
- `GET /api/instructor/classes/{classId}/materials/{id}/download` - Download material
- `DELETE /api/instructor/classes/{classId}/materials/{id}` - Delete material

#### Classroom Context (`ClassroomContext.jsx`)
- `GET /api/instructor/state` - Get state
- `POST /api/instructor/classes` - Create class
- `PUT /api/instructor/classes/{id}` - Update class
- `DELETE /api/instructor/quizzes/{id}` - Delete quiz

---

## 3. New APIs Requiring Testing (Priority: HIGH)

### 3.1 Admin User Management

**PUT /api/admin/users/{id}/role**
- **Purpose:** Change user role separately
- **Request:** `{"role": "instructor"}`
- **Valid roles:** admin, instructor, learner
- **Rules:**
  - Cannot change role of inactive account
  - Cannot downgrade instructor with active classrooms
  - Cannot downgrade learner with enrollments
  - Cannot self-downgrade if last active admin
- **Test Cases:**
  - ✅ Change learner to instructor (success)
  - ✅ Change instructor to learner (success)
  - ❌ Change role of inactive account (should fail)
  - ❌ Change role of instructor with active classrooms (should fail)
  - ❌ Self-downgrade as last active admin (should fail)

**PUT /api/admin/users/{id}/status**
- **Purpose:** Activate/Deactivate user
- **Request:** `{"active": false}` or `{"active": true}`
- **Rules:**
  - `active: false` → Suspended
  - `active: true` → Active
  - Cannot self-deactivate if last active admin
- **Test Cases:**
  - ✅ Deactivate user (success)
  - ✅ Activate suspended user (success)
  - ❌ Self-deactivate as last active admin (should fail)
  - ❌ Deactivate already inactive account (should fail)
  - ❌ Activate already active account (should fail)

### 3.2 Forgot/Reset Password

**POST /api/auth/forgot-password**
- **Purpose:** Request password reset
- **Request:** `{"email": "user@example.com"}`
- **Rules:**
  - Email not found → Return success (don't reveal)
  - Email found but inactive → Return success (don't reveal)
  - Email found and active → Generate token, log to console
- **Test Cases:**
  - ✅ Request with valid email (check console for token)
  - ✅ Request with invalid email (still returns success)

**POST /api/auth/reset-password**
- **Purpose:** Reset password with token
- **Request:** `{"token": "uuid", "password": "NewPassword123"}`
- **Rules:**
  - Token invalid/expired → Fail
  - Token already used → Fail
  - User inactive → Fail
  - Password invalid format → Fail
- **Test Cases:**
  - ✅ Reset with valid token (success)
  - ❌ Reset with invalid token (should fail)
  - ❌ Reset with expired token (should fail)
  - ❌ Reset with used token (should fail)
  - ❌ Reset for inactive user (should fail)

---

## 4. Testing Checklist

### 4.1 Critical Path Testing (MUST TEST)

**Authentication:**
- [ ] Login as Admin
- [ ] Login as Instructor
- [ ] Login as Learner
- [ ] Check role-based access control

**Admin User Management:**
- [ ] GET /api/admin/users (with pagination, search, filter)
- [ ] GET /api/admin/users/{id}
- [ ] POST /api/admin/users (create user)
- [ ] PUT /api/admin/users/{id} (legacy update)
- [ ] PUT /api/admin/users/{id}/role (NEW)
- [ ] PUT /api/admin/users/{id}/status (NEW)

**Admin Instructor Management:**
- [ ] GET /api/admin/instructors
- [ ] POST /api/admin/instructors
- [ ] GET /api/admin/instructors/{id}
- [ ] PUT /api/admin/instructors/{id}
- [ ] PUT /api/admin/instructors/{id}/status

**Forgot/Reset Password:**
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password

**Instructor Portal:**
- [ ] GET /api/instructor/state
- [ ] GET /api/instructor/classes
- [ ] POST /api/instructor/classes

### 4.2 Edge Cases

**Inactive Account Rules:**
- [ ] Verify inactive user cannot login
- [ ] Verify PUT /users/{id}/role rejects inactive user
- [ ] Verify PUT /users/{id}/status can activate inactive user
- [ ] Verify PUT /instructors/{id} rejects inactive instructor
- [ ] Verify POST /reset-password rejects inactive user

**Self-Protection:**
- [ ] Verify admin cannot self-deactivate if last active admin
- [ ] Verify admin cannot self-downgrade role if last active admin

**Constraints:**
- [ ] Verify cannot change role of instructor with active classrooms
- [ ] Verify cannot change role of learner with enrollments
- [ ] Verify cannot suspend instructor with active classrooms

---

## 5. Testing Tools

### 5.1 Swagger UI
- **URL:** http://localhost:8081/swagger-ui.html
- **Use for:** Backend API testing without frontend

### 5.2 Postman
- **Use for:** API testing with saved collections
- **Note:** Need to handle CSRF token for POST/PUT/DELETE

### 5.3 Browser DevTools
- **Use for:** Frontend debugging, network tab to see API calls

---

## 6. CSRF Token Handling

For POST/PUT/DELETE requests:

1. **First:** Get CSRF token
   ```
   GET /api/auth/csrf
   Response: {"token": "...", "headerName": "X-XSRF-TOKEN"}
   ```

2. **Then:** Make request with CSRF header
   ```
   Header: X-XSRF-TOKEN: <token>
   ```

**Swagger UI** handles this automatically.  
**Postman** needs manual CSRF token handling.

---

## 7. Status Summary

**Backend APIs:**
- Total: 60+ APIs
- Existing: 54
- New: 6 (forgot-password, reset-password, role, status updates)
- Status: **Complete, needs testing**

**Frontend API Calls:**
- Total: 20+ API calls
- Status: **Existing, compatible with backend**

**Next Steps:**
1. Test Backend APIs via Swagger/Postman
2. Test Frontend functionality
3. Resolve any issues found
4. Commit and push changes

---

**Report Generated:** 2026-11-04  
**Backend Status:** Complete, Untested  
**Frontend Status:** Compatible, Untested  
**Overall:** Ready for Testing
