# HospEase — End-to-End Test Report

**Date:** 2026-05-25
**Scope:** Full-stack regression after the staff/shift/role-system bug-fix cycle.
**Status:** ✅ All backend services start cleanly. ✅ DB schema corrected. ✅ Frontend role-comparison bugs eliminated.

This document doubles as (a) a record of what was fixed, and (b) a repeatable manual test plan you can run before any release.

---

## Table of Contents

1. [System Topology](#1-system-topology)
2. [Pre-flight Setup](#2-pre-flight-setup)
3. [Bug Fix Log (This Session)](#3-bug-fix-log-this-session)
4. [End-to-End Test Scenarios](#4-end-to-end-test-scenarios)
5. [Backend API Test Matrix](#5-backend-api-test-matrix)
6. [Known Issues / Wishlist](#6-known-issues--wishlist)
7. [10-Minute Smoke Test](#7-10-minute-smoke-test)

---

## 1. System Topology

| Service | Port | DB | Notes |
|---|---|---|---|
| service-registry (Eureka) | 8761 | — | Discovery server, start FIRST |
| config-server | 8888 | — | Central config; start SECOND |
| api-gateway | 8765 | — | Reactive Spring Cloud Gateway; JWT filter |
| user-service | 8084 | `user_db` | Auth, users, audit logs |
| guest-reservation-service | 8083 | `guest_db` | Guests + reservations |
| room-housekeeping-service | 8082 | `room_db` | Rooms, housekeeping tasks, **staff, shifts** |
| service-order-service | 8085 | `service_db` | Room-service / F&B / spa orders |
| finance-service | 8086 | `finance_db` | Invoices + payments |
| reporting-service | 8088 | `reporting_db` | Reports, KPIs, audit packages |
| frontend (Vite) | 3000 | — | React + TS; proxies `/api` → :8765 |

**Startup order:** `service-registry` → `config-server` → all backend services (any order) → `frontend`.
**Wait condition:** before starting frontend, verify <http://localhost:8761> shows all 7 services registered.

---

## 2. Pre-flight Setup

### 2.1 MySQL — One-time schema-cleanup

Run **once** before the first test run after pulling the latest code:

```sql
-- Fix the legacy enum value that breaks GET /api/staff
USE room_db;
UPDATE staff SET role = 'HOUSEKEEPING_STAFF' WHERE role = 'HOUSEKEEPER';

-- (Optional) Delete leftover seed rows with NULL names
DELETE FROM staff WHERE name IS NULL;

-- Verify
SELECT staff_id, name, role, user_id FROM staff;
-- All `role` values must be one of:
-- GUEST, FRONT_DESK_STAFF, HOUSEKEEPING_STAFF, RESTAURANT_SERVICE_STAFF,
-- FINANCE_OFFICER, MANAGER, ADMINISTRATOR, AUDITOR, STAFF
```

> **Why:** the old `UserRole` enum had a `HOUSEKEEPER` value that was renamed to `HOUSEKEEPING_STAFF`. Any legacy row with the old name throws `IllegalArgumentException` during `Hibernate` deserialisation, which 500s the entire `GET /api/staff` list (and silently empties the Staff Directory).

### 2.2 Seed accounts for testing

Each role needs an account. Suggested credentials:

| Role | Email | Password |
|---|---|---|
| ADMINISTRATOR | admin@hospease.com | admin123 |
| MANAGER | manager@hospease.com | manager123 |
| FRONT_DESK_STAFF | frontdesk@hospease.com | front123 |
| HOUSEKEEPING_STAFF | housekeeping@hospease.com | house123 |
| RESTAURANT_SERVICE_STAFF | service@hospease.com | service123 |
| FINANCE_OFFICER | finance@hospease.com | finance123 |
| AUDITOR | auditor@hospease.com | audit123 |
| GUEST | guest@hospease.com | guest123 |

> Register via **`/register`** (everyone gets `GUEST` by default), then upgrade roles via **Admin → User & Role Management**.

---

## 3. Bug Fix Log (This Session)

| # | Severity | File(s) | Symptom | Root Cause | Fix |
|---|---|---|---|---|---|
| 1 | High | `InvoiceService.java` | Invoice auto-flips to `OVERDUE` the day after checkout, even if paid | Status recalc keyed on `checkOutDate`, not `dueDate` | Removed checkout-date branch; only `dueDate` triggers OVERDUE |
| 2 | Med | `PaymentService.java` | After refunding a partial payment, invoice became `REFUNDED` (blocked overdue flow & showed `balanceDue=0`) | Hard-set to `REFUNDED` instead of recalculating | Now sets `UNPAID` when remaining payments < total |
| 3 | Med | `frontend/api/reporting.ts` | "Download Report" button did nothing | `reportsApi` had no `download(id)` method | Added `download(id)` returning a `Blob` |
| 4 | **High** | `StaffScheduling.tsx` | Staff creation 400'd; directory was always empty | Default role `'SERVICE_STAFF'` not in backend `UserRole` enum | Default → `'RESTAURANT_SERVICE_STAFF'`; free-text input replaced with `<select>` of valid enums |
| 5 | High | `StaffScheduling.tsx` | Department auto-fill broken when linking a user | Compared `selectedUser.role` against **frontend** role names but the API returns **backend** roles | Rewrote `handleUserSelect` to use backend role names |
| 6 | Med | `ManagerDashboard.tsx` | Assign-staff dropdown excluded valid staff | `serviceStaff` filter included nonexistent frontend roles `'SERVICE_STAFF'`, `'HOUSEKEEPING'` | Trimmed to backend roles only |
| 7 | Med | `AdminDashboard.tsx` | Role distribution chart showed all bars in default grey | `roleColors` map keyed on frontend role names but chart data is backend roles | Re-keyed map to backend roles; fixed `replace('_',' ')` → `replace(/_/g,' ')` |
| 8 | Low | `TaskList.tsx` / `RoomStatus.tsx` | Staff dropdowns occasionally missed valid housekeepers | Filter checked `role === 'HOUSEKEEPING'` (frontend value) on data from `usersApi.getAll()` (backend values) | Removed the bogus comparison |
| 9 | **High** | `staff.role` MySQL column | `Data truncated for column 'role'` on insert | Hibernate auto-sized the column to `VARCHAR(11)` for the old short-enum and `ddl-auto=update` never widens | Added `schema.sql` with idempotent `ALTER TABLE staff MODIFY COLUMN role VARCHAR(40)` (plus status/department) |
| 10 | High | `application.properties` | After enabling `spring.sql.init.mode=always`, startup failed on `Duplicate entry '101'` for the room seed | Spring re-ran `data.sql` (which had `INSERT INTO rooms ...`) every boot | Changed `data.sql` to `INSERT IGNORE INTO rooms ...` |
| 11 | High | `staff` table data | GET `/api/staff` silently returned 500 → directory empty → confusing UX | Legacy row had `role='HOUSEKEEPER'`, an obsolete enum value | One-line `UPDATE` to `HOUSEKEEPING_STAFF` |
| 12 | **High** | `GuestService.upsertByEmail` | "Could not set up your guest profile — null id in Guest entry (don't flush the Session after an exception occurs)" when clicking Book a Room | Class-level `@Transactional` overrode the method's intended non-transactional design. A failed `save()` poisoned the Hibernate session, the retry-read in the same transaction triggered the cryptic Hibernate internal error | Added `@Transactional(propagation = NOT_SUPPORTED)` to suspend the outer transaction; each repo call now runs in its own implicit transaction. Widened the `catch` to handle any exception (not just `DataIntegrityViolationException`) and surface the underlying cause in the error message |
| 13 | Med | `AuthController.logout` | 500 with `MissingRequestHeaderException: Required request header 'Authorization' is not present` after a 401-clear-token redirect | `@RequestHeader("Authorization")` was required | Made the header optional and treat absence as a no-op success. Returns 204 |
| 14 | Med | `StaffController.createStaff` | 500 + raw SQL error when linking a `userId` that's already taken by another staff profile | `DataIntegrityViolationException` from the unique constraint propagated unwrapped | Wrapped `staffService.createStaff` in a try/catch; throws `BadRequestException` with the clean message *"User X is already linked to another staff profile."* (mapped to 400 by the global handler) |
| 15 | Low | `StaffScheduling.tsx` Add Shift modal | Dropdown listed `INACTIVE` staff too | `{staff.map(...)}` used the full list | Switched to `{activeStaff.map(...)}` and added a fallback label for rows with `NULL` names |
| 16 | **High** | `guests.phone` MySQL column | Guest profile upsert failed with `"Column 'phone' cannot be null"` → "Could not set up your guest profile" on Book a Room | Java entity allowed `phone=null` but DB column was created with `NOT NULL` constraint (likely from a legacy schema version). `ddl-auto=update` never relaxes constraints | Added `schema.sql` for `guest-reservation-service` with idempotent `ALTER TABLE guests MODIFY COLUMN phone VARCHAR(20) NULL` (plus the other optional columns for safety). Enabled `spring.sql.init.mode=always` + `defer-datasource-initialization=true` |

---

## 4. End-to-End Test Scenarios

Each scenario uses the format **Action → Expected Result**. Tick the box once verified.

### 4.1 Authentication

- [ ] **Register a new guest** at `/register` → redirected to `/guest`; loyalty tier visible.
- [ ] **Log out** → redirected to `/login`; localStorage `hospease-auth` cleared.
- [ ] **Login with wrong password** → red error "Invalid email or password.".
- [ ] **Login with backend down** → red error "Cannot reach the server…".
- [ ] **Manually expire token** (DevTools → Application → Local Storage → clear value of `state.token`) → next API call 401 → auto-redirect to `/login`.

### 4.2 Guest Flow

Login as **guest@hospease.com**.

- [ ] **Dashboard** loads with welcome banner, loyalty badge, stats.
- [ ] **Book a room**: pick a date range and room type → reservation appears with status `CONFIRMED` (or `PENDING_APPROVAL` depending on flow).
- [ ] **Service request**: while reservation is `CHECKED_IN`, submit a `ROOM_SERVICE` request → appears in "Active Service Requests" with status "Pending Front Desk".
- [ ] **Invoices** page: outstanding balance equals room rate × nights + 12 % tax.
- [ ] **Pay invoice**: pick credit card → success modal → invoice now `PAID`, balance due `$0`.
- [ ] **Loyalty Points** page renders without errors.

### 4.3 Front Desk Flow

Login as **frontdesk@hospease.com**.

- [ ] **Dashboard** shows today's arrivals/departures, in-house count, occupancy %.
- [ ] **Reservation Management**: see all reservations. Filter by status.
- [ ] **Check-in** a `CONFIRMED` reservation → status flips to `CHECKED_IN`; room status flips to `OCCUPIED`.
- [ ] **Check-out** a `CHECKED_IN` reservation → status `CHECKED_OUT`; an invoice is generated automatically.
- [ ] **Forward a pending service request** to Manager → status moves to "Forwarded to Manager".
- [ ] **Close a verified service request** → status `COMPLETED`.
- [ ] **Guest Communications** page renders; no 500s.

### 4.4 Housekeeping Flow

Login as **housekeeping@hospease.com**.

- [ ] **Dashboard** shows only the tasks assigned to this user (strict role-based filter — bug #8 verification).
- [ ] **Task List** "Mine" tab shows assigned tasks; "All" tab disabled for non-manager.
- [ ] **Start a PENDING task** → status `IN_PROGRESS`.
- [ ] **Mark room status** "Dirty"/"Cleaning"/"Clean"/"Ready" via the Room Status board → status persists across refresh.
- [ ] **Complete a task** → status `COMPLETED`; counter on dashboard increments.

### 4.5 Restaurant / Service-Staff Flow

Login as **service@hospease.com**.

- [ ] **F&B Orders** Kanban renders 4 columns: PENDING / IN_PROGRESS / CONFIRMED / COMPLETED.
- [ ] **Service Dashboard** shows orders assigned to this user only.
- [ ] **Create a walk-in order** → appears in PENDING column.
- [ ] **Advance order** PENDING → IN_PROGRESS → COMPLETED.
- [ ] **Price field hidden** for service staff (bug #4 sanity check — frontend role `'SERVICE_STAFF'` correctly identifies this user).
- [ ] **Spa & Gym Bookings** page renders.

### 4.6 Finance Flow

Login as **finance@hospease.com**.

- [ ] **Invoices & Payments** page lists invoices.
- [ ] **Record a partial payment** on an UNPAID invoice → invoice stays `UNPAID`, balance reflects payment.
- [ ] **Record the remaining amount** → invoice flips to `PAID`.
- [ ] **Refund a partial payment** → invoice status returns to `UNPAID` (bug #2 verification — must NOT become `REFUNDED`).
- [ ] **Wait past `dueDate`** (or set dueDate to yesterday via SQL) → invoice flips to `OVERDUE` on next read (bug #1 verification: it should NOT flip based on `checkOutDate`).

### 4.7 Manager Flow

Login as **manager@hospease.com**. This is the highest-risk flow given the bug count.

- [ ] **Manager Dashboard** loads. Stats show real numbers (no `NaN`, no `—`).
- [ ] **Active Service Requests** card lists open requests.
- [ ] **Assign-staff dropdown** lists FRONT_DESK, HOUSEKEEPING_STAFF, and RESTAURANT_SERVICE_STAFF users (bug #6 verification).
- [ ] **Assign** a request → moves to "Assigned: <staff name>".
- [ ] **Verify** a STAFF_COMPLETED request → "Verified (Awaiting Closure)".
- [ ] **Staff Scheduling → Directory** tab lists all staff (bug #11 verification — should not be empty).
- [ ] **Create Staff** modal — role dropdown shows 8 valid options (bug #4 verification).
- [ ] **Create Staff linked to a user** that's already linked → currently 500s (see [Known Issue #2](#6-known-issues--wishlist)). Workaround: pick a user without an existing staff profile.
- [ ] **Create Staff not linked** → row appears in Directory immediately.
- [ ] **Staff Scheduling → Weekly View**: Add Shift modal's "Staff Member" dropdown is **populated** (bug #11 verification).
- [ ] **Save a MORNING shift** → appears on the grid in amber.
- [ ] **Save an AFTERNOON shift** on the same staff/day → grid shows correct color.
- [ ] **Save a NIGHT shift** → spans midnight; backend stores end at next-day 07:00.
- [ ] **Overlap detection**: try to save a second MORNING shift on the same staff/day → backend 400 with "already has an overlapping shift".
- [ ] **Performance Monitoring** page renders KPI charts.
- [ ] **Occupancy Reports** page renders.

### 4.8 Admin Flow

Login as **admin@hospease.com**.

- [ ] **Admin Dashboard** stats load: total users, active users, total rooms, audit events.
- [ ] **Role distribution bar chart** shows colored bars per role (bug #7 verification — not all grey).
- [ ] **Service Health** card: all 4 services show "Online".
- [ ] **User & Role Management → All Users** lists every user; role labels are human-friendly ("Front Desk Staff", not `FRONT_DESK_STAFF`).
- [ ] **Permission Matrix** tab renders without overflow.
- [ ] **Create User** with each role → succeeds and appears in table.
- [ ] **Edit User**: change role → "Save Changes" → row updates immediately.
- [ ] **Delete User**: confirms; row disappears.
- [ ] **Audit Package** page renders the package list.
- [ ] **Property Configuration** page renders.

### 4.9 Reporting / Auditor Flow

Login as **auditor@hospease.com**.

- [ ] **Reporting Dashboard** loads with KPI trend + Revenue chart.
- [ ] **KPIs** page lists all KPI definitions with progress bars.
- [ ] **Calculate Occupancy** button on a KPI → currentValue updates.
- [ ] **Calculate Revenue** button → currentValue updates.
- [ ] **Scheduled Reports** page renders; create a new one.
- [ ] **Compliance Exports** page renders.
- [ ] **Download Report** button on a generated report → triggers a Blob download (bug #3 verification).
- [ ] **Audit Package** generation → row appears, downloadable.

---

## 5. Backend API Test Matrix

Run from your terminal with `curl` or Postman against the **API Gateway** (`http://localhost:8765`). All protected routes require `Authorization: Bearer <jwt>`.

### user-service

| Method | Path | Roles Allowed | Expected |
|---|---|---|---|
| POST | `/api/auth/register` | public | 200 + JWT |
| POST | `/api/auth/login` | public | 200 + JWT |
| POST | `/api/auth/logout` | any | 204 (currently 500 on missing Authorization — see Known Issue #1) |
| GET | `/api/users` | MANAGER, ADMIN, AUDITOR, FINANCE | 200 + list |
| GET | `/api/users/roles` | any | 200 + array of enum strings |
| POST | `/api/users` | ADMIN | 201 |
| PUT | `/api/users/{id}` | ADMIN, MANAGER | 200 |
| DELETE | `/api/users/{id}` | ADMIN | 204 |
| GET | `/api/audit-logs` | ADMIN, AUDITOR | 200 + list |

### guest-reservation-service

| Method | Path | Roles | Expected |
|---|---|---|---|
| GET | `/api/v1/guests/{id}` | GUEST (own), FRONT_DESK, MANAGER, ADMIN | 200 |
| POST | `/api/v1/guests` | GUEST, FRONT_DESK | 201 |
| GET | `/api/v1/reservations` | FRONT_DESK, MANAGER, ADMIN, AUDITOR | 200 |
| POST | `/api/v1/reservations` | GUEST, FRONT_DESK | 201 |
| PATCH | `/api/v1/reservations/{id}/check-in` | FRONT_DESK, MANAGER | 200 |
| PATCH | `/api/v1/reservations/{id}/check-out` | FRONT_DESK, MANAGER | 200 + invoice generated |

### room-housekeeping-service

| Method | Path | Roles | Expected |
|---|---|---|---|
| GET | `/api/rooms` | any auth | 200 |
| PATCH | `/api/rooms/{id}/status` | FRONT_DESK, HOUSEKEEPING, MANAGER | 200 |
| GET | `/api/staff` | MANAGER, ADMIN, AUDITOR | 200 (bug #11) |
| POST | `/api/staff` | ADMIN, MANAGER | 201; 409 if user_id already linked (currently 500 — Known Issue #2) |
| GET | `/api/shifts` | MANAGER, ADMIN, AUDITOR, HOUSEKEEPING, FRONT_DESK | 200 |
| POST | `/api/shifts` | MANAGER, ADMIN | 201; 400 on overlap |
| GET | `/api/housekeeping-tasks` | HOUSEKEEPING, MANAGER, ADMIN | 200 |

### service-order-service

| Method | Path | Roles | Expected |
|---|---|---|---|
| GET | `/api/service-orders` | most roles | 200 |
| POST | `/api/service-orders` | GUEST, FRONT_DESK, SERVICE, MANAGER | 201 |
| PATCH | `/api/service-orders/{id}/assign?userId=` | service staff, MANAGER | 200 |
| PATCH | `/api/service-orders/{id}/accept?userId=` | service staff, MANAGER | 200; PENDING → IN_PROGRESS |
| PATCH | `/api/service-orders/{id}/status?status=` | FRONT_DESK, SERVICE, MANAGER | 200 |

### finance-service

| Method | Path | Roles | Expected |
|---|---|---|---|
| GET | `/api/invoices` | FINANCE, MANAGER, ADMIN, AUDITOR | 200 |
| POST | `/api/invoices` | FINANCE, FRONT_DESK | 201 |
| GET | `/api/payments?invoiceId=` | FINANCE, MANAGER | 200 |
| POST | `/api/payments?invoiceId={id}&guestId={gid}` | FINANCE, FRONT_DESK, GUEST | 201; auto-flips invoice to PAID when total reached (bug #1, #2) |
| POST | `/api/payments/{id}/refund` | FINANCE | 200; invoice → UNPAID if remaining < total (bug #2) |

### reporting-service

| Method | Path | Roles | Expected |
|---|---|---|---|
| GET | `/api/reports` | AUDITOR, MANAGER, ADMIN | 200 |
| POST | `/api/reports` | AUDITOR, MANAGER | 201; rate-limited 5/10s |
| GET | `/api/reports/{id}/download` | AUDITOR, MANAGER | 200 PDF blob (bug #3) |
| GET | `/api/kpis` | AUDITOR, MANAGER, ADMIN | 200 |
| POST | `/api/kpis/{id}/calculate-occupancy` | AUDITOR, MANAGER | 200; circuit-broken via Resilience4j |
| GET | `/api/audit-packages` | AUDITOR, ADMIN | 200 |

---

## 6. Known Issues / Wishlist

### ✅ Issue #1 — `POST /api/auth/logout` returns 500 when token already cleared — **FIXED (Bug #13)**

### ✅ Issue #2 — `POST /api/staff` returns 500 when `user_id` is already linked — **FIXED (Bug #14)**

### 🟡 Issue #3 — 4 legacy `staff` rows have `name = NULL`

**Symptom:** Directory shows blank-name rows. They work for shift assignment but look ugly.

**Fix:** `DELETE FROM staff WHERE name IS NULL;` (only run if you don't care about test data).

### ✅ Issue #4 — Shift dropdown allowed shifts on `INACTIVE` staff — **FIXED (Bug #15)**

### 🟢 Issue #5 — `STAFF` backend role has no `ROLE_MAP` entry

**Symptom:** A user with backend role `STAFF` gets mapped to frontend role `'GUEST'` (the default fallback), which routes them to the Guest panel.

**Fix idea:** Either delete `STAFF` from the `UserRole` enum, or add a frontend mapping (e.g., `STAFF: 'STAFF'`) with a corresponding default route.

---

## 7. 10-Minute Smoke Test

After any code change, run this rapid sanity-check before doing a full E2E:

1. **Start all services** in the order in §1. Wait for all 7 to be `UP` on <http://localhost:8761>. *(2 min)*
2. **Login as admin** at `/login` → Admin Dashboard. ✓ Stats load, role distribution chart shows colored bars. *(1 min)*
3. **Login as manager** → Manager Dashboard. ✓ Stats load. → Staff Scheduling → Directory shows ≥1 staff. → Weekly View shows the staff dropdown populated. *(2 min)*
4. **Login as guest** → Book a room → ✓ reservation appears as CONFIRMED. *(2 min)*
5. **Login as frontdesk** → ✓ See the booking → Check-in → ✓ room goes OCCUPIED → Check-out → ✓ invoice generated. *(2 min)*
6. **Login as finance** → ✓ See the invoice → record full payment → ✓ invoice flips to PAID. *(1 min)*

If any step fails, the corresponding service/bug area is the first place to check. Look at the `room-housekeeping-service` or `finance-service` console logs for a stack trace.

---

## Appendix A — Critical Project Notes

### Frontend vs Backend Roles

This is the single source of the most common bug class in this codebase. See [`memory/project_role_system.md`](C:\Users\2484903\.claude\projects\C--Users-2484903-OneDrive---Cognizant-Desktop-Reporting-service-test-\memory\project_role_system.md).

- `user.role` from **`useAuthStore`** = **frontend** role (`ADMIN`, `HOUSEKEEPING`, `SERVICE_STAFF`, …)
- `u.role` from **`usersApi.getAll()`** = **backend** role (`ADMINISTRATOR`, `HOUSEKEEPING_STAFF`, `RESTAURANT_SERVICE_STAFF`, …)
- Any field sent to `POST /api/staff` or `POST /api/users` must use **backend** role names.

### `ddl-auto=update` will never widen existing columns

If you ever add a longer enum value, you also have to add the corresponding `ALTER TABLE … MODIFY COLUMN` to `schema.sql`. This is why `staff.role` had to be explicitly widened to `VARCHAR(40)`.

### `INSERT IGNORE` in `data.sql`

Because `spring.sql.init.mode=always` re-runs `data.sql` on every boot, all inserts there must be idempotent. Use `INSERT IGNORE` or `INSERT … ON DUPLICATE KEY UPDATE`.

---

## Appendix B — Verification Cheat-Sheet

| Bug | Quick verification command |
|---|---|
| #1 OVERDUE date | `SELECT invoice_id, status, due_date, check_out_date FROM finance_db.invoices WHERE due_date >= CURDATE();` should NOT have `status='OVERDUE'` unless `due_date < CURDATE()`. |
| #2 Refund flow | `SELECT i.status, SUM(p.amount) FROM finance_db.invoices i JOIN finance_db.payments p ON i.invoice_id=p.invoice_id WHERE p.status='SUCCESS' GROUP BY i.invoice_id;` — `UNPAID` invoices' SUM should be < `total_amount`. |
| #3 Report download | DevTools → Network → click "Download" on a report → request shows `responseType: blob`, response is `application/pdf`. |
| #4 Staff role | `SELECT DISTINCT role FROM room_db.staff;` — only values in the current UserRole enum. |
| #9 Column width | `SHOW COLUMNS FROM room_db.staff LIKE 'role';` — must show `varchar(40)`. |
| #11 Legacy enum | `SELECT COUNT(*) FROM room_db.staff WHERE role='HOUSEKEEPER';` — must be 0. |
