import type { DoctrineId } from "@/types/game";

export interface Doctrine {
  id: DoctrineId;
  icon: string;
  name: string;
  tagline: string;
  description: string;
  effects: string[];
}

export const DOCTRINES: Doctrine[] = [
  {
    id: "budget-expansion",
    icon: "↗",
    name: "Budget expansion",
    tagline: "Volume is victory.",
    description:
      "+20% demand, −15% fares. Build the biggest network fastest.",
    effects: ["+20% demand ceiling", "−15% base fares", "+2% Brand/Q early game"],
  },
  {
    id: "premium-service",
    icon: "★",
    name: "Premium service",
    tagline: "Every flight a first-class experience.",
    description: "+30% fares, +15% prestige growth. Charge what the brand is worth.",
    effects: ["+30% premium fares", "+15% Brand growth", "−10% demand ceiling"],
  },
  {
    id: "cargo-dominance",
    icon: "☐",
    name: "Cargo dominance",
    tagline: "Cargo never sleeps.",
    description:
      "+25% cargo revenue, crisis-hedge profile. Stable in downturns.",
    effects: ["+25% cargo revenue", "−20% demand volatility", "−5 Board in recession"],
  },
  {
    id: "safety-first",
    icon: "◉",
    name: "Safety first",
    tagline: "Zero incidents. Zero compromises.",
    description: "−20% crisis probability, +25% Safety Shield. Regulators trust you.",
    effects: ["−20% crisis probability", "+25% Ops Shield", "+10% operating cost"],
  },
];

export const DOCTRINE_BY_ID: Record<DoctrineId, Doctrine> = DOCTRINES.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<DoctrineId, Doctrine>,
);
