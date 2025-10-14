-- CreateEnum
CREATE TYPE "TemplateDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "BuildMethod" AS ENUM ('TEMPLATE', 'HYBRID', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModuleCategory" AS ENUM ('DATA_SOURCE', 'ANALYSIS', 'TRIGGER', 'ACTION', 'UTILITY');

-- CreateTable
CREATE TABLE "agent_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AgentCategory" NOT NULL,
    "difficulty" "TemplateDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "basePrice" DECIMAL(18,6) NOT NULL,
    "complexity" INTEGER NOT NULL DEFAULT 1,
    "modules" JSONB NOT NULL,
    "configSchema" JSONB NOT NULL,
    "defaultConfig" JSONB NOT NULL,
    "example_config" JSONB,
    "icon" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_agents" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "template_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "build_method" "BuildMethod" NOT NULL DEFAULT 'TEMPLATE',
    "configuration" JSONB NOT NULL,
    "selected_modules" JSONB NOT NULL,
    "custom_code" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_deployed" BOOLEAN NOT NULL DEFAULT false,
    "deployed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ModuleCategory" NOT NULL,
    "base_cost" DECIMAL(18,6) NOT NULL,
    "execution_cost" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "config_schema" JSONB NOT NULL,
    "default_config" JSONB NOT NULL,
    "dependencies" TEXT[],
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_templates_category_idx" ON "agent_templates"("category");

-- CreateIndex
CREATE INDEX "agent_templates_difficulty_idx" ON "agent_templates"("difficulty");

-- CreateIndex
CREATE INDEX "agent_templates_featured_idx" ON "agent_templates"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "custom_agents_agent_id_key" ON "custom_agents"("agent_id");

-- CreateIndex
CREATE INDEX "custom_agents_creator_id_idx" ON "custom_agents"("creator_id");

-- CreateIndex
CREATE INDEX "custom_agents_template_id_idx" ON "custom_agents"("template_id");

-- CreateIndex
CREATE INDEX "custom_agents_build_method_idx" ON "custom_agents"("build_method");

-- CreateIndex
CREATE INDEX "agent_modules_category_idx" ON "agent_modules"("category");

-- CreateIndex
CREATE INDEX "agent_modules_is_active_idx" ON "agent_modules"("is_active");

-- AddForeignKey
ALTER TABLE "custom_agents" ADD CONSTRAINT "custom_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_agents" ADD CONSTRAINT "custom_agents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "agent_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_agents" ADD CONSTRAINT "custom_agents_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
