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

export interface StadiumData {
  stadiumName: string;
  sectors: Sector[];
  gateStatus: { [key: string]: GateInfo };
  emergencyInfo: {
    emergencyNumber: string;
    evacuationAssemblyPoints: string;
    rules: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
