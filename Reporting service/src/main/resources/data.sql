-- Sample Data for Hospease Application
-- This file contains insert statements for all entities

-- -- ===== USERS =====
-- INSERT INTO users (name, role, email, phone, status, created_at, updated_at)
-- VALUES
-- ('John Manager', 'MANAGER', 'john.manager@hospease.com', '+1-555-0101', 'ACTIVE', '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
-- ('Sarah Admin', 'ADMIN', 'sarah.admin@hospease.com', '+1-555-0102', 'ACTIVE', '2026-01-15 10:30:00', '2026-01-15 10:30:00'),
-- ('Mike Housekeeper', 'HOUSEKEEPING', 'mike.house@hospease.com', '+1-555-0103', 'ACTIVE', '2026-01-16 09:00:00', '2026-01-16 09:00:00'),
-- ('Emma Housekeeper', 'HOUSEKEEPING', 'emma.housekeeper@hospease.com', '+1-555-0104', 'ACTIVE', '2026-01-16 09:30:00', '2026-01-16 09:30:00'),
-- ('David Guest', 'GUEST', 'david.guest@hospease.com', '+1-555-0105', 'ACTIVE', '2026-02-01 14:00:00', '2026-02-01 14:00:00'),
-- ('Alice Guest', 'GUEST', 'alice.guest@hospease.com', '+1-555-0106', 'ACTIVE', '2026-02-02 15:30:00', '2026-02-02 15:30:00'),
-- ('Robert Service', 'SERVICE', 'robert.service@hospease.com', '+1-555-0107', 'ACTIVE', '2026-01-17 08:00:00', '2026-01-17 08:00:00'),
-- ('Lisa Front Desk', 'FRONT_DESK', 'lisa.frontdesk@hospease.com', '+1-555-0108', 'ACTIVE', '2026-01-17 08:30:00', '2026-01-17 08:30:00');


-- ===== REPORTS =====
INSERT INTO reports (scope, parameters_json, metrics_json, generated_by_user_id, generated_at, report_uri)
VALUES 
('FINANCE', '{"month":"February","year":2026}', '{"total_reservations":5,"occupancy_rate":75,"revenue":4561.29}', 2, '2026-02-28 23:00:00', '/reports/monthly_feb_2026.pdf'),
('OCCUPANCY', '{"date":"2026-02-06"}', '{"guests_checked_in":2,"guests_checked_out":1,"rooms_cleaned":4}', 1, '2026-02-06 23:30:00', '/reports/daily_2026_02_06.pdf'),
('OCCUPANCY', '{"date":"2026-02-07"}', '{"guests_checked_in":1,"guests_checked_out":0,"rooms_cleaned":3}', 1, '2026-02-07 23:30:00', '/reports/daily_2026_02_07.pdf'),
('FINANCE', '{"guestId":1}', '{"total_stays":2,"total_spent":2194.40,"loyalty_tier":"GOLD"}', 2, '2026-02-08 10:00:00', '/reports/guest_david_2026.pdf'),
('FINANCE', '{"period":"2026-02"}', '{"total_revenue":4561.29,"room_revenue":3969.83,"additional_services":591.46}', 2, '2026-02-28 23:00:00', '/reports/revenue_feb_2026.pdf');

-- ===== KPIS =====
INSERT INTO kpis (name, definition, target, current_value, reporting_period) 
VALUES 
('Occupancy Rate', 'Percentage of rooms occupied per night', 80.00, 75.00, 'MONTHLY'),
('Average Daily Rate', 'Average revenue per available room per night', 175.00, 165.50, 'MONTHLY'),
('Revenue Per Available Room', 'REVPAR = Average Daily Rate × Occupancy Rate', 150.00, 123.75, 'MONTHLY'),
('Customer Satisfaction', 'Guest satisfaction score based on feedback', 90.00, 88.50, 'MONTHLY'),
('Staff Productivity', 'Average tasks completed per staff member per shift', 5.00, 4.80, 'MONTHLY'),
('Payment Collection Rate', 'Percentage of invoices paid on time', 95.00, 92.00, 'MONTHLY');

-- ===== AUDIT_PACKAGES =====
INSERT INTO audit_packages (period_start, period_end, contents_json, generated_at, package_uri) 
VALUES 
('2026-01-01', '2026-01-31', '{"audit_count":42,"compliance_score":97.5,"critical_issues":0,"major_issues":1}', '2026-02-01 08:00:00', '/audit/january_2026.pdf'),
('2026-02-01', '2026-02-28', '{"audit_count":38,"compliance_score":98.0,"critical_issues":0,"major_issues":0}', '2026-02-28 08:00:00', '/audit/february_2026.pdf'),
('2026-03-01', '2026-03-31', '{"audit_count":45,"compliance_score":96.5,"critical_issues":1,"major_issues":2}', '2026-03-31 08:00:00', '/audit/march_2026.pdf');
