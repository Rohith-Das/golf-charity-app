// lib/drawEngine.js
// ============================================================
// DRAW ENGINE — Core logic for Golf Charity Platform
// ============================================================

export const PRIZE_POOL_DEFAULT = 10000
export const PRIZE_SPLIT = { match5: 0.4, match4: 0.35, match3: 0.25 }
export const DRAW_SIZE = 5      // 5 numbers per draw
export const NUMBER_RANGE = 45  // 1–45 (mirrors Stableford max score)

/**
 * Generate random winning numbers (1–45, no repeats)
 */
export function generateRandomNumbers(count = DRAW_SIZE, max = NUMBER_RANGE) {
  const pool = Array.from({ length: max }, (_, i) => i + 1)
  const result = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result.sort((a, b) => a - b)
}

/**
 * Generate weighted numbers based on user score frequency distribution.
 * Scores that appear MORE frequently among users are LESS likely to be drawn
 * (to reduce shared wins and increase excitement).
 * @param {number[]} allUserScores - flat array of all active user scores
 */
export function generateWeightedNumbers(allUserScores, count = DRAW_SIZE, max = NUMBER_RANGE) {
  // Count frequency of each score value
  const freq = {}
  for (const s of allUserScores) {
    freq[s] = (freq[s] || 0) + 1
  }

  // Build inverse-weight pool: rare scores get higher weight
  const maxFreq = Math.max(...Object.values(freq), 1)
  const weights = []
  for (let n = 1; n <= max; n++) {
    const f = freq[n] || 0
    // Inverse frequency: common scores have lower weight
    weights.push({ n, w: maxFreq - f + 1 })
  }

  // Weighted random selection
  const result = []
  const pool = [...weights]
  for (let i = 0; i < count; i++) {
    const totalWeight = pool.reduce((s, x) => s + x.w, 0)
    let rand = Math.random() * totalWeight
    let chosen = null
    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].w
      if (rand <= 0) {
        chosen = pool.splice(j, 1)[0]
        break
      }
    }
    if (chosen) result.push(chosen.n)
  }
  return result.sort((a, b) => a - b)
}

/**
 * Count how many numbers in entryNums match winningNums
 */
export function countMatches(entryNums, winningNums) {
  return entryNums.filter(n => winningNums.includes(n)).length
}

/**
 * Calculate prize breakdown for a given prize pool + jackpot
 * @param {number} prizePool - total pool
 * @param {number} jackpotRollover - accumulated jackpot from previous draws
 * @param {{ match5: number, match4: number, match3: number }} winnerCounts
 */
export function calculatePrizes(prizePool, jackpotRollover = 0, winnerCounts) {
  const match5Pool = prizePool * 0.4 + jackpotRollover;
  const match4Pool = prizePool * 0.35;
  const match3Pool = prizePool * 0.25;

  return {
    match5: {
      pool: match5Pool,
      count: winnerCounts.match5,
      perWinner: winnerCounts.match5 > 0 ? 
        +(match5Pool / winnerCounts.match5).toFixed(2) : 0,
    },
    match4: {
      pool: match4Pool,
      count: winnerCounts.match4,
      perWinner: winnerCounts.match4 > 0 ? 
        +(match4Pool / winnerCounts.match4).toFixed(2) : 0,
    },
    match3: {
      pool: match3Pool,
      count: winnerCounts.match3,
      perWinner: winnerCounts.match3 > 0 ? 
        +(match3Pool / winnerCounts.match3).toFixed(2) : 0,
    },
    rollover: winnerCounts.match5 === 0 ? match5Pool : 0,
  };
}

/**
 * Simulate a draw against a set of entries (frontend preview)
 * @param {number[]} winningNums
 * @param {Array<{ user_id: string, entry_numbers: number[] }>} entries
 * @param {number} prizePool
 * @param {number} jackpot
 */
export function simulateDraw(winningNums, entries, prizePool = PRIZE_POOL_DEFAULT, jackpot = 0) {
  const results = entries.map(e => {
    const matches = countMatches(e.entry_numbers, winningNums)
    const tier = matches >= 5 ? 'match5' : matches === 4 ? 'match4' : matches === 3 ? 'match3' : null
    return { ...e, matches, tier, isWinner: !!tier }
  })

  const winnerCounts = {
    match5: results.filter(r => r.tier === 'match5').length,
    match4: results.filter(r => r.tier === 'match4').length,
    match3: results.filter(r => r.tier === 'match3').length,
  }

  const prizes = calculatePrizes(prizePool, jackpot, winnerCounts)

  // Attach prize amount to each winner
  const withPrizes = results.map(r => ({
    ...r,
    prizeAmount: r.tier ? prizes[r.tier]?.perWinner || 0 : 0,
  }))

  return {
    winningNumbers: winningNums,
    entries: withPrizes,
    prizes,
    totalWinners: winnerCounts.match5 + winnerCounts.match4 + winnerCounts.match3,
    jackpotRolls: winnerCounts.match5 === 0,
  }
}

/**
 * Get prize tier label
 */
export function getTierLabel(tier) {
  return { match5: '5-Match Jackpot', match4: '4-Match', match3: '3-Match' }[tier] || ''
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

/**
 * Get month label for a draw (e.g. "April 2026")
 */
export function getCurrentMonthYear() {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}