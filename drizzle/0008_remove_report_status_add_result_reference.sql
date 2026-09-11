ALTER TABLE `lab_entry_tests` ADD `reference_range` text DEFAULT '' NOT NULL;
--> statement-breakpoint
DROP INDEX `idx_lab_entry_tests_entry_status`;
--> statement-breakpoint
ALTER TABLE `lab_entry_tests` DROP COLUMN `result_status`;
--> statement-breakpoint
ALTER TABLE `lab_entries` DROP COLUMN `status`;
--> statement-breakpoint
CREATE INDEX `idx_lab_entry_tests_entry` ON `lab_entry_tests` (`entry_id`);
