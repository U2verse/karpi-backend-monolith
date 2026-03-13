# Karpi LMS — API Contracts

Base URL: `/` (NestJS monolith)
Auth: `Authorization: Bearer <jwt>` unless marked **Public**

---

## Auth

### GET /auth/me
**Public** (reads `refresh_token` cookie) — Returns the currently authenticated user, or `null` if not logged in.

**Response 200**
```json
{
  "user_id": "uuid",
  "email": "admin@example.com",
  "role": "clientadmin",
  "tenant_id": "uuid",
  "client_id": 42
}
```
> `client_id` is the integer PK from the `clients` table, resolved by joining on `tenant_id`. Returns `null` for superadmin users who have no associated client row.

**Response 200 (not logged in)**
```json
null
```

---

## Plans

> Managed by SuperAdmin. Plans use a 3-table architecture: `plans`, `plan_limits`, `plan_features`.

### GET /plans
**Public** — List all plans with limits, features and client count.

**Response 200**
```json
[
  {
    "id": 5,
    "name": "Sprout",
    "feature_type": "Free Trial",
    "meaning": "Start growing",
    "price_monthly": "0",
    "price_yearly": "0",
    "save_percentage": null,
    "best_pick": false,
    "notes": null,
    "created_at": "2026-03-08T...",
    "clientCount": 0,
    "limits": {
      "storage_mb": "5120",
      "student_limit": "50",
      "course_limit": "2",
      "video_limit": "10",
      "assignment_limit": "3",
      "materials_per_course": "5",
      "admin_logins": "1"
    },
    "features": {
      "student_app_access": true,
      "certificates": null,
      "custom_domain": false,
      "subdomain": true,
      "analytics": "basic",
      "branding": "basic",
      "support_level": "basic"
    }
  }
]
```
> Unlimited values are returned as `"Unlimited"` (string). Numeric limits are returned as strings for UI consistency.

---

### GET /plans/:id
**Auth required (SuperAdminGuard)**

**Params:** `id` — plan id (integer)

**Response 200** — same shape as single item in GET /plans

**Response 404**
```json
{ "message": "Plan not found" }
```

---

### POST /plans
**Auth required (SuperAdminGuard)**

**Request Body**
```json
{
  "name": "Thrive",
  "feature_type": "Mid-Tier",
  "meaning": "Grow strong",
  "price_monthly": "1299",
  "price_yearly": "12999",
  "save_percentage": "17%",
  "best_pick": true,
  "notes": null,
  "limits": {
    "storage_mb": "102400",
    "student_limit": "2000",
    "course_limit": "100",
    "video_limit": "50",
    "assignment_limit": "20",
    "materials_per_course": "50",
    "admin_logins": "10"
  },
  "features": {
    "student_app_access": true,
    "certificates": "Yes",
    "custom_domain": true,
    "subdomain": true,
    "analytics": "advanced",
    "branding": "advanced_themes",
    "support_level": "business_hours"
  }
}
```

> Send `"Unlimited"` (string) for any limit field that should have no cap.
> `limits.materials_per_course` is optional.

**Response 201** — created plan (same shape as GET /plans/:id)

---

### PATCH /plans/:id
**Auth required (SuperAdminGuard)**

All fields are optional. Only send what needs to change.

**Request Body** (partial example)
```json
{
  "price_monthly": "1499",
  "best_pick": false,
  "limits": {
    "student_limit": "3000"
  },
  "features": {
    "support_level": "priority"
  }
}
```

**Response 200** — updated plan (same shape as GET /plans/:id)

**Response 404**
```json
{ "message": "Plan not found" }
```

---

### DELETE /plans/:id
**Auth required (SuperAdminGuard)**

**Params:** `id` — plan id (integer)

**Response 200**
```json
{ "message": "Plan deleted successfully" }
```

**Response 400** — plan has active client subscriptions
```json
{ "message": "Cannot delete this plan because it is currently assigned to clients." }
```

**Response 404**
```json
{ "message": "Plan not found" }
```

---

## Reference: Plan Field Values

### limits — numeric string or `"Unlimited"`
| Field | Description |
|---|---|
| `storage_mb` | Storage in MB (e.g. `"5120"` = 5 GB) |
| `student_limit` | Max students |
| `course_limit` | Max courses |
| `video_limit` | Max videos per course |
| `assignment_limit` | Max assignments per course |
| `materials_per_course` | Max materials per course |
| `admin_logins` | Max admin users |

### features — string enums
| Field | Allowed values |
|---|---|
| `analytics` | `"basic"` \| `"advanced"` \| `"white_label"` |
| `branding` | `"basic"` \| `"advanced_themes"` \| `"white_label"` |
| `support_level` | `"basic"` \| `"business_hours"` \| `"priority"` |
| `certificates` | `null` \| `"Yes"` \| `"Yes (Advanced)"` |
| `custom_domain` | `boolean` |
| `subdomain` | `boolean` |
| `student_app_access` | `boolean` |

---

## Students

> Tenant-scoped. All routes require `Authorization: Bearer <jwt>`.
> Admin routes require role `superadmin` or `clientadmin`. Student self-routes require role `student`.

### POST /students
**Roles:** `superadmin`, `clientadmin`

