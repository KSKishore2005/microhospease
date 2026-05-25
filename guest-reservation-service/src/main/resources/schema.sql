-- Schema fixes that run on every startup (idempotent).
-- Required because spring.jpa.hibernate.ddl-auto=update never relaxes existing
-- column constraints. The Guest entity declares phone as nullable
-- (@Column without nullable=false), but a legacy boot left the DB column as
-- NOT NULL, which 500s every guest upsert with:
--   "Column 'phone' cannot be null"
-- These statements widen / relax columns to match the entity. They are
-- idempotent: MODIFY COLUMN on an already-correct column is a no-op.

ALTER TABLE guests MODIFY COLUMN phone        VARCHAR(20)  NULL;
ALTER TABLE guests MODIFY COLUMN dob          DATE         NULL;
ALTER TABLE guests MODIFY COLUMN address_line1 VARCHAR(200) NULL;
ALTER TABLE guests MODIFY COLUMN address_line2 VARCHAR(200) NULL;
ALTER TABLE guests MODIFY COLUMN city         VARCHAR(100) NULL;
ALTER TABLE guests MODIFY COLUMN postal_code  VARCHAR(10)  NULL;
ALTER TABLE guests MODIFY COLUMN country      VARCHAR(100) NULL;
