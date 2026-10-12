DROP INDEX `lab_entries_location_registration_number_unique`;
--> statement-breakpoint
ALTER TABLE `lab_entries` ADD `source_entry_id` integer;
--> statement-breakpoint
CREATE INDEX `idx_lab_entries_source_entry` ON `lab_entries` (`source_entry_id`);
