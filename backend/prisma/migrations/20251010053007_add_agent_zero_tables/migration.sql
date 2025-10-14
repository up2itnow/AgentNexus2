-- CreateEnum
CREATE TYPE "AgentZeroStatus" AS ENUM ('CREATING', 'STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'PAUSED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "AgentZeroTier" AS ENUM ('BASIC', 'PRO');

-- CreateTable
CREATE TABLE "agent_zero_instances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "container_id" TEXT NOT NULL,
    "status" "AgentZeroStatus" NOT NULL DEFAULT 'CREATING',
    "tier" "AgentZeroTier" NOT NULL DEFAULT 'BASIC',
    "tunnel_url" TEXT,
    "internal_port" INTEGER NOT NULL DEFAULT 50001,
    "memory_path" TEXT,
    "cpu_limit" TEXT,
    "memory_limit" TEXT NOT NULL DEFAULT '4GB',
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    "total_executions" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_zero_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_zero_executions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "instance_id" TEXT,
    "tier" "AgentZeroTier" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "execution_time" INTEGER,
    "tools_used" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tokens_used" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "agent_zero_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_zero_instances_container_id_key" ON "agent_zero_instances"("container_id");

-- CreateIndex
CREATE INDEX "agent_zero_instances_user_id_idx" ON "agent_zero_instances"("user_id");

-- CreateIndex
CREATE INDEX "agent_zero_instances_status_idx" ON "agent_zero_instances"("status");

-- CreateIndex
CREATE INDEX "agent_zero_instances_tier_idx" ON "agent_zero_instances"("tier");

-- CreateIndex
CREATE INDEX "agent_zero_instances_expires_at_idx" ON "agent_zero_instances"("expires_at");

-- CreateIndex
CREATE INDEX "agent_zero_executions_user_id_idx" ON "agent_zero_executions"("user_id");

-- CreateIndex
CREATE INDEX "agent_zero_executions_instance_id_idx" ON "agent_zero_executions"("instance_id");

-- CreateIndex
CREATE INDEX "agent_zero_executions_tier_idx" ON "agent_zero_executions"("tier");

-- CreateIndex
CREATE INDEX "agent_zero_executions_status_idx" ON "agent_zero_executions"("status");

-- CreateIndex
CREATE INDEX "agent_zero_executions_created_at_idx" ON "agent_zero_executions"("created_at");

-- AddForeignKey
ALTER TABLE "agent_zero_instances" ADD CONSTRAINT "agent_zero_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_zero_executions" ADD CONSTRAINT "agent_zero_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_zero_executions" ADD CONSTRAINT "agent_zero_executions_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "agent_zero_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
