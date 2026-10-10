CREATE TABLE `email_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sender` text NOT NULL,
	`subject` text NOT NULL,
	`risk_score` integer NOT NULL,
	`signals` text NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`reviewed_at` integer
);
