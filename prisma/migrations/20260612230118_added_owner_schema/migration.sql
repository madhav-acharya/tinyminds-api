-- AlterEnum
ALTER TYPE "auth"."UserRole" ADD VALUE 'OWNER';

-- CreateTable
CREATE TABLE "auth"."owner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owner_profiles_user_id_key" ON "auth"."owner_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "auth"."owner_profiles" ADD CONSTRAINT "owner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
