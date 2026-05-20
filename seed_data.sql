-- ================================================================
-- HOSPEASE COMPLETE DATABASE SEED DATA
-- Run this file in MySQL as root user
-- mysql -u root -p < seed_data.sql
--
-- LOGIN CREDENTIALS AFTER SEEDING:
--   admin@hospease.com       / Admin@123        (Administrator)
--   manager@hospease.com     / Manager@123      (Manager)
--   frontdesk@hospease.com   / Staff@123        (Front Desk Staff)
--   housekeeping@hospease.com/ Staff@123        (Housekeeping Staff)
--   service@hospease.com     / Staff@123        (Restaurant Service Staff)
--   finance@hospease.com     / Staff@123        (Finance Officer)
--   auditor@hospease.com     / Staff@123        (Auditor)
--   guest@hospease.com       / Guest@123        (Guest - James Wilson)
--   guest2@hospease.com      / Guest@123        (Guest - Emily Chen)
--
-- NOTE: BCrypt hashes use $2b$ prefix (bcryptjs).
--       Spring Security 5+ accepts both $2a$ and $2b$ prefixes.
-- ================================================================


-- ================================================================
-- DATABASE 1: user_db2
-- ================================================================
USE user_db2;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (name, role, email, phone, password_hash, mfa_enabled, status, created_at, updated_at) VALUES
('Admin User',           'ADMINISTRATOR',             'admin@hospease.com',         '+1-555-000-0001', '$2b$10$ofSqnXhK.KDGvKHpEjj.ne7lhbiRmyTF4mdNkvnx2FdsrPoLPfdsG', 0, 'ACTIVE', NOW(), NOW()),
('John Manager',         'MANAGER',                   'manager@hospease.com',       '+1-555-000-0002', '$2b$10$4Mgq5/5khpfrVM2s0YAQHeUx1Nd0jhTO/62MpXVkzL8tIpI4JrvNK', 0, 'ACTIVE', NOW(), NOW()),
('Sarah Front',          'FRONT_DESK_STAFF',          'frontdesk@hospease.com',     '+1-555-000-0003', '$2b$10$o13rwanjNzWXhLrnQDY/teDcnGj31D/vmBl6C8zUfBUWZi5cC0UDm', 0, 'ACTIVE', NOW(), NOW()),
('Mike Cleaning',        'HOUSEKEEPING_STAFF',        'housekeeping@hospease.com',  '+1-555-000-0004', '$2b$10$o13rwanjNzWXhLrnQDY/teDcnGj31D/vmBl6C8zUfBUWZi5cC0UDm', 0, 'ACTIVE', NOW(), NOW()),
('Chef Carlos',          'RESTAURANT_SERVICE_STAFF',  'service@hospease.com',       '+1-555-000-0005', '$2b$10$o13rwanjNzWXhLrnQDY/teDcnGj31D/vmBl6C8zUfBUWZi5cC0UDm', 0, 'ACTIVE', NOW(), NOW()),
('Lisa Finance',         'FINANCE_OFFICER',           'finance@hospease.com',       '+1-555-000-0006', '$2b$10$o13rwanjNzWXhLrnQDY/teDcnGj31D/vmBl6C8zUfBUWZi5cC0UDm', 0, 'ACTIVE', NOW(), NOW()),
('Tom Auditor',          'AUDITOR',                   'auditor@hospease.com',       '+1-555-000-0007', '$2b$10$o13rwanjNzWXhLrnQDY/teDcnGj31D/vmBl6C8zUfBUWZi5cC0UDm', 0, 'ACTIVE', NOW(), NOW()),
('James Wilson',         'GUEST',                     'guest@hospease.com',         '+1-555-100-0001', '$2b$10$VxuAwksmpKulCkdzF1QhF.ijZuFPWrfFuWQWRE82.gOh7h/B2Av.6', 0, 'ACTIVE', NOW(), NOW()),
('Emily Chen',           'GUEST',                     'guest2@hospease.com',        '+1-555-100-0002', '$2b$10$VxuAwksmpKulCkdzF1QhF.ijZuFPWrfFuWQWRE82.gOh7h/B2Av.6', 0, 'ACTIVE', NOW(), NOW());
-- user_id: 1=admin, 2=manager, 3=frontdesk, 4=housekeeping, 5=service, 6=finance, 7=auditor, 8=guest, 9=guest2

INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details_json, timestamp) VALUES
(1, 'Admin User',    'LOGIN',       'USER', 1, '{"ip":"127.0.0.1","browser":"Chrome"}',               '2026-05-19 08:00:00'),
(1, 'Admin User',    'CREATE_USER', 'USER', 3, '{"createdEmail":"frontdesk@hospease.com"}',            '2026-05-19 08:05:00'),
(1, 'Admin User',    'CREATE_USER', 'USER', 4, '{"createdEmail":"housekeeping@hospease.com"}',         '2026-05-19 08:06:00'),
(1, 'Admin User',    'CREATE_USER', 'USER', 5, '{"createdEmail":"service@hospease.com"}',              '2026-05-19 08:07:00'),
(2, 'John Manager',  'LOGIN',       'USER', 2, '{"ip":"127.0.0.1","browser":"Firefox"}',              '2026-05-19 09:00:00'),
(2, 'John Manager',  'VIEW_REPORT', 'REPORT', 1, '{"reportType":"Monthly Occupancy Report"}',         '2026-05-19 09:15:00'),
(8, 'James Wilson',  'LOGIN',       'USER', 8, '{"ip":"192.168.1.50","browser":"Safari"}',            '2026-05-19 10:00:00'),
(8, 'James Wilson',  'BOOK_ROOM',   'RESERVATION', 1, '{"roomNumber":"202","checkIn":"2026-05-17"}',  '2026-05-10 09:00:00'),
(9, 'Emily Chen',    'LOGIN',       'USER', 9, '{"ip":"192.168.1.60","browser":"Chrome"}',            '2026-05-19 10:30:00'),
(9, 'Emily Chen',    'BOOK_ROOM',   'RESERVATION', 2, '{"roomNumber":"301","checkIn":"2026-05-25"}',  '2026-05-15 11:00:00');


-- ================================================================
-- DATABASE 2: room_db
-- ================================================================
USE room_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE housekeeping_tasks;
TRUNCATE TABLE shifts;
TRUNCATE TABLE staff;
TRUNCATE TABLE rooms;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO rooms (number, type, capacity, amenities_json, status, rate_per_night, created_at) VALUES
('101', 'SINGLE', 1, '["WiFi","TV","Air Conditioning","Safe"]',                                      'AVAILABLE',   120.00, NOW()),
('102', 'SINGLE', 1, '["WiFi","TV","Air Conditioning","Safe"]',                                      'AVAILABLE',   120.00, NOW()),
('201', 'DOUBLE', 2, '["WiFi","TV","Air Conditioning","Mini Bar","Safe"]',                            'AVAILABLE',   180.00, NOW()),
('202', 'DOUBLE', 2, '["WiFi","TV","Air Conditioning","Mini Bar","Safe"]',                            'OCCUPIED',    180.00, NOW()),
('301', 'SUITE',  4, '["WiFi","TV","Air Conditioning","Mini Bar","Jacuzzi","Balcony"]',               'AVAILABLE',   350.00, NOW()),
('302', 'SUITE',  4, '["WiFi","TV","Air Conditioning","Mini Bar","Jacuzzi","Balcony"]',               'MAINTENANCE', 350.00, NOW()),
('303', 'SUITE',  4, '["WiFi","TV","Air Conditioning","Jacuzzi","Sea View","Butler Service"]',        'AVAILABLE',   480.00, NOW());
-- room_id: 1=101, 2=102, 3=201, 4=202, 5=301, 6=302, 7=303

