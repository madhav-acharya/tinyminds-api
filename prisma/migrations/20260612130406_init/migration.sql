-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "content";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "institution";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "learning";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'LEARNER');

-- CreateEnum
CREATE TYPE "auth"."AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "institution"."InstitutionLearnerStatus" AS ENUM ('INVITED', 'ACCEPTED', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "learning"."ModuleScope" AS ENUM ('PUBLIC', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "content"."ContentType" AS ENUM ('REGULAR', 'MISSION', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "content"."ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "content"."QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'IMAGE_TAP', 'ANIMATION_TAP', 'TRUE_FALSE', 'TEXT_INPUT', 'FILL_BLANK', 'MATCHING', 'ORDERING', 'AUDIO_CHOICE', 'VIDEO_CHOICE');

-- CreateEnum
CREATE TYPE "content"."SubmissionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'PASSED', 'FAILED', 'MISSED');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "role" "auth"."UserRole" NOT NULL,
    "status" "auth"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."admin_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."teacher_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."parent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."learner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution"."institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "status" "auth"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution"."institution_learners" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "status" "institution"."InstitutionLearnerStatus" NOT NULL DEFAULT 'INVITED',
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution"."learner_invites" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "learner_username" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "grade_id" TEXT,
    "status" "institution"."InstitutionLearnerStatus" NOT NULL DEFAULT 'INVITED',
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."grades" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning"."modules" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT,
    "grade_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" "learning"."ModuleScope" NOT NULL DEFAULT 'PUBLIC',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."contents" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "media_url" TEXT,
    "type" "content"."ContentType" NOT NULL DEFAULT 'REGULAR',
    "status" "content"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "duration_sec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."content_questions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "type" "content"."QuestionType" NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT,
    "media_url" TEXT,
    "animation_url" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "answer_key" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text" TEXT,
    "media_url" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."content_submissions" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "status" "content"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "incorrect_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."question_answers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "answer" JSONB,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "auth"."users"("username");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "auth"."users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "auth"."users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_user_id_key" ON "auth"."admin_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_admin_profiles_institution_id" ON "auth"."admin_profiles"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "auth"."teacher_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_teacher_profiles_institution_id" ON "auth"."teacher_profiles"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_key" ON "auth"."parent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_profiles_user_id_key" ON "auth"."learner_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_learner_profiles_parent_id" ON "auth"."learner_profiles"("parent_id");

-- CreateIndex
CREATE INDEX "idx_learner_profiles_grade_id" ON "auth"."learner_profiles"("grade_id");

-- CreateIndex
CREATE INDEX "idx_learner_profiles_is_public" ON "auth"."learner_profiles"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_code_key" ON "institution"."institutions"("code");

-- CreateIndex
CREATE INDEX "idx_institutions_status" ON "institution"."institutions"("status");

-- CreateIndex
CREATE INDEX "idx_institution_learners_learner_id" ON "institution"."institution_learners"("learner_id");

-- CreateIndex
CREATE INDEX "idx_institution_learners_grade_id" ON "institution"."institution_learners"("grade_id");

-- CreateIndex
CREATE INDEX "idx_institution_learners_status" ON "institution"."institution_learners"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_institution_learners_institution_id_learner_id" ON "institution"."institution_learners"("institution_id", "learner_id");

-- CreateIndex
CREATE INDEX "idx_learner_invites_institution_id" ON "institution"."learner_invites"("institution_id");

-- CreateIndex
CREATE INDEX "idx_learner_invites_parent_id" ON "institution"."learner_invites"("parent_id");

-- CreateIndex
CREATE INDEX "idx_learner_invites_learner_username" ON "institution"."learner_invites"("learner_username");

-- CreateIndex
CREATE INDEX "idx_learner_invites_status" ON "institution"."learner_invites"("status");

-- CreateIndex
CREATE INDEX "idx_grades_institution_id" ON "learning"."grades"("institution_id");

-- CreateIndex
CREATE INDEX "idx_grades_sort_order" ON "learning"."grades"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_grades_institution_id_name" ON "learning"."grades"("institution_id", "name");

