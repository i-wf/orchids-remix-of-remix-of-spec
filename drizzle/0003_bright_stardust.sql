ALTER TABLE `users` ADD `subscription_type` text;--> statement-breakpoint
ALTER TABLE `users` ADD `ai_usage_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `ai_usage_reset_date` text;