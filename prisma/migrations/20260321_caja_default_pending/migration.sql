-- Fix: DailyCash default status OPEN → PENDING
ALTER TABLE daily_cashes ALTER COLUMN status SET DEFAULT 'PENDING';
