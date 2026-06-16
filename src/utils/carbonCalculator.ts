import { CarbonCategoryBreakdown } from "../types";

// Conversion factors in kg CO2
export const FACTORS = {
  transport: {
    petrol: 0.411,    // kg CO2 per mile
    diesel: 0.385,    // kg CO2 per mile
    hybrid: 0.210,    // kg CO2 per mile
    electric: 0.085,  // kg CO2 per mile (based on grid intensity average)
    transit: 0.120,   // kg CO2 per passenger mile
    active: 0.0,      // Walking/Cycling
  },
  energy: {
    electricityKwh: 0.390, // kg CO2 per kWh
    gasTherm: 2.220,       // kg CO2 per heating unit/therm
  },
  food: {
    beefMeat: 3.400,       // kg CO2 per beef/lamb meal serving
    poultryPork: 1.200,    // kg CO2 per pork/poultry/fish serving
    vegetarian: 0.450,    // kg CO2 per vegetarian serving
    vegan: 0.180,         // kg CO2 per vegan serving
  },
  lifestyle: {
    newItemPurchase: 3.500, // kg CO2 per non-essential goods bought
    baselineWaste: 1.200,   // kg CO2 daily baseline trash waste
    recyclingCredit: -0.600 // Credit (subtracted) if user recycled fully today
  }
};

/**
 * Calculates the exact Carbon Category Breakdown in kg CO2 based on user inputs
 */
export function calculateCO2Breakdown(inputs: {
  miles: number;
  vehicleType: string;
  electricityKwh: number;
  gasUsage: number;
  beefServings: number;
  poultryPorkServings: number;
  vegServings: number;
  nonVegOrGeneralMeals: number; // For non-specified meals, defaults to medium
  shoppingItems: number;
  recycledAll: boolean;
}): CarbonCategoryBreakdown {
  // 1. Transportation
  const transFactor = FACTORS.transport[inputs.vehicleType as keyof typeof FACTORS.transport] ?? FACTORS.transport.active;
  const transportCO2 = inputs.miles * transFactor;

  // 2. Home Energy
  const electricityCO2 = inputs.electricityKwh * FACTORS.energy.electricityKwh;
  const gasCO2 = inputs.gasUsage * FACTORS.energy.gasTherm;
  const energyCO2 = electricityCO2 + gasCO2;

  // 3. Food
  // Assume a typical day has 3 main eating periods.
  // The rest of meals not logged are counted as average vegetarian/vegan or classic mixed dishes
  // Let the user specify precisely beef/pork/vegetarian/vegan items
  const beefCO2 = inputs.beefServings * FACTORS.food.beefMeat;
  const porkPoultryCO2 = inputs.poultryPorkServings * FACTORS.food.poultryPork;
  const vegCO2 = inputs.vegServings * FACTORS.food.vegetarian;
  
  // Remaining meals out of 3 can be calculated as baseline mixed/veg
  const totalLoggedMeals = inputs.beefServings + inputs.poultryPorkServings + inputs.vegServings;
  const defaultMeals = Math.max(0, 3 - totalLoggedMeals);
  const defaultMealsCO2 = defaultMeals * FACTORS.food.poultryPork * 0.7; // Moderate baseline

  const foodCO2 = beefCO2 + porkPoultryCO2 + vegCO2 + defaultMealsCO2;

  // 4. Lifestyle / Consumption
  const shoppingCO2 = inputs.shoppingItems * FACTORS.lifestyle.newItemPurchase;
  const wasteCO2 = FACTORS.lifestyle.baselineWaste + (inputs.recycledAll ? FACTORS.lifestyle.recyclingCredit : 0);
  const lifestyleCO2 = Math.max(0.1, shoppingCO2 + wasteCO2);

  return {
    transportation: parseFloat(transportCO2.toFixed(2)),
    energy: parseFloat(energyCO2.toFixed(2)),
    food: parseFloat(foodCO2.toFixed(2)),
    lifestyle: parseFloat(lifestyleCO2.toFixed(2)),
  };
}
