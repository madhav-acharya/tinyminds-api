CREATE TABLE IF NOT EXISTS "content"."asset_3d" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "model_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "file_type" TEXT NOT NULL DEFAULT 'glb',
    "license" TEXT,
    "author_name" TEXT,
    "attribution" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_3d_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "content"."question_options" ADD COLUMN IF NOT EXISTS "asset_3d_id" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'question_options_asset_3d_id_fkey'
          AND table_schema = 'content'
          AND table_name = 'question_options'
    ) THEN
        ALTER TABLE "content"."question_options"
            ADD CONSTRAINT "question_options_asset_3d_id_fkey"
            FOREIGN KEY ("asset_3d_id")
            REFERENCES "content"."asset_3d"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_question_options_asset_3d_id" ON "content"."question_options"("asset_3d_id");
