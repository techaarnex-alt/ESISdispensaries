import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const labEntries = sqliteTable(
  'lab_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reportNumber: text('report_number').notNull().unique(),
    locationId: text('location_id').notNull(),
    patient: text('patient').notNull(),
    patientId: text('patient_id').notNull(),
    ipNumber: text('ip_number').notNull(),
    age: text('age').notNull(),
    sex: text('sex').notNull(),
    relationship: text('relationship').notNull(),
    testsJson: text('tests_json').notNull(),
    status: text('status').notNull().default('Collected'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_lab_entries_location_created').on(table.locationId, table.createdAt)],
);

export const customerReviews = sqliteTable(
  'customer_reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    locationId: text('location_id').notNull(),
    rating: integer('rating').notNull(),
    reviewerName: text('reviewer_name').notNull(),
    message: text('message').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_customer_reviews_location_created').on(table.locationId, table.createdAt)],
);

export const labSessions = sqliteTable(
  'lab_sessions',
  {
    token: text('token').primaryKey(),
    locationId: text('location_id').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('idx_lab_sessions_expiry').on(table.expiresAt)],
);
