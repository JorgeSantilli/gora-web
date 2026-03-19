-- GORA Turismo - Seed inicial
-- Ejecutar con: npx supabase db query --file prisma/seed.sql --linked

-- 1. Agencia GORA Turismo
INSERT INTO agencies (id, name, slug, "createdAt", "updatedAt")
VALUES ('agency_gora_001', 'GORA Turismo', 'gora', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Tipos de servicio de prestadores (code es INT)
INSERT INTO service_provider_types (id, "agencyId", code, name, active, "createdAt")
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 1,  'Hotel',        true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 2,  'Apart Hotel',  true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 3,  'Cabañas',      true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 4,  'Camping',      true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 5,  'Hostería',     true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 6,  'Restaurant',   true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 7,  'Excursión',    true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 8,  'Traslado',     true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 9,  'Transporte',   true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 10, 'Aéreo',        true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 11, 'Varios',       true, NOW())
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 3. Orígenes de prestadores (code es STRING)
INSERT INTO provider_origins (id, "agencyId", code, name, "includeExcursion", "includeTransfer", "isForeign", active, "createdAt")
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'NAC',   'Nacional',            false, false, false, true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 'INT',   'Internacional',       false, false, true,  true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 'CUYO',  'Regional Cuyo',       false, false, false, true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 'PAT',   'Regional Patagonia',  false, false, false, true, NOW()),
  (gen_random_uuid()::text, 'agency_gora_001', 'NOA',   'Regional NOA',        false, false, false, true, NOW())
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 4. Tipos de cliente (code es INT)
INSERT INTO client_types (id, "agencyId", code, name, active)
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 1, 'Mayorista',    true),
  (gen_random_uuid()::text, 'agency_gora_001', 2, 'Minorista',    true),
  (gen_random_uuid()::text, 'agency_gora_001', 3, 'Empresa',      true),
  (gen_random_uuid()::text, 'agency_gora_001', 4, 'Particular',   true),
  (gen_random_uuid()::text, 'agency_gora_001', 5, 'Escuela',      true),
  (gen_random_uuid()::text, 'agency_gora_001', 6, 'ONG',          true)
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 5. Regímenes de pensión (code STRING, con abbreviation)
INSERT INTO pension_regimes (id, "agencyId", code, name, abbreviation)
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'SA',  'Sin Alojamiento',       'SA'),
  (gen_random_uuid()::text, 'agency_gora_001', 'AD',  'Alojamiento y Desayuno','AD'),
  (gen_random_uuid()::text, 'agency_gora_001', 'MP',  'Media Pensión',         'MP'),
  (gen_random_uuid()::text, 'agency_gora_001', 'PC',  'Pensión Completa',      'PC'),
  (gen_random_uuid()::text, 'agency_gora_001', 'TI',  'Todo Incluido',         'TI'),
  (gen_random_uuid()::text, 'agency_gora_001', 'AL',  'Solo Alojamiento',      'AL')
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 6. Tipos de habitación (code STRING, con abbreviation, capacity)
INSERT INTO room_types (id, "agencyId", code, name, abbreviation, capacity, "isVoucherComplement", active)
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'SGL',   'Single',          'SGL',  1, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'DBL',   'Doble',           'DBL',  2, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'DBLM',  'Doble Matrimonial','DBLM',2, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'TPL',   'Triple',          'TPL',  3, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'CUAD',  'Cuádruple',       'CUAD', 4, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'SUITE', 'Suite',           'STE',  2, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'DPTO',  'Departamento',    'DPTO', 4, false, true),
  (gen_random_uuid()::text, 'agency_gora_001', 'CUNA',  'Cuna',            'CNA',  1, true,  true)
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 7. Tipos de comida (code STRING)
INSERT INTO food_types (id, "agencyId", code, name, active)
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'ALM', 'Almuerzo',        true),
  (gen_random_uuid()::text, 'agency_gora_001', 'CEN', 'Cena',            true),
  (gen_random_uuid()::text, 'agency_gora_001', 'DES', 'Desayuno',        true),
  (gen_random_uuid()::text, 'agency_gora_001', 'MER', 'Merienda',        true),
  (gen_random_uuid()::text, 'agency_gora_001', 'BOX', 'Box Lunch',       true)
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 8. Tipos de guía (code STRING, con isBilingual)
INSERT INTO guide_types (id, "agencyId", code, name, "isBilingual")
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'LOC', 'Local',       false),
  (gen_random_uuid()::text, 'agency_gora_001', 'NAC', 'Nacional',    false),
  (gen_random_uuid()::text, 'agency_gora_001', 'BIL', 'Bilingüe',    true),
  (gen_random_uuid()::text, 'agency_gora_001', 'ESP', 'Especializado',false)