INSERT INTO staff (user_id, role, department, contact_info_json, status) VALUES
(3, 'STAFF',      'Front Desk',      '{"email":"frontdesk@hospease.com",   "phone":"+1-555-000-0003"}', 'ACTIVE'),
(4, 'HOUSEKEEPER','Housekeeping',    '{"email":"housekeeping@hospease.com","phone":"+1-555-000-0004"}', 'ACTIVE'),
(5, 'STAFF',      'Food & Beverage', '{"email":"service@hospease.com",     "phone":"+1-555-000-0005"}', 'ACTIVE'),
(6, 'STAFF',      'Finance',         '{"email":"finance@hospease.com",     "phone":"+1-555-000-0006"}', 'ACTIVE'),
(2, 'MANAGER',    'Management',      '{"email":"manager@hospease.com",     "phone":"+1-555-000-0002"}', 'ACTIVE');
-- staff_id: 1=frontdesk(userId=3), 2=housekeeping(userId=4), 3=service(userId=5), 4=finance(userId=6), 5=manager(userId=2)

-- assigned_to column = user_id from user_db2 (housekeeping user_id = 4)
INSERT INTO housekeeping_tasks (room_id, assigned_to, scheduled_at, completed_at, status) VALUES
(2,  4, '2026-05-19 09:00:00', NULL,                  'PENDING'),
(4,  4, '2026-05-18 10:00:00', '2026-05-18 11:30:00', 'COMPLETED'),
(6,  4, '2026-05-19 08:00:00', NULL,                  'IN_PROGRESS'),
(1,  4, '2026-05-19 14:00:00', NULL,                  'PENDING'),
(3,  4, '2026-05-20 09:00:00', NULL,                  'PENDING');

-- assigned_by column = user_id from user_db2 (manager user_id = 2)
INSERT INTO shifts (staff_id, start_at, end_at, assigned_by, status) VALUES
(1, '2026-05-18 08:00:00', '2026-05-18 16:00:00', 2, 'COMPLETED'),
(2, '2026-05-18 07:00:00', '2026-05-18 15:00:00', 2, 'COMPLETED'),
(3, '2026-05-18 10:00:00', '2026-05-18 22:00:00', 2, 'COMPLETED'),
(1, '2026-05-19 08:00:00', '2026-05-19 16:00:00', 2, 'SCHEDULED'),
(2, '2026-05-19 07:00:00', '2026-05-19 15:00:00', 2, 'SCHEDULED'),
(3, '2026-05-19 10:00:00', '2026-05-19 22:00:00', 2, 'SCHEDULED'),
(4, '2026-05-19 09:00:00', '2026-05-19 17:00:00', 2, 'SCHEDULED');


-- ================================================================
-- DATABASE 3: guest_reservation_db
-- ================================================================
USE guest_reservation_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reservations;
TRUNCATE TABLE guests;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO guests (name, email, phone, dob, loyalty_tier, status, address_line1, city, postal_code, country, created_at, updated_at) VALUES
('James Wilson',  'guest@hospease.com',  '+1-555-100-0001', '1988-03-15', 'GOLD',     'ACTIVE', '123 Maple Street',     'New York',    '10001', 'United States', NOW(), NOW()),
('Emily Chen',    'guest2@hospease.com', '+1-555-100-0002', '1995-07-22', 'SILVER',   'ACTIVE', '456 Oak Avenue',       'Los Angeles', '90001', 'United States', NOW(), NOW()),
('Robert Taylor', 'robert@email.com',    '+1-555-200-0003', '1975-11-08', 'STANDARD', 'ACTIVE', '789 Pine Boulevard',   'Chicago',     '60601', 'United States', NOW(), NOW());
-- guest_id: 1=James, 2=Emily, 3=Robert

