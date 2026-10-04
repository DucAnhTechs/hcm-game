CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`yaw` real NOT NULL,
	`stage` integer NOT NULL,
	`score` integer NOT NULL,
	`vehicle` integer NOT NULL,
	`lastSeen` integer NOT NULL,
	`seq` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `players_room` ON `players` (`room`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`status` text NOT NULL,
	`endsAt` integer NOT NULL,
	`left` integer NOT NULL,
	`created` integer NOT NULL,
	`match` text NOT NULL
);
