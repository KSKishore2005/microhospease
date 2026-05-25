-- Schema fixes that run on every startup (idempotent).
-- Required because spring.jpa.hibernate.ddl-auto=update never SHRINKS or
-- WIDENS existing columns once Hibernate has auto-created them. When the
-- UserRole enum was expanded (e.g. RESTAURANT_SERVICE_STAFF = 24 chars),
-- the existing staff.role column stayed at its original tight VARCHAR(11)
-- and MySQL threw "Data truncated for column 'role' at row 1" on insert.
--
-- These statements widen the column to match the entity's @Column(length=40)
-- without losing any data.

ALTER TABLE staff MODIFY COLUMN role VARCHAR(40);
ALTER TABLE staff MODIFY COLUMN status VARCHAR(32);
ALTER TABLE staff MODIFY COLUMN department VARCHAR(100);
