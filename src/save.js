// Persistence. Best score uses the same key as the prototype so an existing
// best carries over. Wallet values are sample data per the handoff README —
// a real economy comes later.

const BEST_KEY = 'cookie-rlanz-best';

export function getBest() {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function submitScore(score) {
  const best = getBest();
  const newBest = score > best;
  if (newBest) {
    try {
      localStorage.setItem(BEST_KEY, String(score));
    } catch {
      /* private mode etc. — best just won't persist */
    }
  }
  return { best: Math.max(best, score), newBest };
}

// Sample wallet data (README: "Wallet values ... are sample data").
export const WALLET = { fish: 12480, bone: 36 };
