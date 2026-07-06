export interface Restroom {
  name: string;
  location: string;
  types: string[];
  wait_time_minutes: number;
  crowd_status: string;
}

export interface Concession {
  name: string;
  location: string;
  cuisine: string;
  menu: string[];
  vegetarian_options: string[];
  vegan_options: string[];
  gluten_free_options: string[];
  wait_time_minutes: number;
  crowd_status: string;
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
  description: string;
  gates: string[];
  amenities: Amenity[];
  concessions: Concession[];
  restrooms: Restroom[];
}

export interface GateInfo {
  status: string;
  security_wait_minutes: number;
  crowd_density: string;
}

export interface StadiumData {
  stadium_name: string;
  sectors: Sector[];
  gate_status: { [key: string]: GateInfo };
  emergency_info: {
    emergency_number: string;
    evacuation_assembly_points: string;
    rules: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