-- CreateIndex
CREATE INDEX "idx_modules_institution_id" ON "learning"."modules"("institution_id");

-- CreateIndex
CREATE INDEX "idx_modules_grade_id" ON "learning"."modules"("grade_id");

-- CreateIndex
CREATE INDEX "idx_modules_scope" ON "learning"."modules"("scope");

-- CreateIndex
CREATE INDEX "idx_modules_is_published" ON "learning"."modules"("is_published");

-- CreateIndex
CREATE INDEX "idx_contents_module_id" ON "content"."contents"("module_id");

-- CreateIndex
CREATE INDEX "idx_contents_teacher_id" ON "content"."contents"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_contents_type" ON "content"."contents"("type");

-- CreateIndex
CREATE INDEX "idx_contents_status" ON "content"."contents"("status");

-- CreateIndex
CREATE INDEX "idx_contents_start_date_end_date" ON "content"."contents"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_content_questions_content_id" ON "content"."content_questions"("content_id");

-- CreateIndex
CREATE INDEX "idx_content_questions_type" ON "content"."content_questions"("type");

-- CreateIndex
CREATE INDEX "idx_content_questions_sort_order" ON "content"."content_questions"("sort_order");

-- CreateIndex
CREATE INDEX "idx_question_options_question_id" ON "content"."question_options"("question_id");

-- CreateIndex
CREATE INDEX "idx_question_options_is_correct" ON "content"."question_options"("is_correct");

-- CreateIndex
CREATE INDEX "idx_question_options_sort_order" ON "content"."question_options"("sort_order");

-- CreateIndex
CREATE INDEX "idx_content_submissions_learner_id" ON "content"."content_submissions"("learner_id");

-- CreateIndex
CREATE INDEX "idx_content_submissions_status" ON "content"."content_submissions"("status");

-- CreateIndex
CREATE INDEX "idx_content_submissions_submitted_at" ON "content"."content_submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_content_submissions_content_id_learner_id" ON "content"."content_submissions"("content_id", "learner_id");

-- CreateIndex
CREATE INDEX "idx_question_answers_question_id" ON "content"."question_answers"("question_id");

-- CreateIndex
CREATE INDEX "idx_question_answers_learner_id" ON "content"."question_answers"("learner_id");

-- CreateIndex
CREATE INDEX "idx_question_answers_is_correct" ON "content"."question_answers"("is_correct");

-- CreateIndex
CREATE UNIQUE INDEX "uq_question_answers_submission_id_question_id" ON "content"."question_answers"("submission_id", "question_id");

-- AddForeignKey
ALTER TABLE "auth"."admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."admin_profiles" ADD CONSTRAINT "admin_profiles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."teacher_profiles" ADD CONSTRAINT "teacher_profiles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."learner_profiles" ADD CONSTRAINT "learner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."learner_profiles" ADD CONSTRAINT "learner_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."learner_profiles" ADD CONSTRAINT "learner_profiles_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "learning"."grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."institution_learners" ADD CONSTRAINT "institution_learners_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."institution_learners" ADD CONSTRAINT "institution_learners_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "auth"."learner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."institution_learners" ADD CONSTRAINT "institution_learners_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "learning"."grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."learner_invites" ADD CONSTRAINT "learner_invites_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."learner_invites" ADD CONSTRAINT "learner_invites_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution"."learner_invites" ADD CONSTRAINT "learner_invites_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "learning"."grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."grades" ADD CONSTRAINT "grades_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."modules" ADD CONSTRAINT "modules_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"."institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning"."modules" ADD CONSTRAINT "modules_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "learning"."grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."contents" ADD CONSTRAINT "contents_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."contents" ADD CONSTRAINT "contents_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."content_questions" ADD CONSTRAINT "content_questions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"."contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "content"."content_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."content_submissions" ADD CONSTRAINT "content_submissions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"."contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."content_submissions" ADD CONSTRAINT "content_submissions_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "auth"."learner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."question_answers" ADD CONSTRAINT "question_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "content"."content_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."question_answers" ADD CONSTRAINT "question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "content"."content_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."question_answers" ADD CONSTRAINT "question_answers_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "auth"."learner_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
