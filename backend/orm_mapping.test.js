import { describe, it, expect } from 'vitest';
import { toCamelCase, toSnakeCase, mapRowToCamelCase, mapPayloadToSnakeCase } from './orm_mapping.js';

describe('ORM Mapping Layer', () => {
  it('toCamelCase converts snake_case to camelCase', () => {
    expect(toCamelCase('wait_time_minutes')).toBe('waitTimeMinutes');
    expect(toCamelCase('id')).toBe('id');
    expect(toCamelCase('crowd_status')).toBe('crowdStatus');
  });

  it('toSnakeCase converts camelCase to snake_case', () => {
    expect(toSnakeCase('waitTimeMinutes')).toBe('wait_time_minutes');
    expect(toSnakeCase('crowdStatus')).toBe('crowd_status');
    expect(toSnakeCase('id')).toBe('id');
  });

  it('mapRowToCamelCase recursively maps nested objects', () => {
    const dbRow = { sector_id: '123', wait_time_minutes: 15, nested: { crowd_status: 'Low' } };
    const result = mapRowToCamelCase(dbRow);
    expect(result.sectorId).toBe('123');
    expect(result.waitTimeMinutes).toBe(15);
    expect(result.nested.crowdStatus).toBe('Low');
  });

  it('mapRowToCamelCase handles arrays', () => {
    const rows = [{ sector_id: '1' }, { sector_id: '2' }];
    const result = mapRowToCamelCase(rows);
    expect(result[0].sectorId).toBe('1');
    expect(result[1].sectorId).toBe('2');
  });

  it('mapPayloadToSnakeCase converts camelCase payload', () => {
    const payload = { waitTimeMinutes: 15, crowdStatus: 'Low' };
    const result = mapPayloadToSnakeCase(payload);
    expect(result.wait_time_minutes).toBe(15);
    expect(result.crowd_status).toBe('Low');
  });

  it('handles null and primitive values without crashing', () => {
    expect(mapRowToCamelCase(null)).toBeNull();
    expect(mapRowToCamelCase(42)).toBe(42);
    expect(mapPayloadToSnakeCase(null)).toBeNull();
    expect(mapPayloadToSnakeCase('hello')).toBe('hello');
  });
});
