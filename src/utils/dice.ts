import { DiceRollResult } from '../types/lv8';

/**
 * Rolls explosive d6 dice according to LV8 system rules:
 * - Each 6 explodes (rolls again and adds up to that die).
 * - Each 1 is a "pífio" which cancels out one highest 6.
 * - If remaining 1s exist without 6s to cancel, it results in a botch (falha brutal).
 * - Margin of success = Total - Difficulty (every +5 grants 1 extra effect).
 */
export function rollLV8Dice(
  diceCount: number,
  difficulty?: number,
  bonusFixed: number = 0,
  contextNote?: string
): DiceRollResult {
  const actualDice = Math.max(1, Math.floor(diceCount));
  const rawRolls: number[] = [];
  const explodedRolls: number[] = [];
  const dieTotals: number[] = [];

  for (let i = 0; i < actualDice; i++) {
    const firstRoll = Math.floor(Math.random() * 6) + 1;
    rawRolls.push(firstRoll);

    let currentDieTotal = firstRoll;
    let roll = firstRoll;

    // Explode on 6
    while (roll === 6) {
      const nextRoll = Math.floor(Math.random() * 6) + 1;
      explodedRolls.push(nextRoll);
      currentDieTotal += nextRoll;
      roll = nextRoll;
    }

    dieTotals.push(currentDieTotal);
  }

  // Count 1s in the first roll (pífios)
  const onesCount = rawRolls.filter((r) => r === 1).length;
  // Count how many initial 6s occurred
  const sixesCount = rawRolls.filter((r) => r === 6).length;

  let cancelledSixesCount = 0;
  let activeSixesCount = sixesCount;
  let isBotch = false;

  // Each 1 cancels a 6 (specifically cancels the explosion benefit or eliminates the top value)
  // According to rule: "Todo 1 é pífio: cancela um 6 (o 6 mais alto). Se sobrar 1 sem 6 é falha/falha brutal."
  if (onesCount > 0) {
    if (sixesCount > 0) {
      cancelledSixesCount = Math.min(onesCount, sixesCount);
      activeSixesCount = sixesCount - cancelledSixesCount;
      // If there are more 1s than 6s, it's a botch risk
      if (onesCount > sixesCount) {
        isBotch = true;
      }
    } else {
      // No 6s rolled at all, and one or more 1s rolled
      isBotch = true;
    }
  }

  // Adjust dieTotals if 1s cancel the highest 6-chains
  const adjustedTotals = [...dieTotals];
  const cancelledIndices = new Set<number>();
  if (cancelledSixesCount > 0) {
    // Reduce cancelled sixes down to 1 (cancelling explosion and value)
    for (let c = 0; c < cancelledSixesCount; c++) {
      let maxIdx = -1;
      let maxVal = -1;
      for (let i = 0; i < adjustedTotals.length; i++) {
        if (!cancelledIndices.has(i) && rawRolls[i] === 6 && adjustedTotals[i] > maxVal) {
          maxVal = adjustedTotals[i];
          maxIdx = i;
        }
      }
      if (maxIdx !== -1) {
        cancelledIndices.add(maxIdx);
        adjustedTotals[maxIdx] = 1; // cancelled by pífio
      }
    }
  }

  const rawSum = adjustedTotals.reduce((a, b) => a + b, 0);
  const total = rawSum + bonusFixed;

  let success = true;
  let marginOfSuccess: number | undefined = undefined;
  let extraEffectsCount = 0;

  if (difficulty !== undefined) {
    if (isBotch) {
      success = false;
    } else {
      success = total >= difficulty;
    }
    marginOfSuccess = total - difficulty;
    if (success && marginOfSuccess > 0) {
      extraEffectsCount = Math.floor(marginOfSuccess / 5);
    } else {
      extraEffectsCount = 0;
    }
  }

  // Build narrative breakdown
  const rawList = rawRolls.join(', ');
  const explosionsList = explodedRolls.length > 0 ? ` + Explosões [${explodedRolls.join(', ')}]` : '';
  const bonusStr = bonusFixed > 0 ? ` +${bonusFixed}` : '';
  const pifioStr = onesCount > 0 ? ` (Pífios: ${onesCount}, 6s Anulados: ${cancelledSixesCount}${isBotch ? ' - FALHA BRUTAL/PARADOXO!' : ''})` : '';

  const breakdown = `[${rawList}]${explosionsList}${bonusStr} = ${total}${pifioStr}`;

  return {
    diceCount: actualDice,
    rawRolls,
    explodedRolls,
    pifiosCount: onesCount,
    cancelledSixesCount,
    activeSixesCount,
    isBotch,
    sum: total,
    difficulty,
    marginOfSuccess,
    success,
    extraEffectsCount,
    breakdown,
  };
}

/**
 * Calculates attack damage using the LV8 formulas:
 * (FA - FD) / 2 + weaponBonus - armorReduction (Min 1 on success)
 */
export function calculateCombatDamage(
  attackFactor: number,
  defenseFactor: number,
  weaponBonus: number = 0,
  armorReduction: number = 0
): { damage: number; margin: number; isHit: boolean } {
  if (attackFactor <= defenseFactor) {
    return { damage: 0, margin: attackFactor - defenseFactor, isHit: false };
  }
  const margin = attackFactor - defenseFactor;
  const baseDamage = Math.ceil(margin / 2);
  const totalDamage = Math.max(1, baseDamage + weaponBonus - armorReduction);
  return { damage: totalDamage, margin, isHit: true };
}
