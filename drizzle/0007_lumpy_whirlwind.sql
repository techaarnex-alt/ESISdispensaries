ALTER TABLE `ip_sequences` RENAME TO `registration_sequences`;--> statement-breakpoint
ALTER TABLE `lab_entries` RENAME COLUMN "patient_id" TO "registration_number";--> statement-breakpoint
CREATE UNIQUE INDEX `lab_entries_location_registration_number_unique` ON `lab_entries` (`location_id`,`registration_number`);