-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "people_helped" INTEGER NOT NULL,
    "events_conducted" INTEGER NOT NULL,
    "funds_utilized" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "file_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_ngo_id_month_key" ON "reports"("ngo_id", "month");

-- CreateIndex
CREATE INDEX "reports_month_idx" ON "reports"("month");
