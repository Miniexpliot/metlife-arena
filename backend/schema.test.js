import { describe, it, expect } from 'vitest';
import { stadiumDataSchema } from './schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('stadiumDataSchema', () => {
  it('should successfully validate the actual stadium_data.json', () => {
    const dataPath = path.join(__dirname, 'stadium_data.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // This should not throw
    const parsedData = stadiumDataSchema.parse(rawData);
    expect(parsedData).toBeDefined();
    expect(parsedData.stadiumName).toBe('MetLife Stadium');
  });

  it('should fail validation if a sector references a non-existent gate', () => {
    const malformedData = {
      stadiumName: 'Test Stadium',
      sectors: [
        {
          id: 'Sector 1',
          description: { en: 'Test' },
          gates: ['Ghost Gate'],
        }
      ],
      gateStatus: {
        'Real Gate': { status: 'Open' }
      },
      emergencyInfo: {
        emergencyNumber: '911'
      }
    };

    expect(() => stadiumDataSchema.parse(malformedData)).toThrow(/Integrity Error: A sector references a non-existent gate/);
  });

  it('should fail if waitTimeMinutes is negative', () => {
    const malformedData = {
      stadiumName: 'Test Stadium',
      sectors: [
        {
          id: 'Sector 1',
          description: { en: 'Test' },
          gates: ['Real Gate'],
          concessions: [
            {
              name: 'Test Food',
              location: 'Section 1',
              cuisine: 'Test',
              menu: ['Food ($5)'],
              waitTimeMinutes: -5, // Invalid
              crowdStatus: 'Low'
            }
          ]
        }
      ],
      gateStatus: {
        'Real Gate': { status: 'Open' }
      },
      emergencyInfo: {
        emergencyNumber: '911'
      }
    };

    expect(() => stadiumDataSchema.parse(malformedData)).toThrow();
  });
});
