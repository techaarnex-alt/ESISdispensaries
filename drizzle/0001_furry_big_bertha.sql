CREATE TABLE `lab_entry_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`test_id` integer,
	`test_name` text NOT NULL,
	`rate_paise` integer NOT NULL,
	`result_value` text DEFAULT '' NOT NULL,
	`result_note` text DEFAULT '' NOT NULL,
	`result_status` text DEFAULT 'Pending' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_lab_entry_tests_entry_status` ON `lab_entry_tests` (`entry_id`,`result_status`);--> statement-breakpoint
CREATE TABLE `lab_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`rate_paise` integer NOT NULL,
	`reference_range` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_lab_tests_location_active` ON `lab_tests` (`location_id`,`active`,`name`);