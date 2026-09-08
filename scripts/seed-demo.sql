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
INSERT INTO lab_entries (report_number, location_id, patient, patient_id, ip_number, age, sex, relationship, tests_json, status, created_at)
SELECT
  'DEMO-' || upper(location_id) || '-' || printf('%03d', n),
  location_id,
  'Demo patient ' || n,
  'IP-' || printf('%06d', 410000 + n),
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
