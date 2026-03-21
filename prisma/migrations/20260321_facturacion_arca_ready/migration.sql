-- Migration: facturacion_arca_ready
-- Adds: SalePoint, InvoiceSequence, ARCA-ready fields to Invoice, taxPosition to Agency

-- ─── New enums ───────────────────────────────────────────────────────────────

CREATE TYPE "InvoiceLetter" AS ENUM ('A', 'B');

CREATE TYPE "InvoiceAuthStatus" AS ENUM (
  'LOCAL',
  'PENDING',
  'AUTHORIZED',
  'REJECTED',
  'FAILED'
);

-- ─── Agency: add taxPosition ─────────────────────────────────────────────────

ALTER TABLE "agencies"
  ADD COLUMN "taxPosition" "TaxPosition" NOT NULL DEFAULT 'RI';

-- ─── SalePoint ───────────────────────────────────────────────────────────────

CREATE TABLE "sale_points" (
  "id"       TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "number"   INTEGER NOT NULL,
  "name"     TEXT,
  "active"   BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "sale_points_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sale_points_agencyId_number_key" UNIQUE ("agencyId", "number"),
  CONSTRAINT "sale_points_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── InvoiceSequence ─────────────────────────────────────────────────────────

CREATE TABLE "invoice_sequences" (
  "id"          TEXT NOT NULL,
  "agencyId"    TEXT NOT NULL,
  "salePointId" TEXT NOT NULL,
  "letter"      "InvoiceLetter" NOT NULL,
  "type"        "InvoiceType" NOT NULL,
  "lastNumber"  INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoice_sequences_salePointId_letter_type_key" UNIQUE ("salePointId", "letter", "type"),
  CONSTRAINT "invoice_sequences_agencyId_fkey"    FOREIGN KEY ("agencyId")    REFERENCES "agencies"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "invoice_sequences_salePointId_fkey" FOREIGN KEY ("salePointId") REFERENCES "sale_points"("id")  ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── Invoice: add new columns ─────────────────────────────────────────────────
-- First add all columns as nullable, then add constraints

ALTER TABLE "invoices"
  ADD COLUMN "salePointId"         TEXT,
  ADD COLUMN "letter"              "InvoiceLetter",
  ADD COLUMN "concept"             INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "serviceFrom"         TIMESTAMP(3),
  ADD COLUMN "serviceTo"           TIMESTAMP(3),
  ADD COLUMN "clientTaxId"         TEXT,
  ADD COLUMN "clientTaxPosition"   "TaxPosition",
  ADD COLUMN "authorizationStatus" "InvoiceAuthStatus" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "cae"                 TEXT,
  ADD COLUMN "caeExpiresAt"        TIMESTAMP(3);

-- ─── Seed default SalePoint (PV 1) for each existing agency ──────────────────
-- Creates one SalePoint(number=1) per agency so existing invoices can be linked

INSERT INTO "sale_points" ("id", "agencyId", "number", "name", "active")
SELECT gen_random_uuid()::text, "id", 1, 'Punto de Venta 1', true
FROM "agencies";

-- ─── Populate salePointId for existing invoices (link to PV matching salePoint) ──

UPDATE "invoices" i
SET "salePointId" = sp."id",
    "letter" = 'B'  -- default B for existing records
FROM "sale_points" sp
WHERE sp."agencyId" = i."agencyId"
  AND sp."number" = i."salePoint";

-- ─── Handle invoices whose PV doesn't match any sale_point ──────────────────
-- (fallback: link to first sale_point of the same agency)
UPDATE "invoices" i
SET "salePointId" = (
  SELECT sp."id" FROM "sale_points" sp WHERE sp."agencyId" = i."agencyId" LIMIT 1
),
"letter" = COALESCE("letter", 'B')
WHERE "salePointId" IS NULL;

-- ─── Now make salePointId and letter NOT NULL ─────────────────────────────────
-- (only if all rows have been filled — safe after the UPDATE above)

ALTER TABLE "invoices"
  ALTER COLUMN "salePointId" SET NOT NULL,
  ALTER COLUMN "letter" SET NOT NULL;

-- Set default for future inserts
ALTER TABLE "invoices"
  ALTER COLUMN "letter" SET DEFAULT 'B';

-- ─── Add FK for salePointId ───────────────────────────────────────────────────

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_salePointId_fkey"
    FOREIGN KEY ("salePointId") REFERENCES "sale_points"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Drop old unique constraint and add new one including letter ──────────────

ALTER TABLE "invoices"
  DROP CONSTRAINT IF EXISTS "invoices_agencyId_salePoint_type_number_key";

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_agencyId_salePoint_letter_type_number_key"
    UNIQUE ("agencyId", "salePoint", "letter", "type", "number");
