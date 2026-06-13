ALTER TABLE "content"."asset_3d" ADD COLUMN IF NOT EXISTS "institution_id" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'asset_3d_institution_id_fkey'
          AND table_schema = 'content'
          AND table_name = 'asset_3d'
    ) THEN
        ALTER TABLE "content"."asset_3d"
            ADD CONSTRAINT "asset_3d_institution_id_fkey"
            FOREIGN KEY ("institution_id")
            REFERENCES "institution"."institutions"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
