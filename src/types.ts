export interface CarbonCategoryBreakdown {
  transportation: number; // in kg CO2
  energy: number;         // in kg CO2
  food: number;           // in kg CO2
  lifestyle: number;      // in kg CO2
}

export interface CarbonLog {
  id: string;
  date: string; // YYYY-MM-DD
  breakdown: CarbonCategoryBreakdown;
  totalCO2: number; // Sum of categories
  notes?: string;
  transportDetails?: {
    miles: number;
    vehicleType: string; // 'none' | 'electric' | 'hybrid' | 'petrol' | 'diesel' | 'transit' | 'active'
  };
  energyDetails?: {
    electricitykWh: number;
    gasUsage: number; // therms or generic units
  };
  foodDetails?: {
    beefServings: number;
    porkPoultryServings: number;
    vegServings: number;
  };
  lifestyleDetails?: {
    shoppingItems: number; // count of non-essential items
    recycledAll: boolean;
  };
}

export interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  category: 'transportation' | 'energy' | 'food' | 'lifestyle';
  co2Saving: number; // estimated kg CO2 saved
  points: number;
  completed: boolean;
  completedDate?: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  joinedDate: string;
  ecoPoints: number;
  totalSavedCO2: number; // in kg CO2
  dailyStreak: number;
  weeklyTarget: number; // target Daily footprint, default e.g. 8 kg
  photoURL?: string;
}

export interface EcoTip {
  text: string;
  category?: string;
}