ON CONFLICT ("agencyId", code) DO NOTHING;

-- 9. Orígenes de reservas (usa 'letter' y 'label', no code/name)
INSERT INTO reservation_origins (id, "agencyId", letter, label, "autoNumber", "lastNumber")
VALUES
  (gen_random_uuid()::text, 'agency_gora_001', 'M', 'Mendoza',         true, 67905),
  (gen_random_uuid()::text, 'agency_gora_001', 'B', 'Buenos Aires',    true, 0),
  (gen_random_uuid()::text, 'agency_gora_001', 'S', 'San Juan',        true, 0),
  (gen_random_uuid()::text, 'agency_gora_001', 'C', 'Córdoba',         true, 0),
  (gen_random_uuid()::text, 'agency_gora_001', 'R', 'Receptivo',       true, 0),
  (gen_random_uuid()::text, 'agency_gora_001', 'E', 'Email / Online',  true, 0)
ON CONFLICT ("agencyId", letter) DO NOTHING;

-- 10. Prestadores de ejemplo (datos reales GORA Mendoza)
-- code es INT, fantasyName no es name
INSERT INTO providers (id, "agencyId", code, "fantasyName", "typeId", city, "taxPosition", "isSupplier", active, "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'agency_gora_001',
  p.code,
  p.fantasy,
  spt.id,
  p.city,
  p."taxPos"::"TaxPosition",
  false,
  true,
  NOW(),
  NOW()
FROM (VALUES
  (1,  'Hotel Aconcagua',            'Hotel',     'Mendoza',      'RI'),
  (2,  'Hotel Huentala',             'Hotel',     'Mendoza',      'RI'),
  (3,  'Hotel Nutibara',             'Hotel',     'Mendoza',      'RI'),
  (4,  'Apart Los Andes',            'Apart Hotel','Mendoza',     'RI'),
  (5,  'Wines & Travels',            'Excursión', 'Mendoza',      'MO'),
  (6,  'Bodegas de Mendoza Tours',   'Excursión', 'Mendoza',      'MO'),
  (7,  'Mendoza Bus',                'Traslado',  'Mendoza',      'RI'),
  (8,  'Restaurant El Parrillón',    'Restaurant','Mendoza',      'CF'),
  (9,  'Ski Penitentes',             'Excursión', 'Malargüe',     'RI'),
  (10, 'Aerolíneas Argentinas',      'Aéreo',     'Buenos Aires', 'RI')
) AS p(code, fantasy, type, city, "taxPos")
JOIN service_provider_types spt ON spt."agencyId" = 'agency_gora_001' AND spt.name = p.type
ON CONFLICT ("agencyId", code) DO NOTHING;

-- Verificar resultados
SELECT 'service_provider_types' as tabla, count(*)::text as total FROM service_provider_types WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'provider_origins', count(*)::text FROM provider_origins WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'client_types', count(*)::text FROM client_types WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'pension_regimes', count(*)::text FROM pension_regimes WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'room_types', count(*)::text FROM room_types WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'food_types', count(*)::text FROM food_types WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'guide_types', count(*)::text FROM guide_types WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'reservation_origins', count(*)::text FROM reservation_origins WHERE "agencyId"='agency_gora_001'
UNION ALL SELECT 'providers', count(*)::text FROM providers WHERE "agencyId"='agency_gora_001';
