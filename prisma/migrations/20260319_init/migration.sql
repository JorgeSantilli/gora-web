-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR_ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('ENTRADA', 'SALIDA', 'CENA_SHOW', 'CONEXION', 'ASISTENCIA');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('AEREO', 'TERRESTRE', 'FLUVIAL_MARITIMO');

-- CreateEnum
CREATE TYPE "TaxPosition" AS ENUM ('RI', 'MO', 'CF', 'EX', 'NC');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CANCELLED', 'INVOICED', 'VOUCHERS_ISSUED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('PESOS', 'USD');

-- CreateEnum
CREATE TYPE "PassengerType" AS ENUM ('ADULT', 'CHILD', 'INFANT');

-- CreateEnum
CREATE TYPE "VatConcept" AS ENUM ('GRAVADO', 'GRAVADO_TRANSPORTE', 'NO_COMPUTABLE', 'EXENTO', 'IMPUESTOS');

-- CreateEnum
CREATE TYPE "CostServiceType" AS ENUM ('HOTEL', 'MEAL', 'EXCURSION', 'TRANSFER', 'TICKET', 'RENTAL', 'MISC');

-- CreateEnum
CREATE TYPE "ProgramMedium" AS ENUM ('SIN_TRANSPORTE', 'CON_BUS', 'CON_AEREO');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('FA', 'ND', 'NC');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'CHEQUES', 'MIXTO');