-- room_id values reference room_db.rooms (no FK constraint across databases)
-- room_id 4=Room202, 5=Room301, 1=Room101
INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, status, special_requests, created_at, modified_at) VALUES
(1, 4, '2026-05-17', '2026-05-22', 'CHECKED_IN',  'Late checkout requested',  '2026-05-10 09:00:00', '2026-05-17 14:00:00'),
(2, 5, '2026-05-25', '2026-05-29', 'CONFIRMED',   'Non-smoking room',         '2026-05-15 11:00:00', '2026-05-15 11:00:00'),
(3, 1, '2026-05-14', '2026-05-17', 'CHECKED_OUT', '',                         '2026-05-12 10:00:00', '2026-05-17 12:00:00');
-- res_id: 1=James CHECKED_IN(Room 202), 2=Emily CONFIRMED(Room 301), 3=Robert CHECKED_OUT(Room 101)


-- ================================================================
-- DATABASE 4: services_db
-- ================================================================
USE services_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE service_orders;
SET FOREIGN_KEY_CHECKS = 1;

-- guest_id, reservation_id → guest_reservation_db; room_id → room_db
INSERT INTO service_orders (guest_id, reservation_id, room_id, service_type, description, price, status) VALUES
(1, 1, 4, 'SPA',                'Full body massage 60 min',           85.00, 'COMPLETED'),
(1, 1, 4, 'FOOD_AND_BEVERAGES', 'Room service dinner for two',        65.00, 'COMPLETED'),
(1, 1, 4, 'GYM',                'Personal training session 1 hr',    50.00, 'PENDING'),
(1, 1, 4, 'LAUNDRY',            'Express laundry — 6 items',         35.00, 'IN_PROGRESS'),
(2, 2, 5, 'LAUNDRY',            'Express laundry — 5 items',         30.00, 'PENDING'),
(2, 2, 5, 'SPA',                'Aromatherapy session 45 min',        70.00, 'PENDING'),
(3, 3, 1, 'FOOD_AND_BEVERAGES', 'Continental breakfast for 2',        40.00, 'COMPLETED');


-- ================================================================
-- DATABASE 5: finance_db
-- ================================================================
USE finance_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;
SET FOREIGN_KEY_CHECKS = 1;

-- guest_id, reservation_id → guest_reservation_db (cross-service references)
INSERT INTO invoices (guest_id, reservation_id, line_items_json, total_amount, currency, issued_at, due_date, status) VALUES
(3, 3,
 '[{"description":"Room 101 — 3 nights","quantity":3,"unitPrice":120.00,"total":360.00},{"description":"Room Service Breakfast","quantity":2,"unitPrice":20.00,"total":40.00}]',
 400.00, 'USD', '2026-05-17 12:00:00', '2026-05-24', 'PAID'),

(1, 1,
 '[{"description":"Room 202 — 5 nights","quantity":5,"unitPrice":180.00,"total":900.00},{"description":"Spa Massage","quantity":1,"unitPrice":85.00,"total":85.00},{"description":"Room Service Dinner","quantity":1,"unitPrice":65.00,"total":65.00}]',
 1050.00, 'USD', '2026-05-17 14:00:00', '2026-05-25', 'UNPAID'),

(2, 2,
 '[{"description":"Room 301 — 4 nights","quantity":4,"unitPrice":350.00,"total":1400.00}]',
 1400.00, 'USD', '2026-05-25 11:00:00', '2026-06-01', 'UNPAID');
-- invoice_id: 1=Robert(PAID), 2=James(UNPAID), 3=Emily(UNPAID)

-- invoice_id, guest_id → finance_db.invoices and guest_reservation_db.guests
INSERT INTO payments (invoice_id, guest_id, amount, method, paid_at, status) VALUES
(1, 3, 400.00, 'CARD', '2026-05-17 12:30:00', 'SUCCESS');


