import { z } from 'zod';

export const stadiumDataSchema = z.object({
  _metadata: z.object({
    intent: z.string().optional(),
    schema_version: z.string().optional(),
    stealth_audit: z.string().optional()
  }).optional(),
  stadiumName: z.string(),
  sectors: z.array(
    z.object({
      id: z.string(),
      description: z.object({
        en: z.string(),
      }).catchall(z.string()),
      gates: z.array(z.string()),
      amenities: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          location: z.string(),
          status: z.string(),
          details: z.string()
        })
      ).optional(),
      concessions: z.array(
        z.object({
          name: z.string(),
          location: z.string(),
          cuisine: z.string(),
          menu: z.array(z.string()),
          vegetarianOptions: z.array(z.string()).optional(),
          veganOptions: z.array(z.string()).optional(),
          glutenFreeOptions: z.array(z.string()).optional(),
          waitTimeMinutes: z.number().min(0),
          crowdStatus: z.string()
        })
      ).optional(),
      restrooms: z.array(
        z.object({
          name: z.string(),
          location: z.string(),
          types: z.array(z.string()),
          waitTimeMinutes: z.number().min(0).optional(),
          crowdStatus: z.string().optional()
        })
      ).optional()
    })
  ),
  gateStatus: z.record(
    z.string(),
    z.object({
      status: z.string(),
      securityWaitMinutes: z.number().min(0).optional(),
      crowdDensity: z.string().optional()
    })
  ),
  emergencyInfo: z.object({
    emergencyNumber: z.string(),
    evacuationAssemblyPoints: z.string().optional(),
    rules: z.array(z.string()).optional()
  })
}).refine((data) => {
  // Foreign Key constraint: all sector gates must exist in gateStatus
  for (const sector of data.sectors) {
    for (const gate of sector.gates) {
      if (!data.gateStatus[gate]) {
        return false;
      }
    }
  }
  return true;
}, {
  message: "Integrity Error: A sector references a non-existent gate in gateStatus."
});
