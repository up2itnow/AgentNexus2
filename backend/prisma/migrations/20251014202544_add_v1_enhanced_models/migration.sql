-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('DEFI_PROTOCOL', 'INFRASTRUCTURE', 'MEDIA', 'ECOSYSTEM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISCUSSION', 'LOI_SIGNED', 'IN_DEVELOPMENT', 'LIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('USER_COUNT', 'AGENT_COUNT', 'TRANSACTION_VOLUME', 'REVENUE', 'DEVELOPER_COUNT', 'NPS_SCORE', 'RETENTION_RATE', 'GRANT_FUNDING', 'MEDIA_MENTIONS', 'PARTNERSHIP_COUNT');

-- CreateTable
CREATE TABLE "developer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "published_agents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_revenue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "monthly_revenue" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "waitlist_position" INTEGER,
    "accelerator_participant" BOOLEAN NOT NULL DEFAULT false,
    "hackathon_winner" BOOLEAN NOT NULL DEFAULT false,
    "github_handle" TEXT,
    "twitter_handle" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contract_value" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "private_agents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_integrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sla_level" TEXT NOT NULL DEFAULT 'STANDARD',
    "dedicated_support" BOOLEAN NOT NULL DEFAULT false,
    "api_key_limit" INTEGER NOT NULL DEFAULT 100,
    "custom_domain" TEXT,
    "whitelabel_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_pipelines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agents" JSONB NOT NULL,
    "total_cost" DECIMAL(36,18) NOT NULL,
    "revenue_share" INTEGER NOT NULL DEFAULT 3000,
    "status" "PipelineStatus" NOT NULL DEFAULT 'DRAFT',
    "execution_history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "a2a_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants" (
    "id" TEXT NOT NULL,
    "granting_organization" TEXT NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "GrantStatus" NOT NULL DEFAULT 'APPLIED',
    "application_date" TIMESTAMP(3) NOT NULL,
    "decision_date" TIMESTAMP(3),
    "disbursement_date" TIMESTAMP(3),
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "reporting_requirements" TEXT,
    "public_announcement" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnerships" (
    "id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "partner_type" "PartnerType" NOT NULL,
    "integration_status" "IntegrationStatus" NOT NULL DEFAULT 'DISCUSSION',
    "integration_date" TIMESTAMP(3),
    "value_proposition" TEXT,
    "kpi_targets" JSONB NOT NULL DEFAULT '{}',
    "contact_person" TEXT,
    "contract_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "metric_type" "MetricType" NOT NULL,
    "value" DECIMAL(36,18) NOT NULL,
    "week" INTEGER NOT NULL,
    "phase" INTEGER NOT NULL,
    "target_value" DECIMAL(36,18) NOT NULL,
    "percent_of_target" DECIMAL(5,4) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "developer_profiles_user_id_key" ON "developer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "developer_profiles_user_id_idx" ON "developer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "developer_profiles_waitlist_position_idx" ON "developer_profiles"("waitlist_position");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_profiles_user_id_key" ON "enterprise_profiles"("user_id");

-- CreateIndex
CREATE INDEX "enterprise_profiles_user_id_idx" ON "enterprise_profiles"("user_id");

-- CreateIndex
CREATE INDEX "a2a_pipelines_user_id_idx" ON "a2a_pipelines"("user_id");

-- CreateIndex
CREATE INDEX "a2a_pipelines_status_idx" ON "a2a_pipelines"("status");

-- CreateIndex
CREATE INDEX "grants_status_idx" ON "grants"("status");

-- CreateIndex
CREATE INDEX "grants_granting_organization_idx" ON "grants"("granting_organization");

-- CreateIndex
CREATE INDEX "grants_user_id_idx" ON "grants"("user_id");

-- CreateIndex
CREATE INDEX "partnerships_partner_type_idx" ON "partnerships"("partner_type");

-- CreateIndex
CREATE INDEX "partnerships_integration_status_idx" ON "partnerships"("integration_status");

-- CreateIndex
CREATE INDEX "metrics_metric_type_idx" ON "metrics"("metric_type");

-- CreateIndex
CREATE INDEX "metrics_week_idx" ON "metrics"("week");

-- CreateIndex
CREATE INDEX "metrics_phase_idx" ON "metrics"("phase");

-- CreateIndex
CREATE INDEX "metrics_recorded_at_idx" ON "metrics"("recorded_at");

-- AddForeignKey
ALTER TABLE "developer_profiles" ADD CONSTRAINT "developer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_profiles" ADD CONSTRAINT "enterprise_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_pipelines" ADD CONSTRAINT "a2a_pipelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
