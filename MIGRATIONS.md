# Database Migration — required after enum widening

This file lists the **one-time** SQL statements you must run against each
microservice's MySQL database so the enum columns that were widened in the
Java entities can accept the new values that were added.

The error you saw (`Data truncated for column 'status'`) is MySQL telling you
that the existing column is too narrow (or is an `ENUM()` type with a fixed
value list) and cannot hold the new enum constant the application is trying to
insert. Hibernate's `ddl-auto: update` only ADDS columns, never alters existing
column widths, so the entity annotations alone do not fix tables that were
created on an older schema.

## Option A — Quick & destructive (DEV ONLY)

If you don't care about existing data, drop the affected databases and let
Hibernate recreate them with the new column definitions on next service start.

```sql
-- MySQL CLI / Workbench
DROP DATABASE IF EXISTS guest_reservation_db;
DROP DATABASE IF EXISTS room_db;
DROP DATABASE IF EXISTS services_db;
DROP DATABASE IF EXISTS finance_db;
DROP DATABASE IF EXISTS reporting_db;
DROP DATABASE IF EXISTS user_db2;
-- (do NOT drop user_db2 if you want demo logins to keep working;
--  you can keep that one and only widen its users.role/status columns
--  using Option B below)
```

Then start each backend service and Hibernate will recreate all tables.

## Option B — Safe migration (KEEPS existing data)

Run each block against the database for its service.

### `guest_reservation_db` (guest-reservation-service)

```sql
USE guest_reservation_db;

-- Reservation.status — was sized for {CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED}.
-- Now must also accept PENDING.
ALTER TABLE reservations
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

-- Guest.* — defensive widen on the status/loyaltyTier columns in case they
-- were created as enum() types.
ALTER TABLE guests
    MODIFY COLUMN status VARCHAR(32) NOT NULL,
    MODIFY COLUMN loyalty_tier VARCHAR(50);
```

### `room_db` (room-housekeeping-service)

```sql
USE room_db;

-- Room.status — added CLEANING
ALTER TABLE rooms
    MODIFY COLUMN status VARCHAR(32) NOT NULL,
    MODIFY COLUMN type VARCHAR(32) NOT NULL;

-- HousekeepingTask.status — added CANCELLED
ALTER TABLE housekeeping_tasks
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

-- Staff.role — CRITICAL: enum changed from {ADMIN, MANAGER, STAFF, HOUSEKEEPER}
-- (max 11 chars) to the full real role taxonomy. RESTAURANT_SERVICE_STAFF is 25
-- chars and won't fit a varchar(11) column. This is the most common breakage.
ALTER TABLE staff
    MODIFY COLUMN role VARCHAR(40),
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

-- Shift.status — added safe headroom for future values.
ALTER TABLE shifts
    MODIFY COLUMN status VARCHAR(32) NOT NULL;
```

### `services_db` (service-order-service)

```sql
USE services_db;

-- ServiceOrder.serviceType — added RESTAURANT, ROOM_SERVICE, MAINTENANCE,
-- CONCIERGE, HOUSEKEEPING, TRANSPORT
-- ServiceOrder.status — added CONFIRMED
ALTER TABLE service_orders
    MODIFY COLUMN service_type VARCHAR(32) NOT NULL,
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

-- (assignedToUserId column is new; ddl-auto: update will add it automatically
--  on next start. If it doesn't, run:
--     ALTER TABLE service_orders ADD COLUMN assigned_to_user_id BIGINT;
-- )
```

### `finance_db` (finance-service)

```sql
USE finance_db;

-- Payment.method — enum changed from {CASH, CARD, ONLINE} to
-- {CREDIT_CARD, DEBIT_CARD, CASH, BANK_TRANSFER, UPI, WALLET}.
-- BANK_TRANSFER (13 chars) won't fit a varchar(6) column.
ALTER TABLE payments
    MODIFY COLUMN method VARCHAR(32) NOT NULL,
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

ALTER TABLE invoices
    MODIFY COLUMN status VARCHAR(32) NOT NULL;
```

### `reporting_db` (reporting-service)

```sql
USE reporting_db;

-- Report.scope — added OPERATIONAL, FINANCIAL, REVENUE
ALTER TABLE reports
    MODIFY COLUMN scope VARCHAR(32);

-- KPI.version — new optimistic-locking column. ddl-auto: update should add it
-- automatically; if it doesn't, run:
--    ALTER TABLE kpis ADD COLUMN version BIGINT DEFAULT 0;
```

### `user_db2` (user-service)

```sql
USE user_db2;

-- User.role / User.status — widen defensively
ALTER TABLE users
    MODIFY COLUMN role VARCHAR(40) NOT NULL,
    MODIFY COLUMN status VARCHAR(32) NOT NULL;
```

## After running migrations

1. Restart **all** affected backend services so they pick up the schema changes.
2. The booking flow that previously failed with "Data truncated" should now save
   the `PENDING` status without error.
3. If a service refuses to start because the schema is inconsistent (e.g. it
   thinks a column should be NOT NULL but the existing rows have NULL), drop
   that one table and let Hibernate recreate it — your demo data is the only
   thing you'll lose for that table.

## How to avoid this in production

`ddl-auto: update` is **not** a production migration tool. For production
deployments use [Flyway](https://flywaydb.org) or [Liquibase](https://liquibase.org)
to version your schema. Each enum widening would then be a checked-in migration
file with its own ALTER, applied automatically and idempotently at startup.