-- CreateEnum
CREATE TYPE "DailyCashStatus" AS ENUM ('PENDING', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "AccountMovType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "taxId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_provider_types" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_provider_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_origins" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "includeExcursion" BOOLEAN NOT NULL DEFAULT false,
    "includeTransfer" BOOLEAN NOT NULL DEFAULT false,
    "isForeign" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_types" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "client_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pension_regimes" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,

    CONSTRAINT "pension_regimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isVoucherComplement" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_types" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "food_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursion_codes" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isLocal" BOOLEAN NOT NULL DEFAULT true,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isFullDay" BOOLEAN NOT NULL DEFAULT false,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "days" TEXT,
    "activity" TEXT,
    "locality" TEXT,
    "distance" TEXT,
    "duration" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "excursion_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursion_hotel_orders" (
    "id" TEXT NOT NULL,
    "excursionCodeId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "excursion_hotel_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_segments" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isLocal" BOOLEAN NOT NULL DEFAULT true,
    "type" "TransferType" NOT NULL DEFAULT 'ENTRADA',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transfer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_segments" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'AEREO',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ticket_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_types" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isBilingual" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "guide_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_texts" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "providerId" TEXT,
    "chargedTo" TEXT,

    CONSTRAINT "voucher_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_origins" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "clientId" TEXT,
    "autoNumber" BOOLEAN NOT NULL DEFAULT true,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reservation_origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "legalName" TEXT,
    "clientTypeId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zone" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "taxPosition" "TaxPosition",
    "isDirect" BOOLEAN NOT NULL DEFAULT false,
    "hasCreditAccount" BOOLEAN NOT NULL DEFAULT false,
    "creditLimit" DECIMAL(12,2),
    "creditLimitUsd" DECIMAL(12,2),
    "commission" DECIMAL(5,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "fantasyName" TEXT NOT NULL,
    "legalName" TEXT,
    "typeId" TEXT,
    "originId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "taxPosition" "TaxPosition",
    "category" TEXT,
    "isSupplier" BOOLEAN NOT NULL DEFAULT false,
    "sendVoucherByEmail" BOOLEAN NOT NULL DEFAULT false,
    "additionalInfo" TEXT,
    "creditLimit" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isFixedBase" BOOLEAN NOT NULL DEFAULT true,
    "days" INTEGER,
    "nights" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_hotels" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "regime" TEXT,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "program_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_meals" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "foodTypeId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "program_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_excursions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "excursionCodeId" TEXT,

    CONSTRAINT "program_excursions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_transfers" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "transferSegmentId" TEXT,

    CONSTRAINT "program_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_tickets" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "ticketSegmentId" TEXT,

    CONSTRAINT "program_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_rentals" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "program_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_miscs" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "program_miscs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT,
    "programId" TEXT,
    "programCode" INTEGER,
    "status" "ReservationStatus" NOT NULL DEFAULT 'TENTATIVE',
    "leadPax" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "minors" INTEGER NOT NULL DEFAULT 0,
    "free" INTEGER NOT NULL DEFAULT 0,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "inMedium" TEXT,
    "inTime" TEXT,
    "outMedium" TEXT,
    "outTime" TEXT,
    "expiresAt" TIMESTAMP(3),
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "commission" DECIMAL(5,2),
    "isFixedCommission" BOOLEAN NOT NULL DEFAULT true,
    "totalAmount" DECIMAL(12,2),
    "taxableAmount" DECIMAL(12,2),
    "nonComputedAmount" DECIMAL(12,2),
    "exemptAmount" DECIMAL(12,2),
    "transportTaxableAmount" DECIMAL(12,2),
    "vatGeneral" DECIMAL(12,2),
    "vatTransport" DECIMAL(12,2),
    "taxes" DECIMAL(12,2),
    "agencyCommissionAmount" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2),
    "totalInvoice" DECIMAL(12,2),
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_passengers" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "docType" TEXT,
    "docNumber" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "occupation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reservation_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_accommodations" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "regime" TEXT,
    "confirmedWith" TEXT,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "reservation_accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_rooms" (
    "id" TEXT NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "roomTypeId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isCommunicating" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reservation_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_meals" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "foodTypeId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantityPerPax" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3),

    CONSTRAINT "reservation_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_excursions" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "excursionCodeId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "pickupProviderId" TEXT,
    "pickupOther" TEXT,
    "guideType" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "paxCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reservation_excursions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_transfers" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "transferSegmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "medium" TEXT,
    "pickupProviderId" TEXT,
    "pickupOther" TEXT,
    "guideType" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "paxCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reservation_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_tickets" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "ticketSegmentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "passengerName" TEXT,
    "passengerType" "PassengerType" NOT NULL DEFAULT 'ADULT',
    "ticketNumber" TEXT,
    "issuedAt" TIMESTAMP(3),

    CONSTRAINT "reservation_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_rentals" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "vehicleDesc" TEXT,
    "pickupAt" TIMESTAMP(3),
    "pickupTime" TEXT,
    "pickupPlace" TEXT,
    "pickupMedium" TEXT,
    "dropoffAt" TIMESTAMP(3),
    "dropoffTime" TEXT,
    "dropoffPlace" TEXT,
    "dropoffMedium" TEXT,

    CONSTRAINT "reservation_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_miscs" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vatType" "VatConcept" NOT NULL DEFAULT 'GRAVADO',

    CONSTRAINT "reservation_miscs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "serviceType" "CostServiceType" NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "serviceType" "CostServiceType" NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_tariffs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "medium" "ProgramMedium" NOT NULL DEFAULT 'SIN_TRANSPORTE',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "transportTaxable" DECIMAL(12,2),
    "exempt" DECIMAL(12,2),
    "taxes" DECIMAL(12,2),
    "details" JSONB NOT NULL,

    CONSTRAINT "program_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'FA',
    "salePoint" INTEGER NOT NULL DEFAULT 1,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "exchangeRate" DECIMAL(10,4),
    "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transportTaxable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nonComputed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "exempt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatGeneral" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatTransport" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "voidedAt" TIMESTAMP(3),
    "creditNoteFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vatConcept" "VatConcept" NOT NULL DEFAULT 'GRAVADO',
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "exchangeRate" DECIMAL(10,4),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "cashAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "checkAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "origin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "exchangeRate" DECIMAL(10,4),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'EFECTIVO',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "cashAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "checkAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "concept" TEXT,
    "origin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_order_items" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',

    CONSTRAINT "payment_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "bank" TEXT,
    "accountNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "deferredDate" TIMESTAMP(3),
    "drawer" TEXT,
    "beneficiary" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "isOwn" BOOLEAN NOT NULL DEFAULT false,
    "inPortfolio" BOOLEAN NOT NULL DEFAULT true,
    "receivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "receiptId" TEXT,
    "paymentOrderId" TEXT,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_bills" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "serialNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "clientId" TEXT,
    "deliveredBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receiptId" TEXT,

    CONSTRAINT "currency_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_cashes" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "number" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "status" "DailyCashStatus" NOT NULL DEFAULT 'OPEN',
    "totalIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalOut" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_cashes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "dailyCashId" TEXT NOT NULL,
    "direction" "CashDirection" NOT NULL,
    "origin" TEXT NOT NULL,
    "voucherType" TEXT NOT NULL,
    "voucherNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "accountEntry" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "providerId" TEXT,
    "providerName" TEXT,
    "providerTaxId" TEXT,
    "providerTaxPos" "TaxPosition",
    "providerAddress" TEXT,
    "type" "InvoiceType" NOT NULL DEFAULT 'FA',
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "exchangeRate" DECIMAL(10,4),
    "taxable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nonComputed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "exempt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_account_movements" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reservationId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AccountMovType" NOT NULL,
    "voucherType" TEXT NOT NULL,
    "voucherNumber" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "receiptId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_account_movements" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reservationId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AccountMovType" NOT NULL,
    "voucherType" TEXT NOT NULL,
    "voucherNumber" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'PESOS',
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_account_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT,
    "isOwn" BOOLEAN NOT NULL DEFAULT true,
    "plate" TEXT,
    "internalCode" TEXT,
    "seats" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_expiries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "alertDays" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "vehicle_expiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "docType" TEXT,
    "docNumber" TEXT,
    "gender" TEXT,
    "isOwn" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_expiries" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "alertDays" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "driver_expiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "docType" TEXT,
    "docNumber" TEXT,
    "gender" TEXT,
    "languages" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_companies" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "authNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "agencyLink" TEXT,
    "fileNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transport_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_transfers" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TransferType" NOT NULL,

    CONSTRAINT "daily_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_excursions" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "excursionCodeId" TEXT,
    "time" TEXT,
    "comments" TEXT,

    CONSTRAINT "daily_excursions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_excursion_vehicles" (
    "id" TEXT NOT NULL,
    "dailyExcursionId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "guideId" TEXT,
    "transportCompanyId" TEXT,
    "copies" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "daily_excursion_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "service_provider_types_agencyId_code_key" ON "service_provider_types"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "provider_origins_agencyId_code_key" ON "provider_origins"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "client_types_agencyId_code_key" ON "client_types"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "pension_regimes_agencyId_code_key" ON "pension_regimes"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_agencyId_code_key" ON "room_types"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "food_types_agencyId_code_key" ON "food_types"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "excursion_codes_agencyId_code_key" ON "excursion_codes"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "excursion_hotel_orders_excursionCodeId_order_key" ON "excursion_hotel_orders"("excursionCodeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_segments_agencyId_code_key" ON "transfer_segments"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_segments_agencyId_code_key" ON "ticket_segments"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "guide_types_agencyId_code_key" ON "guide_types"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_texts_agencyId_code_key" ON "voucher_texts"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_origins_agencyId_letter_key" ON "reservation_origins"("agencyId", "letter");

-- CreateIndex
CREATE UNIQUE INDEX "clients_agencyId_code_key" ON "clients"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "providers_agencyId_code_key" ON "providers"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "programs_agencyId_code_key" ON "programs"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_agencyId_origin_number_key" ON "reservations"("agencyId", "origin", "number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_agencyId_salePoint_type_number_key" ON "invoices"("agencyId", "salePoint", "type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "daily_cashes_agencyId_date_currency_key" ON "daily_cashes"("agencyId", "date", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_agencyId_code_key" ON "vehicles"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_agencyId_code_key" ON "drivers"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "guides_agencyId_code_key" ON "guides"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "transport_companies_agencyId_code_key" ON "transport_companies"("agencyId", "code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_provider_types" ADD CONSTRAINT "service_provider_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_origins" ADD CONSTRAINT "provider_origins_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_types" ADD CONSTRAINT "client_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pension_regimes" ADD CONSTRAINT "pension_regimes_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_types" ADD CONSTRAINT "food_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursion_codes" ADD CONSTRAINT "excursion_codes_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursion_hotel_orders" ADD CONSTRAINT "excursion_hotel_orders_excursionCodeId_fkey" FOREIGN KEY ("excursionCodeId") REFERENCES "excursion_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursion_hotel_orders" ADD CONSTRAINT "excursion_hotel_orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_segments" ADD CONSTRAINT "transfer_segments_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_segments" ADD CONSTRAINT "ticket_segments_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_types" ADD CONSTRAINT "guide_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_texts" ADD CONSTRAINT "voucher_texts_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_texts" ADD CONSTRAINT "voucher_texts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_origins" ADD CONSTRAINT "reservation_origins_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_origins" ADD CONSTRAINT "reservation_origins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_clientTypeId_fkey" FOREIGN KEY ("clientTypeId") REFERENCES "client_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "service_provider_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_originId_fkey" FOREIGN KEY ("originId") REFERENCES "provider_origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hotels" ADD CONSTRAINT "program_hotels_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_hotels" ADD CONSTRAINT "program_hotels_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_meals" ADD CONSTRAINT "program_meals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_meals" ADD CONSTRAINT "program_meals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_excursions" ADD CONSTRAINT "program_excursions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_excursions" ADD CONSTRAINT "program_excursions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_transfers" ADD CONSTRAINT "program_transfers_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_transfers" ADD CONSTRAINT "program_transfers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tickets" ADD CONSTRAINT "program_tickets_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tickets" ADD CONSTRAINT "program_tickets_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_rentals" ADD CONSTRAINT "program_rentals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_rentals" ADD CONSTRAINT "program_rentals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_miscs" ADD CONSTRAINT "program_miscs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_miscs" ADD CONSTRAINT "program_miscs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_passengers" ADD CONSTRAINT "reservation_passengers_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_accommodations" ADD CONSTRAINT "reservation_accommodations_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_accommodations" ADD CONSTRAINT "reservation_accommodations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_rooms" ADD CONSTRAINT "reservation_rooms_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "reservation_accommodations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_meals" ADD CONSTRAINT "reservation_meals_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_meals" ADD CONSTRAINT "reservation_meals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_excursions" ADD CONSTRAINT "reservation_excursions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_excursions" ADD CONSTRAINT "reservation_excursions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_transfers" ADD CONSTRAINT "reservation_transfers_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_transfers" ADD CONSTRAINT "reservation_transfers_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_tickets" ADD CONSTRAINT "reservation_tickets_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_tickets" ADD CONSTRAINT "reservation_tickets_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_rentals" ADD CONSTRAINT "reservation_rentals_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_rentals" ADD CONSTRAINT "reservation_rentals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_miscs" ADD CONSTRAINT "reservation_miscs_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_miscs" ADD CONSTRAINT "reservation_miscs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tariffs" ADD CONSTRAINT "program_tariffs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tariffs" ADD CONSTRAINT "program_tariffs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order_items" ADD CONSTRAINT "payment_order_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_bills" ADD CONSTRAINT "currency_bills_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_bills" ADD CONSTRAINT "currency_bills_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_cashes" ADD CONSTRAINT "daily_cashes_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_dailyCashId_fkey" FOREIGN KEY ("dailyCashId") REFERENCES "daily_cashes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account_movements" ADD CONSTRAINT "client_account_movements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_account_movements" ADD CONSTRAINT "client_account_movements_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_account_movements" ADD CONSTRAINT "provider_account_movements_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_account_movements" ADD CONSTRAINT "provider_account_movements_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_expiries" ADD CONSTRAINT "vehicle_expiries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_expiries" ADD CONSTRAINT "driver_expiries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_companies" ADD CONSTRAINT "transport_companies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_transfers" ADD CONSTRAINT "daily_transfers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_excursions" ADD CONSTRAINT "daily_excursions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_excursion_vehicles" ADD CONSTRAINT "daily_excursion_vehicles_dailyExcursionId_fkey" FOREIGN KEY ("dailyExcursionId") REFERENCES "daily_excursions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_excursion_vehicles" ADD CONSTRAINT "daily_excursion_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_excursion_vehicles" ADD CONSTRAINT "daily_excursion_vehicles_transportCompanyId_fkey" FOREIGN KEY ("transportCompanyId") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

