-- Local-only demonstration data. This file is intentionally separate from the schema migrations.
WITH RECURSIVE
  locations(location_id, total) AS (
    VALUES
      ('sarojini', 6),
      ('aishbagh', 4),
      ('golaganj', 9),
      ('sandeela', 3),
      ('sitapur', 7),
      ('barabanki', 5),
      ('raebareli', 8)
  ),
  counters(location_id, total, n) AS (
    SELECT location_id, total, 1 FROM locations
    UNION ALL
    SELECT location_id, total, n + 1 FROM counters WHERE n < total
  )
INSERT INTO lab_entries (report_number, location_id, patient, registration_number, ip_number, age, sex, relationship, tests_json, status, created_at)
SELECT
  'DEMO-' || upper(location_id) || '-' || printf('%03d', n),
  location_id,
  'Demo patient ' || n,
  'REG-' || upper(location_id) || '-' || printf('%06d', n),
  'ESI-DEMO-' || printf('%04d', n),
  CAST(24 + n AS TEXT),
  CASE WHEN n % 2 = 0 THEN 'Female' ELSE 'Male' END,
  'Self',
  CASE WHEN n % 3 = 0 THEN '["CBC","LFT"]' WHEN n % 2 = 0 THEN '["CBC","Blood Sugar"]' ELSE '["Thyroid Profile"]' END,
  CASE WHEN n % 3 = 0 THEN 'Completed' WHEN n % 2 = 0 THEN 'In progress' ELSE 'Collected' END,
  1788840000000 + (n * 1000)
FROM counters
WHERE NOT EXISTS (
  SELECT 1 FROM lab_entries existing WHERE existing.report_number = 'DEMO-' || upper(counters.location_id) || '-' || printf('%03d', counters.n)
);

INSERT INTO registration_sequences (location_id, last_number)
VALUES
  ('sarojini', 6), ('aishbagh', 4), ('golaganj', 9), ('sandeela', 3),
  ('sitapur', 7), ('barabanki', 5), ('raebareli', 8)
ON CONFLICT(location_id) DO UPDATE SET last_number = MAX(registration_sequences.last_number, excluded.last_number);

-- Each location starts with its own copy of the test catalogue. These are seed rows,
-- not shared global tests: each branch can edit its rates independently.
WITH locations(location_id) AS (
  VALUES ('sarojini'), ('aishbagh'), ('golaganj'), ('sandeela'), ('sitapur'), ('barabanki'), ('raebareli')
)
INSERT OR IGNORE INTO lab_tests (location_id, name, category, reference_range, active, created_at)
SELECT location_id, 'CBC', 'Hematology', 'Hb: 12–16 g/dL', 1, 1788842000000 FROM locations
UNION ALL SELECT location_id, 'Blood Sugar', 'Biochemistry', 'Fasting: 70–100 mg/dL', 1, 1788842000000 FROM locations
UNION ALL SELECT location_id, 'LFT', 'Biochemistry', 'As per laboratory reference range', 1, 1788842000000 FROM locations
UNION ALL SELECT location_id, 'Thyroid Profile', 'Hormone & Electrolyte', 'As per laboratory reference range', 1, 1788842000000 FROM locations;

-- Give existing demonstration registrations editable result rows as well.
INSERT INTO lab_entry_tests (entry_id, test_id, test_name, result_value, result_note, result_status, updated_at)
SELECT
  entry.id,
  test.id,
  test.name,
  CASE WHEN entry.status = 'Completed' THEN 'Verified' ELSE '' END,
  CASE WHEN entry.status = 'Completed' THEN 'Demo result' ELSE '' END,
  CASE WHEN entry.status = 'Completed' THEN 'Completed' WHEN entry.status = 'In progress' THEN 'In progress' ELSE 'Pending' END,
  entry.created_at
FROM lab_entries entry
JOIN json_each(entry.tests_json) selected
JOIN lab_tests test ON test.location_id = entry.location_id AND test.name = selected.value
WHERE entry.report_number LIKE 'DEMO-%'
  AND NOT EXISTS (SELECT 1 FROM lab_entry_tests existing WHERE existing.entry_id = entry.id AND existing.test_name = test.name);

INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'sarojini', 5, 'Demo visitor', 'Registration guidance was clear and the waiting area was orderly.', 1788841000000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'sarojini' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'aishbagh', 4, 'Demo visitor', 'Staff explained the sample collection process well.', 1788841001000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'aishbagh' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'golaganj', 5, 'Demo visitor', 'Report collection desk was helpful and organised.', 1788841002000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'golaganj' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'sandeela', 4, 'Demo visitor', 'The team handled the visit politely.', 1788841003000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'sandeela' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'sitapur', 5, 'Demo visitor', 'Good support at the laboratory counter.', 1788841004000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'sitapur' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'barabanki', 4, 'Demo visitor', 'The enquiry was handled promptly.', 1788841005000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'barabanki' AND reviewer_name = 'Demo visitor');
INSERT INTO customer_reviews (location_id, rating, reviewer_name, message, created_at)
SELECT 'raebareli', 5, 'Demo visitor', 'The process was easy to understand.', 1788841006000
WHERE NOT EXISTS (SELECT 1 FROM customer_reviews WHERE location_id = 'raebareli' AND reviewer_name = 'Demo visitor');
