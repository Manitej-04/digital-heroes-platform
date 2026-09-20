// ============================================================
// DIGITAL HEROES - DRAW ENGINE
// ============================================================

export type DrawMode = "random" | "weighted";

export type DrawWinner = {
  userId: string;
  matchedNumbers: number[];
  matchCount: number;
  prizeTier: 3 | 4 | 5 | null;
  prizeAmountPaise: number;
};

export type DrawSimulation = {
  numbers: number[];
  eligibleUsers: number;

  // Total current draw prize pool.
  prizePoolPaise: number;

  // Individual prize pools.
  fiveMatchPoolPaise: number;
  fourMatchPoolPaise: number;
  threeMatchPoolPaise: number;

  // Amount carried from the previous draw.
  jackpotRolloverPaise: number;

  winners: DrawWinner[];
};

// ============================================================
// CONSTANTS
// ============================================================

export const MIN_DRAW_NUMBER = 1;
export const MAX_DRAW_NUMBER = 45;
export const DRAW_SIZE = 5;

// 40% of active subscription revenue goes into the prize pool.
export const PRIZE_POOL_PERCENT = 40;

// Prize pool distribution required by the PRD:
// 5-match = 40%
// 4-match = 35%
// 3-match = 25%
export const PRIZE_SHARES = {
  5: 40,
  4: 35,
  3: 25,
} as const;

// ============================================================
// NUMBER HELPERS
// ============================================================

function uniqueNumbers(numbers: number[]): number[] {
  return [...new Set(numbers)];
}

function randomNumber(): number {
  return (
    Math.floor(
      Math.random() *
        (MAX_DRAW_NUMBER - MIN_DRAW_NUMBER + 1)
    ) + MIN_DRAW_NUMBER
  );
}

// ============================================================
// RANDOM DRAW
// ============================================================

/**
 * Generates five unique numbers between 1 and 45.
 */
export function generateRandomDraw(): number[] {
  const numbers = new Set<number>();

  while (numbers.size < DRAW_SIZE) {
    numbers.add(randomNumber());
  }

  return [...numbers].sort((a, b) => a - b);
}

// ============================================================
// WEIGHTED DRAW
// ============================================================

/**
 * Generates a draw weighted by the frequency
 * of subscriber Stableford scores.
 *
 * Example:
 *
 * [35, 35, 35, 20, 20, 10]
 *
 * gives 35 a higher probability of selection
 * than 10.
 */
export function generateWeightedDraw(
  allScores: number[]
): number[] {
  const validScores = allScores.filter(
    (score) =>
      Number.isInteger(score) &&
      score >= MIN_DRAW_NUMBER &&
      score <= MAX_DRAW_NUMBER
  );

  // If there are no valid scores,
  // fall back to a standard random draw.
  if (validScores.length === 0) {
    return generateRandomDraw();
  }

  // Count how frequently every score occurs.
  const frequency = new Map<number, number>();

  for (const score of validScores) {
    frequency.set(
      score,
      (frequency.get(score) ?? 0) + 1
    );
  }

  const numbers = new Set<number>();

  // Select weighted numbers until we have five.
  while (numbers.size < DRAW_SIZE) {
    const candidates = [...frequency.entries()].filter(
      ([number]) => !numbers.has(number)
    );

    // No more weighted candidates.
    if (candidates.length === 0) {
      break;
    }

    const totalWeight = candidates.reduce(
      (sum, [, weight]) => sum + weight,
      0
    );

    let randomValue =
      Math.random() * totalWeight;

    for (const [number, weight] of candidates) {
      randomValue -= weight;

      if (randomValue <= 0) {
        numbers.add(number);
        break;
      }
    }
  }

  // If fewer than five unique score values exist,
  // fill the remaining slots randomly.
  while (numbers.size < DRAW_SIZE) {
    numbers.add(randomNumber());
  }

  return [...numbers].sort((a, b) => a - b);
}

// ============================================================
// DRAW GENERATOR
// ============================================================

export function generateDrawNumbers(
  mode: DrawMode,
  allScores: number[]
): number[] {
  if (mode === "weighted") {
    return generateWeightedDraw(allScores);
  }

  return generateRandomDraw();
}

// ============================================================
// MATCH CALCULATION
// ============================================================

/**
 * Returns the numbers from the user's five scores
 * that appear in the draw.
 */
export function calculateMatches(
  userScores: number[],
  drawNumbers: number[]
): number[] {
  const drawSet = new Set(drawNumbers);

  return uniqueNumbers(userScores).filter(
    (score) => drawSet.has(score)
  );
}

// ============================================================
// PRIZE POOL
// ============================================================

/**
 * Calculates the current draw's prize pool.
 *
 * Example:
 *
 * Revenue = ₹10,000
 * Prize pool percentage = 40%
 *
 * Prize pool = ₹4,000
 *
 * The previous jackpot is handled separately because
 * only the 5-match jackpot rolls over.
 */
export function calculatePrizePool(
  activeSubscriptionRevenuePaise: number
): number {
  return Math.floor(
    (activeSubscriptionRevenuePaise *
      PRIZE_POOL_PERCENT) /
      100
  );
}

// ============================================================
// PRIZE TIER POOLS
// ============================================================

/**
 * Splits the current prize pool into:
 *
 * 5-match → 40%
 * 4-match → 35%
 * 3-match → 25%
 */
