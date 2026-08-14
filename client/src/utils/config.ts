export type Term = "short" | "long";

export interface ModulePriceConfig {
  moduleId: number;
  moduleName: string;
  prices: {
    short: number; // price per month
    long: number;  // price per month
  };
}

// Example configuration
export const modulePriceConfig: ModulePriceConfig[] = [
  {
    moduleId: 1,
    moduleName: "Virtual Inspect",
    prices: { short: 100, long: 250 },
  },
  {
    moduleId: 2,
    moduleName: "Accounting",
    prices: { short: 200, long: 450 },
  },
  {
    moduleId: 3,
    moduleName: "CRM",
    prices: { short: 150, long: 350 },
  },
  {
    moduleId: 4,
    moduleName: "Booking Engine",
    prices: { short: 150, long: 350 },
  },
  {
    moduleId: 5,
    moduleName: "OKR",
    prices: { short: 150, long: 350 },
  },
];