**Request Body**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "parent_name": "Suresh Kumar",
  "profile_image": null
}
```
> `tenant_id` is taken from the JWT — do not send in body.

**Response 201**
```json
{
  "student_id": "uuid",
  "tenant_id": "uuid",
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "parent_name": "Suresh Kumar",
  "profile_image": null,
  "status": "active",
  "created_at": "2026-03-09T..."
}
```

---

### GET /students
**Roles:** `superadmin`, `clientadmin`

Returns all students for the logged-in tenant.

**Response 200** — array of student objects (same shape as POST response)

---

### GET /students/me
**Roles:** `student`

Returns the logged-in student's own profile. `user_id` from JWT is used as `student_id`.

**Response 200** — single student object

---

### GET /students/:id
**Roles:** `superadmin`, `clientadmin`

**Response 200** — single student object

**Response 404**
```json
{ "message": "Student not found" }
```

---

### PATCH /students/:id
**Roles:** `superadmin`, `clientadmin`

All fields optional.

**Request Body**
```json
{
  "name": "Ravi K",
  "phone": "9999999999",
  "status": "inactive"
}
```

**Response 200** — updated student object

---

### DELETE /students/:id
**Roles:** `superadmin`

**Response 200**
```json
{ "success": true }
```

---

## Student Dashboard

### GET /students/me/dashboard
**Roles:** `student`

**Response 200**
```json
{
  "profile": { "student_id": "uuid", "name": "...", "email": "...", "status": "active" },
  "stats": {
    "totalCourses": 3,
    "completedCourses": 1,
    "activeCourses": 2,
    "totalPoints": 450
  },
  "enrollments": [],
  "points": []
}
```

---

## Enrollments

> Table: `student_enrollments`. Named to avoid conflict with superadmin `enrollments` table.

### POST /enrollments
**Roles:** `superadmin`, `clientadmin`

**Request Body**
```json
{
  "student_id": "uuid",
  "course_id": 1,
  "course_start_date": "2026-04-01",
  "status": "active"
}
```
> `course_start_date` and `status` are optional.

**Response 201** — enrollment object

---

### GET /enrollments
**Roles:** `superadmin`, `clientadmin`

Returns all enrollments for the tenant, with student relation.

---

### GET /enrollments/me
**Roles:** `student`

Returns the logged-in student's enrollments.

---

### GET /enrollments/:id
**Roles:** `superadmin`, `clientadmin`

---

### PATCH /enrollments/:id
**Roles:** `superadmin`, `clientadmin`

**Request Body** (all optional)
```json
{
  "course_id": 2,
  "course_start_date": "2026-05-01",
  "status": "completed"
}
```
> `status` enum: `active` | `completed` | `dropped`

---

### DELETE /enrollments/:id
**Roles:** `superadmin`, `clientadmin`

**Response 200**
```json
{ "success": true }
```

---

## Admissions

> Public token-based flow for student self-registration.

### POST /admissions/generate
**Roles:** `superadmin`, `clientadmin` (JWT required)

Generates a one-time admission link and emails it to the student.

**Request Body**
```json
{
  "student_email": "student@example.com",
  "student_name": "Ravi Kumar",
  "course_id": 1,
  "course_name": "Web Development",
  "amount": 4999,
  "expires_at": "2026-04-01T00:00:00Z"
}
```

**Response 201** — admission link record
```json
{
  "id": "uuid",
  "token": "hex64chars",
  "student_email": "student@example.com",
  "status": "pending",
  "expires_at": "2026-04-01T..."
}
```

---

### GET /admissions/link/:token
**Public**

Fetch admission link details (used by student app to render the form).

**Response 200** — admission link object

**Response 400** — already used or expired

**Response 404** — invalid token

---

### POST /admissions/submit/:token
**Public**

Student submits the admission form. Creates student + enrollment atomically.

**Request Body**
```json
{
  "student_name": "Ravi Kumar",
  "phone": "9876543210",
  "password": "secret123"
}
```

**Response 201**
```json
{
  "success": true,
  "student_id": "uuid",
  "auto_login": true,
  "email": "student@example.com",
  "password": "secret123"
}
```
> `password` is echoed back for auto-login on the student app. Use it to call the student login endpoint immediately after.

---

### GET /admissions
**Roles:** `superadmin`, `clientadmin` (JWT required)

Lists all admission links for the tenant.

---

## Student Course Points

### POST /points
**Roles:** `superadmin`, `clientadmin`

**Request Body**
```json
{
  "student_id": "uuid",
  "course_id": 1,
  "points_from_assignments": 100,
  "points_from_progress": 50
}
```

**Response 201** — points record

---

### GET /points
**Roles:** `superadmin`, `clientadmin` — all points for tenant

### GET /points/me
**Roles:** `student` — own points across all courses

### GET /points/student/:id
**Roles:** `superadmin`, `clientadmin` — points for a specific student

### GET /points/:id
**Roles:** `superadmin`, `clientadmin` — single points record

### PATCH /points/:id
**Roles:** `superadmin`, `clientadmin`

### DELETE /points/:id
**Roles:** `superadmin`, `clientadmin`

---

## Seeded Plans

| id | Name | Monthly | Yearly | Best Pick |
|----|------|---------|--------|-----------|
| 5 | Sprout | Free (30 Days) | Free (30 Days) | No |
| 6 | Bloom | ₹499 | ₹4,999 | No |
| 7 | Thrive | ₹1,299 | ₹12,999 | **Yes** |
| 8 | Evolve | ₹2,999 | ₹29,999 | No |
