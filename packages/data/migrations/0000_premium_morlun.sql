CREATE TABLE "items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"shelf" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"rating" integer,
	"image_url" text,
	"image_width" integer,
	"image_height" integer,
	"external_id" varchar(255),
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"moved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"series_id" uuid,
	"data" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "chk_series_id" CHECK (series_id IS NULL OR type = 'TvSeason')
);
--> statement-breakpoint
CREATE INDEX "idx_type_moved" ON "items" USING btree ("type","moved_at");--> statement-breakpoint
CREATE INDEX "idx_type_added" ON "items" USING btree ("type","added_at");--> statement-breakpoint
CREATE INDEX "idx_type_shelf_moved" ON "items" USING btree ("type","shelf","moved_at");--> statement-breakpoint
CREATE INDEX "idx_type_shelf_added" ON "items" USING btree ("type","shelf","added_at");--> statement-breakpoint
CREATE INDEX "idx_type_title" ON "items" USING btree ("type","title");--> statement-breakpoint
CREATE INDEX "idx_external_id" ON "items" USING btree ("external_id") WHERE external_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_series_id" ON "items" USING btree ("series_id","moved_at") WHERE series_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_type_rating" ON "items" USING btree ("type","rating");--> statement-breakpoint
CREATE INDEX "idx_type_shelf_rating" ON "items" USING btree ("type","shelf","rating");