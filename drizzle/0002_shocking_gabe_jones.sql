CREATE TABLE `campaign_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`host` text NOT NULL,
	`channel` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
