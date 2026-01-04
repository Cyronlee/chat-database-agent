-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "row_created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "row_updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_charts" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sql" TEXT NOT NULL,
    "chart_config" JSONB NOT NULL,
    "created_by" BIGINT,
    "database_id" BIGINT,
    "row_created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "row_updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "custom_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_dashboards" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "render_config" JSONB NOT NULL,
    "created_by" BIGINT,
    "row_created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "row_updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "custom_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_databases" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5432,
    "database" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ssl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_by" BIGINT,
    "row_created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "row_updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "external_databases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "custom_charts" ADD CONSTRAINT "custom_charts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_charts" ADD CONSTRAINT "custom_charts_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "external_databases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_dashboards" ADD CONSTRAINT "custom_dashboards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_databases" ADD CONSTRAINT "external_databases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
