import { CustomActionRule, CharacterSheet, Combatant, DiceRollResult } from '../types/lv8';
import { rollLV8Dice, calculateCombatDamage } from './dice';

export interface ActionRuleCalculation {
  diceCount: number;
  flatBonus: number;
  formulaLabel: string;
  breakdownSummary: string;
  primaryAttrVal: number;
  skillVal: number;
}

/**
 * Calculates the exact dice pool and decimal flat bonus for an actor using a CustomActionRule.
 *
 * Examples:
 * - AGI 3 (d6) + Pontaria 2 (decimal_x2 = +4) => 3d6 + 4
 * - FOR 2 (d6) + Escudo 2 (d6) => 4d6
 * - FOR 3 (d6) + Combate 2 (decimal_x1 = +2) + Arma 2 (flat = +2) => 3d6 + 4
 */
export function calculateActionRule(
  rule: CustomActionRule,
  actor: { attributes: Record<string, number>; skills: Record<string, number> }
): ActionRuleCalculation {
  let dice = 0;
  let flat = 0;
  const parts: string[] = [];

  // 1. Primary Attribute contribution
  const primaryKey = rule.primaryAttribute;
  let primaryAttrVal = 0;
  if (primaryKey && primaryKey !== 'none') {
    primaryAttrVal = actor.attributes[primaryKey] ?? 1;
    if (rule.attributeFormat === 'd6') {
      dice += primaryAttrVal;
      parts.push(`${primaryKey} ${primaryAttrVal}d6`);
    } else if (rule.attributeFormat === 'decimal') {
      flat += primaryAttrVal;
      parts.push(`+${primaryKey} (${primaryAttrVal >= 0 ? '+' : ''}${primaryAttrVal})`);
    }
  }

  // 2. Linked Skill contribution
  const skillKey = rule.skillId;
  let skillVal = 0;
  if (skillKey && skillKey !== 'none') {
    skillVal = actor.skills[skillKey] ?? 0;
    if (rule.skillFormat === 'd6') {
      dice += skillVal;
      parts.push(`${skillKey} ${skillVal}d6`);
    } else if (rule.skillFormat === 'decimal_x1') {
      flat += skillVal;
      parts.push(`+${skillKey} (${skillVal >= 0 ? '+' : ''}${skillVal})`);
    } else if (rule.skillFormat === 'decimal_x2') {
      const doubled = skillVal * 2;
      flat += doubled;
      parts.push(`+${skillKey}×2 (${doubled >= 0 ? '+' : ''}${doubled})`);
    }
  }

  // 3. Extra d6 modifier
  if (rule.extraDice) {
    dice += rule.extraDice;
    parts.push(`${rule.extraDice > 0 ? '+' : ''}${rule.extraDice}d6 extra`);
  }

  // 4. Extra Flat decimal modifier
  if (rule.extraFlatBonus) {
    flat += rule.extraFlatBonus;
    parts.push(`${rule.extraFlatBonus > 0 ? '+' : ''}${rule.extraFlatBonus} bônus fixo`);
  }

  const safeDice = Math.max(1, Math.floor(dice));

  // Compose clean FA formula string
  let formulaLabel = `${safeDice}d6`;
  if (flat > 0) {
    formulaLabel += ` + ${flat}`;
  } else if (flat < 0) {
    formulaLabel += ` - ${Math.abs(flat)}`;
  }

  return {
    diceCount: safeDice,
    flatBonus: flat,
    formulaLabel,
    breakdownSummary: parts.join(' | ') || `${safeDice}d6`,
    primaryAttrVal,
    skillVal,
  };
}

/**
 * Executes a custom action rule test (e.g. attack vs FD or skill test vs difficulty)
 */
export function executeRuleRoll(
  rule: CustomActionRule,
  actor: { attributes: Record<string, number>; skills: Record<string, number> },
  difficultyOrFD?: number
): {
  rollResult: DiceRollResult;
  calculation: ActionRuleCalculation;
  damage?: number;
  isHit?: boolean;
} {
  const calc = calculateActionRule(rule, actor);
  const roll = rollLV8Dice(calc.diceCount, difficultyOrFD, calc.flatBonus, rule.name);

  if (rule.type === 'attack' && difficultyOrFD !== undefined) {
    const dmgResult = calculateCombatDamage(
      roll.sum,
      difficultyOrFD,
      rule.bonusDamage || 2,
      0 // target armor handled in caller if needed
    );
    return {
      rollResult: roll,
      calculation: calc,
      damage: dmgResult.damage,
      isHit: dmgResult.isHit,
    };
  }

  return {
    rollResult: roll,
    calculation: calc,
  };
}
