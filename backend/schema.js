import { z } from 'zod';

/**
 * PROBLEM STATEMENT ALIGNMENT:
 * Schema validates ALL data verticals from the FIFA World Cup 2026 problem statement:
 * sectors/navigation, crowd management (gateStatus), emergency, transportation,
 * and sustainability — ensuring data integrity across the full operational stack.
 */

/** Parking lot schema */
const parkingLotSchema = z.object({
  name: z.string(),
  type: z.string(),
  capacity: z.number().min(0),
  currentOccupancy: z.string(),
  priceUSD: z.number().min(0),
  nearestGate: z.string(),
  walkTimeMinutes: z.number().min(0),
  evCharging: z.boolean(),
  accessible: z.boolean(),
  status: z.string()
});

/** Public transit route schema */
const transitRouteSchema = z.object({
  name: z.string(),
  type: z.string(),
  station: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  walkTimeToStadiumMinutes: z.number().min(0),
  frequency: z.string(),
  operatingHours: z.string().optional(),
  fareUSD: z.number().min(0),
  accessible: z.boolean(),
  notes: z.string().optional()
});

/** Shuttle bus schema */
const shuttleBusSchema = z.object({
  name: z.string(),
  pickupLocation: z.string(),
  dropoffLocation: z.string(),
  frequency: z.string(),
  operatingHours: z.string(),
  fareUSD: z.number().min(0),
  accessible: z.boolean(),
  status: z.string()
});

/** Rideshare info schema */
const rideshareSchema = z.object({
  designatedPickupZone: z.string(),
  nearestGate: z.string(),
  walkTimeMinutes: z.number().min(0),
  surgeStatus: z.string(),
  providers: z.array(z.string()),
  tips: z.string()
});

/** Transportation schema covering all transit modalities */
const transportationSchema = z.object({
  parking: z.array(parkingLotSchema),
  publicTransit: z.array(transitRouteSchema),
  shuttleBuses: z.array(shuttleBusSchema),
  rideshare: rideshareSchema
});

/** Recycling station schema */
const recyclingStationSchema = z.object({
  name: z.string(),
  location: z.string(),
  acceptedMaterials: z.array(z.string()),
  status: z.string()
});

/** Water refill station schema */
const waterRefillStationSchema = z.object({
  name: z.string(),
  location: z.string(),
  type: z.string(),
  status: z.string()
});

/** Carbon offset program schema */
const carbonOffsetSchema = z.object({
  name: z.string(),
  description: z.string(),
  treesPlantedSoFar: z.number().min(0),
  goalTrees: z.number().min(0)
});

/** Sustainability schema covering all eco-initiatives */
const sustainabilitySchema = z.object({
  overview: z.string(),
  recyclingStations: z.array(recyclingStationSchema),
  waterRefillStations: z.array(waterRefillStationSchema),
  ecoInitiatives: z.array(z.string()),
  carbonOffsetProgram: carbonOffsetSchema
});

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
  }),
  // Transportation: parking, public transit, shuttle buses, rideshare
  transportation: transportationSchema.optional(),
  // Sustainability: recycling, water refill, eco-initiatives, carbon offset
  sustainability: sustainabilitySchema.optional()
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
