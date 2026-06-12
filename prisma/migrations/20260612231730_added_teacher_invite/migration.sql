/*
  Warnings:

  - Added the required column `institution_id` to the `owner_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auth"."owner_profiles" ADD COLUMN     "institution_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "institution"."teacher_invites" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" "institution"."InstitutionLearnerStatus" NOT NULL DEFAULT 'INVITED',
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_teacher_invites_institution_id" ON "institution"."teacher_invites"("institution_id");

-- CreateIndex
CREATE INDEX "idx_teacher_invites_email" ON "institution"."teacher_invites"("email");

-- CreateIndex
CREATE INDEX "idx_teacher_invites_status" ON "institution"."teacher_invites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_teacher_invites_institution_id_email" ON "institution"."teacher_invites"("institution_id", "email");

-- CreateIndex
CREATE INDEX "idx_owner_profiles_institution_id" ON "auth"."owner_profiles"("institution_id");

-- AddForeignKey
ALTER TABLE "auth"."owner_profiles" ADD CONSTRAINT "owner_profiles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."teacher_invites" ADD CONSTRAINT "teacher_invites_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