export function calculateTierPools(
  prizePoolPaise: number
) {
  return {
    fiveMatch: Math.floor(
      (prizePoolPaise *
        PRIZE_SHARES[5]) /
        100
    ),

    fourMatch: Math.floor(
      (prizePoolPaise *
        PRIZE_SHARES[4]) /
        100
    ),

    threeMatch: Math.floor(
      (prizePoolPaise *
        PRIZE_SHARES[3]) /
        100
    ),
  };
}

// ============================================================
// PRIZE ALLOCATION
// ============================================================

/**
 * Allocates prize money equally among winners
 * in the same match tier.
 *
 * The previous jackpot is added ONLY to the
 * 5-match pool.
 */
export function allocatePrizes(
  winners: Array<{
    userId: string;
    matchedNumbers: number[];
    matchCount: number;
  }>,
  prizePoolPaise: number,
  jackpotRolloverPaise = 0
): DrawWinner[] {
  const basePools =
    calculateTierPools(prizePoolPaise);

  // Only the 5-match pool receives the rollover.
  const pools = {
    fiveMatch:
      basePools.fiveMatch +
      jackpotRolloverPaise,

    fourMatch:
      basePools.fourMatch,

    threeMatch:
      basePools.threeMatch,
  };

  const tier5 = winners.filter(
    (winner) => winner.matchCount === 5
  );

  const tier4 = winners.filter(
    (winner) => winner.matchCount === 4
  );

  const tier3 = winners.filter(
    (winner) => winner.matchCount === 3
  );

  function amountPerWinner(
    total: number,
    count: number
  ): number {
    if (count === 0) {
      return 0;
    }

    return Math.floor(total / count);
  }

  return winners.map((winner) => {
    // -------------------------
    // 5 MATCH
    // -------------------------
    if (winner.matchCount === 5) {
      return {
        ...winner,
        prizeTier: 5,
        prizeAmountPaise:
          amountPerWinner(
            pools.fiveMatch,
            tier5.length
          ),
      };
    }

    // -------------------------
    // 4 MATCH
    // -------------------------
    if (winner.matchCount === 4) {
      return {
        ...winner,
        prizeTier: 4,
        prizeAmountPaise:
          amountPerWinner(
            pools.fourMatch,
            tier4.length
          ),
      };
    }

    // -------------------------
    // 3 MATCH
    // -------------------------
    return {
      ...winner,
      prizeTier: 3,
      prizeAmountPaise:
        amountPerWinner(
          pools.threeMatch,
          tier3.length
        ),
    };
  });
}

// ============================================================
// FULL DRAW SIMULATION
// ============================================================

/**
 * Runs a complete draw simulation.
 *
 * Flow:
 *
 * 1. Collect subscriber scores
 * 2. Generate five draw numbers
 * 3. Calculate matches
 * 4. Calculate prize pool
 * 5. Add previous 5-match jackpot
 * 6. Identify 3/4/5 match winners
 * 7. Split prizes equally
 * 8. Return complete simulation
 */
export function simulateDraw({
  mode,
  subscribers,
  activeSubscriptionRevenuePaise,
  jackpotRolloverPaise = 0,
}: {
  mode: DrawMode;

  subscribers: Array<{
    userId: string;
    scores: number[];
  }>;

  activeSubscriptionRevenuePaise: number;

  jackpotRolloverPaise?: number;
}): DrawSimulation {
  // ----------------------------------------------------------
  // STEP 1 — Collect all subscriber scores
  // ----------------------------------------------------------

  const allScores = subscribers.flatMap(
    (subscriber) => subscriber.scores
  );

  // ----------------------------------------------------------
  // STEP 2 — Generate draw numbers
  // ----------------------------------------------------------

  const numbers = generateDrawNumbers(
    mode,
    allScores
  );

  // ----------------------------------------------------------
  // STEP 3 — Calculate user matches
  // ----------------------------------------------------------

  const rawWinners = subscribers
    .map((subscriber) => {
      const matchedNumbers =
        calculateMatches(
          subscriber.scores,
          numbers
        );

      return {
        userId: subscriber.userId,
        matchedNumbers,
        matchCount:
          matchedNumbers.length,
      };
    })
    // Only 3, 4 and 5 matches are winners.
    .filter(
      (result) => result.matchCount >= 3
    );

  // ----------------------------------------------------------
  // STEP 4 — Calculate current prize pool
  // ----------------------------------------------------------

  const prizePoolPaise =
    calculatePrizePool(
      activeSubscriptionRevenuePaise
    );

  // ----------------------------------------------------------
  // STEP 5 — Calculate current tier pools
  // ----------------------------------------------------------

  const baseTierPools =
    calculateTierPools(
      prizePoolPaise
    );

  // ----------------------------------------------------------
  // STEP 6 — Add previous jackpot to 5-match pool
  // ----------------------------------------------------------

  const fiveMatchPoolPaise =
    baseTierPools.fiveMatch +
    jackpotRolloverPaise;

  const fourMatchPoolPaise =
    baseTierPools.fourMatch;

  const threeMatchPoolPaise =
    baseTierPools.threeMatch;

  // ----------------------------------------------------------
  // STEP 7 — Allocate prizes
  // ----------------------------------------------------------

  const winners =
    allocatePrizes(
      rawWinners,
      prizePoolPaise,
      jackpotRolloverPaise
    );

  // ----------------------------------------------------------
  // STEP 8 — Return complete simulation
  // ----------------------------------------------------------

  return {
    numbers,

    eligibleUsers:
      subscribers.length,

    prizePoolPaise,

    fiveMatchPoolPaise,

    fourMatchPoolPaise,

    threeMatchPoolPaise,

    jackpotRolloverPaise,

    winners,
  };
}