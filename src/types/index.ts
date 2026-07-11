export interface Restroom {
  name: string;
  location: string;
  types: string[];
  waitTimeMinutes: number;
  crowdStatus: string;
}

export interface Concession {
  name: string;
  location: string;
  cuisine: string;
  menu: string[];
  vegetarianOptions: string[];
  veganOptions: string[];
  glutenFreeOptions: string[];
  waitTimeMinutes: number;
  crowdStatus: string;
}

export interface Amenity {
  name: string;
  type: string;
  location: string;
  status: string;
  details: string;
}

export interface Sector {
  id: string;
  description: {
    en: string;
    [key: string]: string;
  };
  gates: string[];
  amenities: Amenity[];
  concessions: Concession[];
  restrooms: Restroom[];
}

export interface GateInfo {
  status: string;
  securityWaitMinutes: number;
  crowdDensity: string;
}

/** Parking lot information for transportation guidance */
export interface ParkingLot {
  name: string;
  type: string;
  capacity: number;
  currentOccupancy: string;
  priceUSD: number;
  nearestGate: string;
  walkTimeMinutes: number;
  evCharging: boolean;
  accessible: boolean;
  status: string;
}

/** Public transit route (rail or bus) */
export interface TransitRoute {
  name: string;
  type: string;
  station?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  walkTimeToStadiumMinutes: number;
  frequency: string;
  operatingHours?: string;
  fareUSD: number;
  accessible: boolean;
  notes: string;
}

/** Shuttle bus service */
export interface ShuttleBus {
  name: string;
  pickupLocation: string;
  dropoffLocation: string;
  frequency: string;
  operatingHours: string;
  fareUSD: number;
  accessible: boolean;
  status: string;
}

/** Rideshare information */
export interface RideshareInfo {
  designatedPickupZone: string;
  nearestGate: string;
  walkTimeMinutes: number;
  surgeStatus: string;
  providers: string[];
  tips: string;
}

/** Complete transportation data covering parking, transit, shuttles, and rideshare */
export interface TransportationInfo {
  parking: ParkingLot[];
  publicTransit: TransitRoute[];
  shuttleBuses: ShuttleBus[];
  rideshare: RideshareInfo;
}

/** Recycling station */
export interface RecyclingStation {
  name: string;
  location: string;
  acceptedMaterials: string[];
  status: string;
}

/** Water refill station */
export interface WaterRefillStation {
  name: string;
  location: string;
  type: string;
  status: string;
}

/** Carbon offset program info */
export interface CarbonOffsetProgram {
  name: string;
  description: string;
  treesPlantedSoFar: number;
  goalTrees: number;
}

/** Complete sustainability data covering recycling, water, and eco-initiatives */
export interface SustainabilityInfo {
  overview: string;
  recyclingStations: RecyclingStation[];
  waterRefillStations: WaterRefillStation[];
  ecoInitiatives: string[];
  carbonOffsetProgram: CarbonOffsetProgram;
}

export interface StadiumData {
  stadiumName: string;
  sectors: Sector[];
  gateStatus: { [key: string]: GateInfo };
  emergencyInfo: {
    emergencyNumber: string;
    evacuationAssemblyPoints: string;
    rules: string[];
  };
  /** Transportation data: parking, public transit, shuttles, rideshare */
  transportation: TransportationInfo;
  /** Sustainability data: recycling stations, water refill, eco-initiatives */
  sustainability: SustainabilityInfo;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