-- ================================================================
-- DATABASE 6: reporting_db
-- ================================================================
USE reporting_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reports;
TRUNCATE TABLE kpis;
TRUNCATE TABLE audit_packages;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO kpis (name, definition, target, current_value, reporting_period) VALUES
('Occupancy Rate',               'Percentage of occupied rooms out of total available rooms',                   85.00,  71.43, 'MAY-2026'),
('Average Daily Rate (ADR)',     'Average revenue earned per occupied room per day',                            250.00, 265.00, 'MAY-2026'),
('RevPAR',                       'Revenue Per Available Room — Occupancy Rate x ADR',                          212.50, 189.21, 'MAY-2026'),
('Guest Satisfaction Score',     'Average guest feedback rating on scale 1–10',                                 9.00,   8.60,  'MAY-2026'),
('Housekeeping Task Completion', 'Percentage of housekeeping tasks completed on schedule',                      95.00,  87.50, 'MAY-2026'),
('Average Length of Stay',       'Average number of nights per reservation',                                    3.50,   3.80,  'MAY-2026');

INSERT INTO audit_packages (period_start, period_end, contents_json, generated_at) VALUES
('2026-04-01', '2026-04-30', '{"invoiceCount":48,"paymentCount":45,"totalRevenue":68420.00,"refundCount":2,"reportCount":8}',  '2026-05-01 09:00:00'),
('2026-03-01', '2026-03-31', '{"invoiceCount":52,"paymentCount":50,"totalRevenue":72100.00,"refundCount":1,"reportCount":9}',  '2026-04-01 09:00:00'),
('2026-02-01', '2026-02-28', '{"invoiceCount":44,"paymentCount":43,"totalRevenue":61800.00,"refundCount":0,"reportCount":7}',  '2026-03-01 09:00:00');

-- generated_by_staff_id references room_db.staff.staff_id (cross-service reference)
-- staffId: 5=manager, 4=finance officer, 2=housekeeping
INSERT INTO reports (report_type, scope, generated_at, generated_by_staff_id, content_summary) VALUES
('Monthly Occupancy Report', 'OCCUPANCY',   '2026-05-01 08:00:00', 5, 'Occupancy for April 2026: 81.2%. Peak days April 12–16 (full). 7 rooms under maintenance.'),
('Monthly Finance Report',   'FINANCE',     '2026-05-01 08:30:00', 4, 'Revenue April 2026: $68,420. Outstanding: 3 invoices totalling $4,200. Payment success: 93.8%.'),
('Housekeeping Summary',     'HOUSEKEEPING','2026-05-15 09:00:00', 2, 'Tasks completed on schedule: 87.5%. Avg task duration: 45 min. 3 maintenance requests escalated.'),
('Staff Performance Report', 'STAFF',       '2026-05-01 09:00:00', 5, 'Shift completion rate: 98.2%. Overtime hours: 12. Top performer: Mike Cleaning (Housekeeping).'),
('Services Revenue Report',  'SERVICES',    '2026-05-01 09:30:00', 4, 'F&B revenue: $8,200. Spa revenue: $5,400. Laundry: $1,100. Total services: $14,700.');


-- ================================================================
-- DONE — verify with:
--   SELECT COUNT(*) FROM user_db2.users;               -- expect 9
--   SELECT COUNT(*) FROM room_db.rooms;                -- expect 7
--   SELECT COUNT(*) FROM guest_reservation_db.guests;  -- expect 3
--   SELECT COUNT(*) FROM guest_reservation_db.reservations; -- expect 3
--   SELECT COUNT(*) FROM services_db.service_orders;   -- expect 7
--   SELECT COUNT(*) FROM finance_db.invoices;          -- expect 3
--   SELECT COUNT(*) FROM finance_db.payments;          -- expect 1
--   SELECT COUNT(*) FROM reporting_db.kpis;            -- expect 6
--   SELECT COUNT(*) FROM reporting_db.reports;         -- expect 5
-- ================================================================
