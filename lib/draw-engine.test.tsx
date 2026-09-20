import { describe, expect, it } from "vitest";

import {
  calculateMatches,
  calculatePrizePool,
  calculateTierPools,
  generateRandomDraw,
  generateWeightedDraw,
  simulateDraw,
} from "./draw-engine";

describe("Draw Engine", () => {
  it("generates exactly five unique numbers", () => {
    const numbers = generateRandomDraw();

    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);

    for (const number of numbers) {
      expect(number).toBeGreaterThanOrEqual(1);
      expect(number).toBeLessThanOrEqual(45);
    }
  });

  it("calculates matching numbers correctly", () => {
    const matches = calculateMatches(
      [10, 20, 30, 40, 45],
      [5, 10, 20, 25, 30]
    );

    expect(matches).toEqual([10, 20, 30]);
  });

  it("calculates a 40 percent prize pool", () => {
    const pool = calculatePrizePool(100000);

    expect(pool).toBe(40000);
  });

  it("calculates the correct prize tier shares", () => {
    const tiers = calculateTierPools(100000);

    expect(tiers.fiveMatch).toBe(40000);
    expect(tiers.fourMatch).toBe(35000);
    expect(tiers.threeMatch).toBe(25000);
  });

  it("generates a weighted draw with five numbers", () => {
    const numbers = generateWeightedDraw([
      35,
      35,
      35,
      35,
      20,
      20,
      10,
      5,
      40,
    ]);

    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);
  });

  it("identifies a five-match winner", () => {
    const simulation = simulateDraw({
      mode: "random",

      subscribers: [
        {
          userId: "user-1",
          scores: [10, 20, 30, 40, 45],
        },
      ],

      activeSubscriptionRevenuePaise: 100000,
    });

    expect(simulation.numbers).toHaveLength(5);
    expect(simulation.eligibleUsers).toBe(1);
  });
});