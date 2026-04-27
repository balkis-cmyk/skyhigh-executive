import type { DoctrineId } from "@/types/game";

export interface Doctrine {
  id: DoctrineId;
  icon: string;
  name: string;
  tagline: string;
  description: string;
  effects: string[];
}

type VisibleDoctrineId = Exclude<DoctrineId, "safety-first">;

export const DOCTRINES: Array<Doctrine & { id: VisibleDoctrineId }> = [
  {
    id: "budget-expansion",
    icon: "↘",
    name: "Budget Airline",
    tagline: "Fast turns, lean costs, wider reach.",
    description:
      "Build around access and efficiency. You reach more price-sensitive travelers through Tier 2 and Tier 3 airports, but downturns hit harder.",
    effects: [
      "+20% T2/T3 demand pool",
      "-20% staff cost",
      "-10% maintenance",
      "Half ground time",
      "Negative demand shocks hit 1.5x",
    ],
  },
  {
    id: "premium-service",
    icon: "★",
    name: "Premium Airline",
    tagline: "Protect yield and loyalty.",
    description:
      "Compete on service, brand trust, and cabin quality. You can price above the market and recover loyalty faster, with a heavier people-cost base.",
    effects: [
      "+20% fare ceiling",
      "1.5x positive loyalty gains",
      "Negative demand shocks halved",
      "+15% staff cost",
    ],
  },
  {
    id: "cargo-dominance",
    icon: "☐",
    name: "Cargo Dominance",
    tagline: "Make the network move freight.",
    description:
      "Use every connection as a logistics corridor. Cargo capacity and cargo turnarounds improve, while connected cities compound freight demand.",
    effects: [
      "+20% cargo capacity",
      "2h cargo-fleet ground time",
      "No belly-cargo ground penalty",
      "+5% cargo demand per connected city, cap +25%",
    ],
  },
  {
    id: "global-network",
    icon: "◉",
    name: "Global Network Airline",
    tagline: "Connectivity compounds demand.",
    description:
      "Grow a connected international system. Passenger demand rises across linked cities and crises hurt less, but mixed fleet brands become more expensive to maintain.",
    effects: [
      "+5% passenger demand per connected city, cap +25%",
      "-30% crisis impact",
      "+20% Business/First preference",
      "+10% maintenance per fleet brand, cap +20%",
    ],
  },
];

const visibleDoctrines = DOCTRINES.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<Exclude<DoctrineId, "safety-first">, Doctrine>,
);

export const DOCTRINE_BY_ID: Record<DoctrineId, Doctrine> = {
  ...visibleDoctrines,
  "safety-first": {
    ...visibleDoctrines["global-network"],
    id: "safety-first",
  },
};
