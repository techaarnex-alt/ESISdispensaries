CREATE TABLE `customer_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`rating` integer NOT NULL,
	`reviewer_name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_reviews_location_created` ON `customer_reviews` (`location_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lab_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_number` text NOT NULL,
	`location_id` text NOT NULL,
	`patient` text NOT NULL,
	`patient_id` text NOT NULL,
	`ip_number` text NOT NULL,
	`age` text NOT NULL,
	`sex` text NOT NULL,
	`relationship` text NOT NULL,
	`tests_json` text NOT NULL,
	`status` text DEFAULT 'Collected' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lab_entries_report_number_unique` ON `lab_entries` (`report_number`);--> statement-breakpoint
CREATE INDEX `idx_lab_entries_location_created` ON `lab_entries` (`location_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lab_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`location_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_lab_sessions_expiry` ON `lab_sessions` (`expires_at`);