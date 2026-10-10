-- BloodLink public demo data for Firebase Data Connect's linked Postgres DB.
-- Safe to rerun: every row uses a fixed UUID and upserts by primary key.
-- Alerts are inserted only for profiles that already exist in `users`; this
-- script deliberately never creates Firebase Auth identities or user profiles.

BEGIN;

INSERT INTO blood_banks
  (id, name, district, address, phone, hours, is_verified, note)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'National Blood Centre', 'Colombo', 'No. 555, Elvitigala Mawatha, Narahenpita', '011 269 3962', 'Open 24 hours', TRUE, 'Main national blood distribution centre.'),
  ('10000000-0000-4000-8000-000000000002', 'Lady Ridgeway Hospital Blood Bank', 'Colombo', 'No. 385, Deans Road, Colombo 10', '011 269 3719', 'Open 24 hours', TRUE, 'Paediatric emergency blood support.'),
  ('10000000-0000-4000-8000-000000000003', 'Teaching Hospital Kandy Blood Bank', 'Kandy', 'William Gopallawa Mawatha, Kandy', '081 223 3337', 'Open 24 hours', TRUE, 'Central Province referral centre.'),
  ('10000000-0000-4000-8000-000000000004', 'Teaching Hospital Karapitiya Blood Bank', 'Galle', 'Karapitiya, Galle', '091 223 2567', 'Open 24 hours', TRUE, 'Southern Province emergency supply.'),
  ('10000000-0000-4000-8000-000000000005', 'Teaching Hospital Jaffna Blood Bank', 'Jaffna', 'Hospital Road, Jaffna', '021 222 3344', 'Open 24 hours', TRUE, 'Northern Province referral centre.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  district = EXCLUDED.district,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  hours = EXCLUDED.hours,
  is_verified = EXCLUDED.is_verified,
  note = EXCLUDED.note,
  updated_at = now();

INSERT INTO blood_inventory (id, bank_id, blood_group, component, units)
VALUES
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'O+', 'whole_blood', 18),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'O-', 'prbc', 8),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'A+', 'platelets', 12),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'AB+', 'plasma', 10),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'B+', 'whole_blood', 9),
  ('11000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'O+', 'prbc', 15),
  ('11000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'A-', 'platelets', 5),
  ('11000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'A+', 'whole_blood', 14),
  ('11000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'B-', 'prbc', 4),
  ('11000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'AB-', 'plasma', 3),
  ('11000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'O+', 'whole_blood', 16),
  ('11000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'A+', 'prbc', 11),
  ('11000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000004', 'B+', 'platelets', 7),
  ('11000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000005', 'O-', 'whole_blood', 6),
  ('11000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000005', 'AB+', 'prbc', 5),
  ('11000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000005', 'A+', 'plasma', 8)
ON CONFLICT (id) DO UPDATE SET
  bank_id = EXCLUDED.bank_id,
  blood_group = EXCLUDED.blood_group,
  component = EXCLUDED.component,
  units = EXCLUDED.units,
  updated_at = now();

INSERT INTO emergency_requests
  (id, requester_uid, patient_name, blood_group, units, hospital, district,
   registration_number, contact_name, contact_mobile, urgency, notes, status)
VALUES
  ('20000000-0000-4000-8000-000000000001', NULL, 'Kavindi Perera', 'O-', 2, 'National Hospital of Sri Lanka', 'Colombo', 'NHSL-ER-2026-001', 'Dr. Anura Silva', '011 269 1111', 'critical', 'Urgent trauma case. Compatible O-negative donors are requested immediately.', 'pending'),
  ('20000000-0000-4000-8000-000000000002', NULL, 'Tharindu Jayasinghe', 'A+', 3, 'Teaching Hospital Kandy', 'Kandy', 'THK-ER-2026-014', 'Dr. Nadeesha Kumar', '081 223 3337', 'urgent', 'Scheduled emergency surgery this afternoon. Please respond if available.', 'pending'),
  ('20000000-0000-4000-8000-000000000003', NULL, 'Mihiri Fernando', 'B+', 1, 'Teaching Hospital Karapitiya', 'Galle', 'THK-ER-2026-021', 'Dr. S. Perera', '091 223 2567', 'standard', 'Post-operative replacement unit needed within the next 24 hours.', 'pending')
ON CONFLICT (id) DO UPDATE SET
  patient_name = EXCLUDED.patient_name,
  blood_group = EXCLUDED.blood_group,
  units = EXCLUDED.units,
  hospital = EXCLUDED.hospital,
  district = EXCLUDED.district,
  registration_number = EXCLUDED.registration_number,
  contact_name = EXCLUDED.contact_name,
  contact_mobile = EXCLUDED.contact_mobile,
  urgency = EXCLUDED.urgency,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO alerts (id, user_uid, type, request_id, title, body)
SELECT
  '30000000-0000-4000-8000-000000000001',
  u.uid,
  'new_match',
  '20000000-0000-4000-8000-000000000001',
  'Critical O-negative request',
  'A nearby hospital needs two O-negative units immediately.'
FROM users u
WHERE u.mobile = '0771234567' OR u.email = '71234567@bloodlink.lk'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  user_uid = EXCLUDED.user_uid,
  type = EXCLUDED.type,
  request_id = EXCLUDED.request_id,
  title = EXCLUDED.title,
  body = EXCLUDED.body;

INSERT INTO alerts (id, user_uid, type, request_id, title, body)
SELECT
  '30000000-0000-4000-8000-000000000002',
  u.uid,
  'status_change',
  '20000000-0000-4000-8000-000000000002',
  'Request awaiting donor response',
  'Your A-positive emergency request is now visible to compatible donors.'
FROM users u
WHERE u.mobile = '0775551234' OR u.email = '75551234@bloodlink.lk'
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  user_uid = EXCLUDED.user_uid,
  type = EXCLUDED.type,
  request_id = EXCLUDED.request_id,
  title = EXCLUDED.title,
  body = EXCLUDED.body;

COMMIT;
