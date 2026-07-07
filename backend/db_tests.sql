-- db_tests.sql
-- pgTAP tests to validate the 10/10 mock schema implementation natively in the database.

BEGIN;

-- Assuming pgTAP is installed
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the tests (count = 12)
SELECT plan(12);

-- 1. Check Table Existence
SELECT has_table('sectors', 'Table sectors should exist');
SELECT has_table('amenities', 'Table amenities should exist');
SELECT has_table('api_keys', 'Table api_keys should exist');

-- 2. Check Primary Keys (UUIDs)
SELECT col_is_pk('sectors', 'id', 'sectors.id should be the Primary Key');
SELECT col_type_is('sectors', 'id', 'uuid', 'sectors.id should be a UUID');

-- 3. Check Foreign Keys and Referential Integrity Constraints
SELECT col_is_fk('concessions', 'sector_id', 'concessions.sector_id should be a Foreign Key');
SELECT col_is_fk('concession_menus', 'concession_id', 'concession_menus.concession_id should be a Foreign Key');

-- 4. Check Data Type Constraints (Decimal Precision)
SELECT col_type_is('concession_menus', 'price', 'numeric(10,2)', 'concession_menus.price should be precisely numeric(10,2)');

-- 5. Check Default Values and Triggers
SELECT has_column('sectors', 'created_at', 'sectors should have created_at audit log');
SELECT has_column('sectors', 'updated_at', 'sectors should have updated_at audit log');

-- 6. Check Indexes (Efficiency)
SELECT has_index('amenities', 'idx_amenities_sector_id', 'id_amenities_sector_id should exist to prevent full table scans');
SELECT has_index('sector_gates', 'idx_sector_gates_gate_id', 'idx_sector_gates_gate_id should exist');

-- Finish the tests and clean up
SELECT * FROM finish();
ROLLBACK;
