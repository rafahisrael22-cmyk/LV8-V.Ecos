import React, { useState, useEffect, useRef } from 'react';
import { Combatant, CombatLogEntry, CharacterSheet, Power, DiceRollResult, RulesConfig, CustomActionRule } from '../types/lv8';
import { rollLV8Dice, calculateCombatDamage } from '../utils/dice';
import { PREMADE_ENEMIES, DINOSAUR_BESTIARY, DEFAULT_CUSTOM_ACTION_RULES } from '../utils/characterDefaults';
import { calculateActionRule } from '../utils/rulesEngine';
import { playDiceSound, playExplosionSound, playBotchSound, playHitSound } from '../utils/audio';
import { MonsterSheetModal } from './MonsterSheetModal';
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Play,
  Bot,
  User,
  Plus,
  Minus,
  Trash2,
  Skull,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Flame,
  CheckCircle2,
  ShieldAlert,
  Dices,
  RefreshCw,
  Crosshair,
  Trophy,
  Filter,
  Download,
  Compass,
  Eye,
  FileText
} from 'lucide-react';

interface TacticalCombatProps {
  character: CharacterSheet;
  rulesConfig?: RulesConfig;
  onUpdateCharacter: (char: CharacterSheet) => void;
  onOpenDiceRoller: (dice: number, title: string, diff?: number) => void;
  initialEncounter?: { name: string; enemyType: string; count: number; id?: string };
}

const COMMON_CONDITIONS = [
  'Sangrando (-1 HP/rodada)',
  'Atordoado (Perde 1 rodada)',
  'Exausto (-2 dados)',
  'Presa Marcada (+2 dados de ataque)',
  'Chão de Ferro (-2 dados esquiva)',
  'Posição Elevada (+1d6)',
  'Asfixia Parcial (Perde ação)',
  'Garganta Travada (Perde feitiço)',
  'Frenesi (+2 dados dano)',
];

export const TacticalCombat: React.FC<TacticalCombatProps> = ({
  character,
  rulesConfig,
  onUpdateCharacter,
  onOpenDiceRoller,
  initialEncounter,
}) => {
  const [round, setRound] = useState<number>(1);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [activeCombatantIndex, setActiveCombatantIndex] = useState<number>(0);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(false);
  const [isExecutingTurn, setIsExecutingTurn] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedDinoKey, setSelectedDinoKey] = useState<string>('raptor');
  const [selectedDinoCount, setSelectedDinoCount] = useState<number>(1);
  const [activeTabAction, setActiveTabAction] = useState<'martial' | 'power' | 'defense' | 'aspects'>('martial');
  const [logFilter, setLogFilter] = useState<'all' | 'attack' | 'power' | 'botch'>('all');
  const [battleState, setBattleState] = useState<'ongoing' | 'victory' | 'defeat'>('ongoing');

  // Monster Sheet inspection modal
  const [selectedMonsterForSheet, setSelectedMonsterForSheet] = useState<Combatant | null>(null);
  const [isMonsterSheetOpen, setIsMonsterSheetOpen] = useState<boolean>(false);

  // Tactical Range & Grid State (Distância Inicial = 3d6 metros, Deslocamento = AGI × 3m)
  const [combatDistanceMeters, setCombatDistanceMeters] = useState<number>(15);
  const [initialDistanceRollBreakdown, setInitialDistanceRollBreakdown] = useState<string>('');

  const logContainerRef = useRef<HTMLDivElement>(null);
  const lastEncounterIdRef = useRef<string>('');
  const isExecutingTurnRef = useRef<boolean>(false);
  const aiTurnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    if (combatants.length === 0) {
      initializeEncounter('raptor', 2);
    }
  }, []);

  // Handle incoming initialEncounter from Gamebook without re-running on tab switches
  useEffect(() => {
    if (initialEncounter) {
      const encounterKey = initialEncounter.id || `${initialEncounter.enemyType}_${initialEncounter.count}_${initialEncounter.name}`;
      if (encounterKey !== lastEncounterIdRef.current) {
        lastEncounterIdRef.current = encounterKey;
        const normalized = normalizeEnemyKey(initialEncounter.enemyType);
        initializeEncounter(normalized, initialEncounter.count || 1, initialEncounter.name);
      }
    }
  }, [initialEncounter]);

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Check victory / defeat state
  useEffect(() => {
    if (combatants.length === 0) return;
    const playerAlive = combatants.some((c) => c.isPlayer && c.hpCurrent > 0);
    const enemiesAlive = combatants.some((c) => !c.isPlayer && c.hpCurrent > 0);

    if (!playerAlive && battleState !== 'defeat') {
      setBattleState('defeat');
    } else if (playerAlive && !enemiesAlive && battleState !== 'victory') {
      setBattleState('victory');
      const awardedXp = 15;
      const curXp = character.xp ?? 0;
      const totXp = character.totalXp ?? curXp;
      onUpdateCharacter({
        ...character,
        xp: curXp + awardedXp,
        totalXp: totXp + awardedXp,
        advancementHistory: [
          {
            id: `vic_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            title: `Vitória em Combate (+${awardedXp} XP)`,
            xpCost: -awardedXp,
            category: 'recurso',
            details: `Inimigos da Dobra derrotados na arena de combate.`,
          },
          ...(character.advancementHistory || []),
        ],
      });
      addLog('Sistema LV8', `🏆 Vitória conquistada! Seu personagem recebeu +${awardedXp} XP para investir na evolução direta.`, 'success');
    } else if (playerAlive && enemiesAlive && battleState !== 'ongoing') {
      setBattleState('ongoing');
    }
  }, [combatants]);

  const normalizeEnemyKey = (type: string): string => {
    const lower = (type || '').toLowerCase();
    if (PREMADE_ENEMIES[lower]) return lower;
    if (lower.includes('trex') || lower.includes('t-rex') || lower.includes('tiranossauro')) return 'trex';
    if (lower.includes('spino') || lower.includes('espinossauro')) return 'espinossauro';
    if (lower.includes('trike') || lower.includes('triceratops')) return 'triceratops';
    if (lower.includes('anquilo')) return 'anquilossauro';
    if (lower.includes('estego')) return 'estegossauro';
    if (lower.includes('carno')) return 'carnotauro';
    if (lower.includes('paqui')) return 'paquicefalo';
    if (lower.includes('ptero')) return 'pterodactilo';
    if (lower.includes('micro')) return 'microraptor';
    if (lower.includes('shaman') || lower.includes('xamã')) return 'shaman_goblin';
    if (lower.includes('raptor')) return 'raptor';
    return 'raptor';
  };

  const addLog = (
    source: string,
    actionText: string,
    type: CombatLogEntry['type'] = 'info',
    rollDetails?: DiceRollResult,
    damage?: number,
    target?: string
  ) => {
    const entry: CombatLogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      round,
      timestamp: new Date().toLocaleTimeString(),
      source,
      actionText,
      type,
      rollDetails,
      damage,
      target,
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Build the combatant list
  const initializeEncounter = (enemyKey: string, count: number = 1, customName?: string) => {
    const key = normalizeEnemyKey(enemyKey);

    const playerCombatant: Combatant = {
      id: character.id || 'player_1',
      name: character.name || 'Slyra',
      isPlayer: true,
      isAutoPlay: isAutoPlayEnabled,
      aiIntelligence: 'estrategica',
      className: character.className,
      race: character.race,
      avatarUrl: character.avatarUrl,
      hpMax: character.hpMax,
      hpCurrent: character.hpCurrent > 0 ? character.hpCurrent : character.hpMax,
      fluxoMax: character.fluxoMax,
      fluxoCurrent: character.fluxoCurrent > 0 ? character.fluxoCurrent : character.fluxoMax,
      defense: 10 + (character.attributes['AGI'] || 3) + (character.skills['atletismo'] || character.skills['combate'] || character.skills['armas_brancas'] || 2),
      armor: 2,
      attributes: { ...character.attributes },
      skills: { ...character.skills },
      powers: [...character.powers],
      conditions: [...character.conditions],
      initiative: 0,
      majorActionUsed: false,
      minorActionUsed: false,
      reactionUsed: false,
    };

    if (character.hpCurrent <= 0) {
      onUpdateCharacter({
        ...character,
        hpCurrent: character.hpMax,
        fluxoCurrent: character.fluxoMax,
      });
    }

    const baseEnemy = PREMADE_ENEMIES[key] || PREMADE_ENEMIES['raptor'];
    let enemies: Combatant[] = [];
    for (let i = 1; i <= count; i++) {
      enemies.push({
        ...baseEnemy,
        id: `${key}_${i}_${Date.now()}`,
        name: count === 1 ? (customName || baseEnemy.name) : `${customName || baseEnemy.name} #${i}`,
        conditions: [],
        hpCurrent: baseEnemy.hpMax,
        fluxoCurrent: baseEnemy.fluxoMax,
      });
    }

    // Roll Initiative for all combatants using official LV8 rule:
    // Base Attribute = PER (Percepção) in d6 (with explosive 6s and cancelling 1s)
    // Associated Skill = Vigilância (vigilancia), granting +3 flat bonus per skill point (Ex: PER 3 + Vigilância 3 => FA 3d6 + 9)
    const initRollLogs: string[] = [];
    const all = [playerCombatant, ...enemies].map((c) => {
      const per = c.attributes['PER'] || 3;
      const vig = c.skills?.['vigilancia'] ?? (c.skills?.['sobrevivencia'] ? Math.min(2, c.skills['sobrevivencia']) : 0);
      const vigBonus = vig * 3;
      const initRoll = rollLV8Dice(per, undefined, vigBonus, `Iniciativa (${c.name}): ${per}d6 + ${vigBonus}`);
      initRollLogs.push(`🎲 ${c.name} [PER ${per}d6 + Vig ${vig}×3 = FA ${per}d6+${vigBonus}] ➔ ${initRoll.sum} (${initRoll.breakdown})`);
      return {
        ...c,
        initiative: initRoll.sum,
      };
    });

    // Sort by initiative descending
    all.sort((a, b) => b.initiative - a.initiative);

    // Roll Initial Distance: FA de 3d6 metros (com explosões no 6 e pífios no 1)
    const distRoll = rollLV8Dice(3, undefined, 0, 'Distância Inicial do Encontro (3d6)');
    const initDist = Math.max(3, distRoll.sum);
    setCombatDistanceMeters(initDist);
    setInitialDistanceRollBreakdown(`${initDist}m (${distRoll.breakdown})`);

    setCombatants(all);
    setRound(1);
    setActiveCombatantIndex(0);
    const firstEnemy = all.find((c) => !c.isPlayer);
    setSelectedTargetId(firstEnemy?.id || '');
    setLogs([]);
    setBattleState('ongoing');

    addLog(
      'Sistema LV8',
      `📍 Encontro Tático Iniciado! Distância inicial sorteada: ${initDist} metros em 3d6 (${distRoll.breakdown}). Deslocamento do Personagem: AGI × 3 metros.`,
      'info'
    );

    // Add each combatant's initiative breakdown to the log
    initRollLogs.forEach((logText) => {
      addLog('Iniciativa LV8', logText, 'info');
    });

    addLog(
      'Sistema LV8',
      `⚔️ Ordem de iniciativa oficial: ${all.map((c) => `${c.name} (${c.initiative})`).join(' ➔ ')}`,
      'info'
    );
  };

  const activeActor = combatants[activeCombatantIndex] || combatants[0];
  const targetCombatant = combatants.find((c) => c.id === selectedTargetId) || combatants.find((c) => c.id !== activeActor?.id && c.hpCurrent > 0);

  const playerAgi = character.attributes['AGI'] || 3;
  const playerDeslocamento = character.deslocamento || (playerAgi * 3);

  // Advance towards enemy in the tactical grid
  const handleAdvanceGrid = (amount: number = playerDeslocamento) => {
    const nextDist = Math.max(0, combatDistanceMeters - amount);
    setCombatDistanceMeters(nextDist);
    playDiceSound();
    addLog(
      character.name,
      `🏃 Avança ${amount}m no grid tático (Deslocamento AGI × 3m). Distância até o oponente: ${nextDist}m ${nextDist <= 3 ? '⚔️ [Engajado em combate corpo a corpo!]' : ''}`,
      'info'
    );
  };

  // Retreat away from enemy in the tactical grid
  const handleRetreatGrid = (amount: number = playerDeslocamento) => {
    const nextDist = combatDistanceMeters + amount;
    setCombatDistanceMeters(nextDist);
    playDiceSound();
    addLog(
      character.name,
      `🏃‍♂️ Recua ${amount}m no grid tático aumentando a distância! Distância atual: ${nextDist}m.`,
      'info'
    );
  };

  // Turn management: Check if activeActor should act via AI
  useEffect(() => {
    if (!activeActor) return;
    if (battleState !== 'ongoing') return;
    if (activeActor.hpCurrent <= 0) {
      handleNextTurn();
      return;
    }
    // Auto-play for player or AI for enemies
    if (!activeActor.isPlayer || (activeActor.isPlayer && isAutoPlayEnabled)) {
      const timer = setTimeout(() => {
        executeAITurn(activeActor);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [activeCombatantIndex, isAutoPlayEnabled, round, battleState]);

  // Execute AI tactical decision
  const executeAITurn = async (actor: Combatant) => {
    if (isExecutingTurn || battleState !== 'ongoing') return;
    setIsExecutingTurn(true);

    try {
      const possibleTargets = combatants.filter(
        (c) => c.id !== actor.id && c.hpCurrent > 0 && c.isPlayer !== actor.isPlayer
      );

      if (possibleTargets.length === 0) {
        setIsExecutingTurn(false);
        return;
      }

      // Try calling server Gemini AI combat endpoint
      let aiDecision: any = null;
      try {
        const response = await fetch('/api/gemini/combat-decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor,
            targets: possibleTargets,
            isPlayerCharacter: actor.isPlayer,
            intelligenceType: actor.aiIntelligence,
          }),
        });
        if (response.ok) {
          aiDecision = await response.json();
        }
      } catch (err) {
        // Fallback to local heuristic
      }

      // If AI returned a power to cast
      const chosenTarget = possibleTargets.find((t) => t.id === aiDecision?.targetId) || possibleTargets[0];

      // Enemy moves on tactical grid towards player if out of melee range
      if (!actor.isPlayer) {
        const enemyAgi = actor.attributes['AGI'] || 3;
        const enemyDesloc = enemyAgi * 3;
        if (combatDistanceMeters > 3) {
          const nextDist = Math.max(1, combatDistanceMeters - enemyDesloc);
          setCombatDistanceMeters(nextDist);
          addLog(
            actor.name,
            `🐾 ${actor.name} avança ${enemyDesloc} metros no grid tático! Distância reduzida para ${nextDist}m ${nextDist <= 3 ? '⚔️ [Entrou em alcance corpo a corpo!]' : ''}`,
            'info'
          );
        }
      }

      if (aiDecision?.actionType === 'cast_power') {
        const power = actor.powers.find((p) => p.name === aiDecision.powerName) || actor.powers[0];
        if (power && actor.fluxoCurrent >= power.custoFluxo) {
          if (aiDecision.tacticalReasoning) {
            addLog(actor.name, `🧠 [Tática IA]: ${aiDecision.tacticalReasoning}`, 'info');
          }
          executeCastPower(actor, power, chosenTarget);
          return;
        }
      }

      // Default attack action
      if (aiDecision?.tacticalReasoning && !aiDecision.fallback) {
        addLog(actor.name, `🧠 [Tática IA]: ${aiDecision.tacticalReasoning}`, 'info');
      }
      executeAttack(actor, chosenTarget);
    } finally {
      setTimeout(() => {
        setIsExecutingTurn(false);
        handleNextTurn();
      }, 600);
    }
  };

  // Perform Attack Action
  const executeAttack = (attacker: Combatant, target: Combatant) => {
    playDiceSound();

    // Attack roll: Attribute determines d6 count, Skill gives +2 flat bonus per rank!
    const agi = attacker.attributes['AGI'] || 3;
    const forca = attacker.attributes['FOR'] || 3;
    const isRanged = Boolean(attacker.skills['pontaria'] || attacker.skills['arcos']);
    const attackAttr = isRanged ? agi : Math.max(forca, agi);

    // Range Check: Melee attacks require distance <= 3m
    if (!isRanged && combatDistanceMeters > 3) {
      addLog(
        attacker.name,
        `⚠️ Alvo fora de alcance corpo a corpo (${combatDistanceMeters}m). Use a ação 'Avançar no Grid' para fechar distância ou use armas de longo alcance (Arcos/Pontaria)!`,
        'info'
      );
      return;
    }

    const weaponSkill = isRanged
      ? (attacker.skills['pontaria'] || attacker.skills['arcos'] || 0)
      : (attacker.skills['armas_brancas'] ||
         attacker.skills['combate'] ||
         attacker.skills['briga'] ||
         attacker.skills['laminas'] ||
         0);

    // Check conditions
    let bonusAttack = 0;
    if (attacker.conditions.some((c) => c.includes('Exausto'))) bonusAttack -= 2;
    if (attacker.conditions.some((c) => c.includes('Posição Elevada'))) bonusAttack += 1;
    if (target.conditions.some((c) => c.includes('Presa Marcada'))) bonusAttack += 2;

    // Attribute converted to d6 dice
    const attackDiceCount = Math.max(1, attackAttr + bonusAttack);
    // Skill gives +2 flat bonus per rank (e.g. AGI 3 + Furtividade/Pontaria 2 = 3d6 + 4)
    const skillFlatBonus = weaponSkill * 2;

    const attackRoll = rollLV8Dice(attackDiceCount, target.defense, skillFlatBonus);

    const { damage, isHit } = calculateCombatDamage(
      attackRoll.sum,
      target.defense,
      2, // standard weapon bonus
      target.armor
    );

    if (attackRoll.isBotch) {
      playBotchSound();
      addLog(
        attacker.name,
        `💥 PÍFIO BRUTAL! ${attacker.name} cometeu uma falha crítica ao atacar ${target.name} (${attackRoll.breakdown})! Sofre 3 de dano reflexo e fica desequilibrado.`,
        'botch',
        attackRoll
      );
      applyDamage(attacker.id, 3);
      return;
    }

    if (isHit) {
      playHitSound();
      addLog(
        attacker.name,
        `⚔️ Golpeia ${target.name}! FA ${attackRoll.sum} (${attackDiceCount}d6${skillFlatBonus > 0 ? `+${skillFlatBonus}` : ''}) vs FD ${target.defense}. Causa ${damage} de dano físico! (${attackRoll.breakdown})`,
        'attack',
        attackRoll,
        damage,
        target.name
      );
      applyDamage(target.id, damage);
    } else {
      addLog(
        attacker.name,
        `🛡️ Ataque contra ${target.name} evadido/bloqueado! FA ${attackRoll.sum} (${attackDiceCount}d6${skillFlatBonus > 0 ? `+${skillFlatBonus}` : ''}) vs FD ${target.defense}.`,
        'info',
        attackRoll
      );
    }
  };

  // Perform Attack using configured CustomActionRule
  const executeCustomRuleAttack = (attacker: Combatant, target: Combatant, rule: CustomActionRule) => {
    const calc = calculateActionRule(rule, attacker);

    if (rule.fluxCost && attacker.fluxoCurrent < rule.fluxCost) {
      addLog(attacker.name, `Sem Fluxo suficiente para usar [${rule.name}]! (Requer ${rule.fluxCost})`, 'info');
      return;
    }

    if (rule.fluxCost) {
      setCombatants((prev) =>
        prev.map((c) => (c.id === attacker.id ? { ...c, fluxoCurrent: c.fluxoCurrent - (rule.fluxCost || 0) } : c))
      );
      if (attacker.isPlayer) {
        onUpdateCharacter({
          ...character,
          fluxoCurrent: Math.max(0, character.fluxoCurrent - (rule.fluxCost || 0)),
        });
      }
    }

    playDiceSound();
    const attackRoll = rollLV8Dice(calc.diceCount, target.defense, calc.flatBonus, rule.name);

    if (attackRoll.isBotch) {
      playBotchSound();
      addLog(
        attacker.name,
        `💥 PÍFIO BRUTAL! ${attacker.name} falhou criticamente usando [${rule.name}] contra ${target.name} (${attackRoll.breakdown})! Sofre 3 de dano reflexo.`,
        'botch',
        attackRoll
      );
      applyDamage(attacker.id, 3);
      return;
    }

    const { damage, isHit } = calculateCombatDamage(
      attackRoll.sum,
      target.defense,
      rule.bonusDamage ?? 2,
      target.armor
    );

    if (isHit) {
      playHitSound();
      addLog(
        attacker.name,
        `⚔️ [${rule.name}] acerta ${target.name}! FA ${attackRoll.sum} (${calc.formulaLabel}) vs FD ${target.defense}. Causa ${damage} de dano! (${attackRoll.breakdown})`,
        'attack',
        attackRoll,
        damage,
        target.name
      );
      applyDamage(target.id, damage);
    } else {
      addLog(
        attacker.name,
        `🛡️ [${rule.name}] contra ${target.name} bloqueado/evadido! FA ${attackRoll.sum} (${calc.formulaLabel}) vs FD ${target.defense}.`,
        'info',
        attackRoll
      );
    }
  };

  // Perform Power Casting Action
  const executeCastPower = (caster: Combatant, power: Power, target: Combatant) => {
    if (caster.fluxoCurrent < power.custoFluxo) {
      addLog(caster.name, `Sem Fluxo suficiente para canalizar ${power.name}!`, 'info');
      return;
    }

    // Deduct Fluxo
    setCombatants((prev) =>
      prev.map((c) => (c.id === caster.id ? { ...c, fluxoCurrent: c.fluxoCurrent - power.custoFluxo } : c))
    );

    if (caster.isPlayer) {
      onUpdateCharacter({
        ...character,
        fluxoCurrent: Math.max(0, character.fluxoCurrent - power.custoFluxo),
      });
    }

    playDiceSound();
    const essOrIns = caster.attributes['INS'] || caster.attributes['ESS'] || 3;
    const canalizacao = caster.skills['ritual'] || caster.skills['percepcao_fluxo'] || 2;
    const roll = rollLV8Dice(essOrIns, power.dificuldade, canalizacao * 2);

    if (roll.isBotch) {
      playBotchSound();
      addLog(
        caster.name,
        `🔮 PARADOXO / PÍFIO DE FLUXO! A Dobra retalia contra ${caster.name} ao conjurar ${power.name}! Sofre 4 de dano de colapso do Véu.`,
        'botch',
        roll
      );
      applyDamage(caster.id, 4);
      return;
    }

    if (roll.success) {
      playExplosionSound();
      const extraDmg = (power.escala || 2) * 3 + (roll.extraEffectsCount || 0) * 3;
      addLog(
        caster.name,
        `✨ Canaliza com maestria: [${power.name}] (Escala ${power.escala}, Custo ${power.custoFluxo} Fluxo)! MS +${roll.marginOfSuccess}. ${power.descricao} Impacto de ${extraDmg} em ${target.name}.`,
        'power',
        roll,
        extraDmg,
        target.name
      );
      applyDamage(target.id, extraDmg);
    } else {
      addLog(
        caster.name,
        `Falha ao canalizar [${power.name}]. Resultado ${roll.sum} vs Dif ${power.dificuldade}. O Fluxo se dissipa.`,
        'info',
        roll
      );
    }
  };

  // Apply damage to combatant
  const applyDamage = (combatantId: string, amount: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          const nextHp = Math.max(0, c.hpCurrent - amount);
          if (nextHp === 0 && c.hpCurrent > 0) {
            addLog(c.name, `☠️ ${c.name} caiu inconsciente / mortalmente ferido!`, 'death');
          }
          return { ...c, hpCurrent: nextHp };
        }
        return c;
      })
    );

    // Sync character if player took damage
    if (combatantId === character.id) {
      onUpdateCharacter({
        ...character,
        hpCurrent: Math.max(0, character.hpCurrent - amount),
      });
    }
  };

  // Direct manual adjustment (+ / -) for referee / GM mode
  const handleAdjustStat = (combatantId: string, stat: 'hp' | 'fluxo', delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          if (stat === 'hp') {
            const nextHp = Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta));
            return { ...c, hpCurrent: nextHp };
          } else {
            const nextFlux = Math.max(0, Math.min(c.fluxoMax, c.fluxoCurrent + delta));
            return { ...c, fluxoCurrent: nextFlux };
          }
        }
        return c;
      })
    );

    if (combatantId === character.id) {
      if (stat === 'hp') {
        onUpdateCharacter({
          ...character,
          hpCurrent: Math.max(0, Math.min(character.hpMax, character.hpCurrent + delta)),
        });
      } else {
        onUpdateCharacter({
          ...character,
          fluxoCurrent: Math.max(0, Math.min(character.fluxoMax, character.fluxoCurrent + delta)),
        });
      }
    }
  };

  // Add condition to target
  const handleAddCondition = (targetId: string, condition: string) => {
    if (!condition.trim()) return;
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === targetId && !c.conditions.includes(condition)) {
          return { ...c, conditions: [...c.conditions, condition] };
        }
        return c;
      })
    );
    addLog('Condição', `Aplicada condição [${condition}] ao alvo.`, 'info');
  };

  // Remove condition
  const handleRemoveCondition = (combatantId: string, condition: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          return { ...c, conditions: c.conditions.filter((cond) => cond !== condition) };
        }
        return c;
      })
    );
  };

  // Advance turn
  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    const nextIdx = (activeCombatantIndex + 1) % combatants.length;
    if (nextIdx === 0) {
      setRound((r) => r + 1);
      addLog('Sistema', `━━ Início da Rodada ${round + 1} ━━`, 'info');
    }
    setActiveCombatantIndex(nextIdx);

    // Auto-select a valid alive target if current target is dead or invalid
    const nextActor = combatants[nextIdx];
    if (nextActor) {
      const opposingAlive = combatants.find(
        (c) => c.isPlayer !== nextActor.isPlayer && c.hpCurrent > 0
      );
      if (opposingAlive) {
        setSelectedTargetId(opposingAlive.id);
      }
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'attack') return log.type === 'attack';
    if (logFilter === 'power') return log.type === 'power';
    if (logFilter === 'botch') return log.type === 'botch';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Arena Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Title & Round */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                  Arena de Combate Tático Brutal
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 font-mono text-xs font-bold border border-rose-800/60">
                  Rodada {round}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Iniciativa por d6 explosivo • FA vs FD • Auras de Predador e IA Tática.
              </p>
            </div>
          </div>

          {/* Controls: Reset, AutoPlay, Spawn */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Play Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isAutoPlayEnabled
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
              title="IA controla as ações do seu personagem automaticamente"
            >
              <Bot className="w-4 h-4" />
              <span>Auto-Play IA: {isAutoPlayEnabled ? 'ATIVO' : 'OFF'}</span>
            </button>

            {/* Reset Battle */}
            <button
              type="button"
              onClick={() => initializeEncounter(selectedDinoKey, selectedDinoCount)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
              title="Reiniciar arena de combate"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>

            {/* Dinosaur / Enemy Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <select
                value={selectedDinoKey}
                onChange={(e) => setSelectedDinoKey(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none max-w-[200px]"
                title="Selecione um predador dinossauro ou inimigo"
              >
                <optgroup label="Bestiário: Dinossauros da Dobra">
                  <option value="microraptor">Microraptor Emboscador (Pequeno)</option>
                  <option value="raptor">Raptor da Matilha (Médio)</option>
                  <option value="pterodactilo">Pterodáctilo Carniceiro (Médio)</option>
                  <option value="paquicefalo">Paquicefalossauro Aríete (Médio)</option>
                  <option value="carnotauro">Carnotauro Sombrio do Véu (Grande)</option>
                  <option value="estegossauro">Estegossauro das Fendas (Grande)</option>
                  <option value="triceratops">Triceratops Ancião (Grande)</option>
                  <option value="anquilossauro">Anquilossauro Casca-de-Ferro (Grande)</option>
                  <option value="espinossauro">Espinossauro dos Pântanos (Colossal)</option>
                  <option value="trex">T-Rex Alfa das Dobras (Apex Devorador)</option>
                </optgroup>
                <optgroup label="Outros Inimigos">
                  <option value="shaman_goblin">Xamã da Dobra Corrompida</option>
                </optgroup>
              </select>

              <select
                value={selectedDinoCount}
                onChange={(e) => setSelectedDinoCount(parseInt(e.target.value) || 1)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono outline-none"
                title="Quantidade de inimigos"
              >
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
                <option value="5">5x</option>
              </select>

              <button
                type="button"
                onClick={() => initializeEncounter(selectedDinoKey, selectedDinoCount)}
                className="px-3 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg shadow transition active:scale-95 flex items-center gap-1 text-xs"
              >
                Lançar
              </button>

              <button
                type="button"
                onClick={() => {
                  const enemyToView = PREMADE_ENEMIES[selectedDinoKey] || PREMADE_ENEMIES['raptor'];
                  setSelectedMonsterForSheet(enemyToView);
                  setIsMonsterSheetOpen(true);
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="Ver planilha oficial e atributos completos deste monstro"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Planilha</span>
              </button>
            </div>
          </div>
        </div>

        {/* Initiative Track Ribbon */}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ordem de Iniciativa
            </span>
            <span className="text-[10px] text-zinc-500">
              Turno {activeCombatantIndex + 1} de {combatants.length}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {combatants.map((c, idx) => {
              const isActive = idx === activeCombatantIndex;
              const isDead = c.hpCurrent <= 0;
              const isTarget = c.id === selectedTargetId;

              return (
                <div
                  key={c.id}
                  onClick={() => !c.isPlayer && setSelectedTargetId(c.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 shrink-0 cursor-pointer transition ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40 shadow-lg'
                      : isTarget
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  } ${isDead ? 'opacity-35 line-through' : ''}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-amber-400 animate-ping' : c.isPlayer ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold whitespace-nowrap">{c.name}</span>
                  <span className="font-mono text-[10px] text-zinc-500">({c.initiative})</span>
                  {isTarget && !c.isPlayer && (
                    <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Grid & Range Track */}
        <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Grid de Combate Tático &amp; Distância
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                (Sorteio 3d6: {initialDistanceRollBreakdown || `${combatDistanceMeters}m`})
              </span>
            </div>

            {/* Range State Badge */}
            <div className="flex items-center gap-2">
              {combatDistanceMeters <= 3 ? (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
                  ⚔️ ALCANCE CORPO A CORPO (≤3m ENGAJADOS)
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
                  🏹 DISTÂNCIA TÁTICA ({combatDistanceMeters} METROS)
                </span>
              )}
            </div>
          </div>

          {/* Visual Range Field / Track */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <User className="w-3.5 h-3.5" />
                <span>{character.name} (Posição 0m)</span>
                <span className="text-[10px] text-zinc-500">
                  • Deslocamento: {playerDeslocamento}m (AGI×3)
                </span>
              </div>

              <div className="text-center font-bold text-amber-300">
                Distância: {combatDistanceMeters} metros
              </div>

              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span>Inimigos ({combatDistanceMeters}m)</span>
                <Swords className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Grid Track Progress Bar with Range Zones */}
            <div className="relative w-full h-4 bg-zinc-900 rounded-full border border-zinc-800 flex items-center overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-[12%] bg-emerald-500/30 border-r border-emerald-500/50"
                title="Zona de Corpo a Corpo (≤ 3 metros)"
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-rose-500/40 transition-all duration-300"
                style={{ width: `${Math.max(10, Math.min(100, (combatDistanceMeters / 30) * 100))}%` }}
              />
            </div>

            {/* Tactical Movement Controls for Player */}
            {activeActor?.isPlayer && !isAutoPlayEnabled && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-900 text-xs">
                <span className="text-zinc-400 text-[11px]">
                  Movimento Tático (Deslocamento AGI {playerAgi} × 3 = {playerDeslocamento}m):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdvanceGrid(playerDeslocamento)}
                    disabled={combatDistanceMeters <= 0}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow"
                    title={`Avançar ${playerDeslocamento}m em direção aos inimigos`}
                  >
                    🏃 Avançar ({playerDeslocamento}m)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRetreatGrid(playerDeslocamento)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1 border border-zinc-700"
                    title={`Recuar ${playerDeslocamento}m para longe dos inimigos`}
                  >
                    🏃‍♂️ Recuar ({playerDeslocamento}m)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Battle Status Banner (Victory / Defeat) */}
      {battleState === 'victory' && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-600 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3 text-emerald-300">
            <Trophy className="w-7 h-7 text-emerald-400" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">Vitória Brutal na Dobra!</h4>
              <p className="text-xs text-emerald-400/80">
                Todos os predadores foram subjugados. O Fluxo ancestral se acalma ao redor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => initializeEncounter('raptor', 2)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase rounded-xl transition"
          >
            Novo Combate
          </button>
        </div>
      )}

      {battleState === 'defeat' && (
        <div className="p-4 bg-gradient-to-r from-red-950/80 to-zinc-900 border border-red-600 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3 text-red-300">
            <Skull className="w-7 h-7 text-red-400" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">Derrota Brutal!</h4>
              <p className="text-xs text-red-400/80">
                Seu personagem tombou ferido. O Véu se fecha sobre suas pálpebras...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleAdjustStat(character.id, 'hp', character.hpMax);
              initializeEncounter('raptor', 1);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl transition"
          >
            Reviver e Recomeçar
          </button>
        </div>
      )}

      {/* Main Combat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Combatants Cards & Actions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combatants.map((actor, idx) => {
              const isActive = idx === activeCombatantIndex;
              const isDead = actor.hpCurrent <= 0;
              const isSelectedTarget = actor.id === selectedTargetId;

              return (
                <div
                  key={actor.id}
                  onClick={() => !actor.isPlayer && setSelectedTargetId(actor.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/50'
                      : isSelectedTarget
                        ? 'bg-zinc-900/90 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                  } ${isDead ? 'opacity-40 grayscale' : ''}`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isActive ? 'bg-amber-400 animate-ping' : isDead ? 'bg-zinc-600' : 'bg-emerald-500'
                        }`}
                      />
                      <strong className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        {actor.name}
                        {actor.isPlayer && (
                          <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 text-[10px] rounded font-mono border border-emerald-800/40">
                            Você
                          </span>
                        )}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {isSelectedTarget && !actor.isPlayer && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                          <Crosshair className="w-3 h-3" /> Alvo
                        </span>
                      )}
                      <span className="text-zinc-500">Inic:</span>
                      <strong className="text-amber-400">{actor.initiative}</strong>
                    </div>
                  </div>

                  {/* Species & Class details */}
                  <div className="flex items-center justify-between gap-2 mb-3 text-xs text-zinc-400">
                    <span className="truncate">
                      {actor.race} • {actor.className}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 shrink-0">
                      IA: {actor.aiIntelligence}
                    </span>
                  </div>

                  {/* Health Bar + Direct Referee Adjusters */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-rose-500/20" /> Vida
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStat(actor.id, 'hp', -1);
                          }}
                          className="w-4 h-4 rounded bg-zinc-800 hover:bg-red-800 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                          title="-1 HP"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-zinc-200">
                          {actor.hpCurrent} / {actor.hpMax}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStat(actor.id, 'hp', 1);
                          }}
                          className="w-4 h-4 rounded bg-zinc-800 hover:bg-emerald-800 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                          title="+1 HP"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          actor.hpCurrent / actor.hpMax < 0.3
                            ? 'bg-red-600'
                            : actor.hpCurrent / actor.hpMax < 0.6
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (actor.hpCurrent / actor.hpMax) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Fluxo Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-cyan-500/20" /> Fluxo
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStat(actor.id, 'fluxo', -1);
                          }}
                          className="w-4 h-4 rounded bg-zinc-800 hover:bg-cyan-800 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                          title="-1 Fluxo"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-zinc-200">
                          {actor.fluxoCurrent} / {actor.fluxoMax}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustStat(actor.id, 'fluxo', 1);
                          }}
                          className="w-4 h-4 rounded bg-zinc-800 hover:bg-cyan-800 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                          title="+1 Fluxo"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (actor.fluxoCurrent / actor.fluxoMax) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Defense & Armor */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded-xl border border-zinc-800 mb-2">
                    <span>
                      Defesa (FD): <strong className="text-zinc-200 font-mono">{actor.defense}</strong>
                    </span>
                    <span>
                      Armadura: <strong className="text-amber-400 font-mono">-{actor.armor} dano</strong>
                    </span>
                  </div>

                  {/* Predator Aura */}
                  {actor.statusAura && (
                    <div className="text-[10px] p-1.5 bg-red-950/40 border border-red-800/40 text-red-300 rounded-lg flex items-center gap-1 mb-2">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{actor.statusAura}</span>
                    </div>
                  )}

                  {/* Conditions Badges */}
                  <div className="flex flex-wrap gap-1">
                    {actor.conditions.map((cond, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-950/70 text-red-300 border border-red-800/60 rounded-full text-[10px] font-semibold flex items-center gap-1"
                      >
                        {cond}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCondition(actor.id, cond);
                          }}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {actor.conditions.length === 0 && (
                      <span className="text-[10px] text-zinc-600">Sem condições</span>
                    )}
                  </div>

                  {/* Monster Sheet Inspection Button */}
                  {!actor.isPlayer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMonsterForSheet(actor);
                        setIsMonsterSheetOpen(true);
                      }}
                      className="w-full mt-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 hover:border-rose-600/60 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      title="Abrir planilha completa oficial com atributos, defesas e perícias"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>Ver Planilha da Criatura</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Command Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                  <span>Turno Ativo:</span>
                  <span className="text-amber-400 font-bold">{activeActor?.name}</span>
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-zinc-400">
                    Alvo Marcado: <strong className="text-rose-400">{targetCombatant?.name || 'Nenhum'}</strong>
                  </p>
                  {targetCombatant && !targetCombatant.isPlayer && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonsterForSheet(targetCombatant);
                        setIsMonsterSheetOpen(true);
                      }}
                      className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-rose-300 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                      title="Ver planilha do alvo"
                    >
                      <Eye className="w-3 h-3" /> Ficha do Alvo
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextTurn}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md"
              >
                Passar Turno <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons if Manual Player Turn */}
            {activeActor?.isPlayer && !isAutoPlayEnabled ? (
              <div className="space-y-4">
                {/* Sub-Tabs for Action Categories */}
                <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTabAction('martial')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTabAction === 'martial'
                        ? 'bg-rose-500 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" /> Ataques Marciais
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTabAction('power')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTabAction === 'power'
                        ? 'bg-cyan-500 text-zinc-950'
                        : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Poderes de Fluxo
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTabAction('defense')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTabAction === 'defense'
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Defesa &amp; Reação
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTabAction('aspects')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTabAction === 'aspects'
                        ? 'bg-purple-500 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Aspectos &amp; Condições
                  </button>
                </div>

                {/* Tab 1: Martial Attacks */}
                {activeTabAction === 'martial' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-zinc-400">
                        Selecione a manobra configurada nas regras do personagem:
                      </p>
                      <span className="text-[11px] text-amber-400/90 font-mono">
                        {(rulesConfig?.customActionRules || DEFAULT_CUSTOM_ACTION_RULES).filter((r) => r.type === 'attack').length} manobras de ataque
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(rulesConfig?.customActionRules || DEFAULT_CUSTOM_ACTION_RULES)
                        .filter((r) => r.type === 'attack')
                        .map((rule) => {
                          const calc = calculateActionRule(rule, activeActor);
                          return (
                            <button
                              key={rule.id}
                              type="button"
                              onClick={() => targetCombatant && executeCustomRuleAttack(activeActor, targetCombatant, rule)}
                              disabled={!targetCombatant || targetCombatant.hpCurrent <= 0}
                              className="p-3 bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 hover:border-red-500/60 disabled:opacity-40 text-left rounded-xl transition flex items-center justify-between group shadow-sm"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <strong className="text-xs font-bold text-zinc-100 group-hover:text-red-400 transition truncate">
                                    {rule.name}
                                  </strong>
                                  <span className="font-mono font-black text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
                                    FA = {calc.formulaLabel}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 block line-clamp-1 mt-0.5" title={rule.description || calc.breakdownSummary}>
                                  {rule.description || calc.breakdownSummary}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                {rule.bonusDamage ? (
                                  <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/60 px-1 py-0.5 rounded">
                                    +{rule.bonusDamage}
                                  </span>
                                ) : null}
                                <Swords className="w-4 h-4 text-red-400 group-hover:scale-110 transition" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Flux Powers */}
                {activeTabAction === 'power' && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Canalize a energia ancestral do Fluxo. Custos são descontados da sua reserva.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeActor.powers.map((p) => {
                        const canAfford = activeActor.fluxoCurrent >= p.custoFluxo;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={!canAfford || !targetCombatant}
                            onClick={() => targetCombatant && executeCastPower(activeActor, p, targetCombatant)}
                            className="p-3 bg-zinc-950 hover:bg-zinc-800/80 disabled:opacity-40 border border-zinc-800 hover:border-cyan-500/50 rounded-xl text-left transition flex items-center justify-between group"
                          >
                            <div>
                              <strong className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition block">
                                {p.name}
                              </strong>
                              <span className="text-[10px] text-zinc-400 line-clamp-1">{p.descricao}</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-cyan-400 shrink-0 ml-2">
                              {p.custoFluxo} Fluxo
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Defense & Reactions */}
                {activeTabAction === 'defense' && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Rolagens de reação para esquiva total, bloqueio com escudo ou recuperação rápida.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenDiceRoller(
                            (activeActor.attributes['AGI'] || 3) + (activeActor.skills['atletismo'] || 2),
                            'Esquiva Defensiva (Reação)',
                            12
                          )
                        }
                        className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-zinc-700"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" /> Esquivar (AGI + Atletismo)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdjustStat(activeActor.id, 'hp', 4)}
                        className="p-3 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-emerald-800/60"
                      >
                        <Heart className="w-4 h-4 text-emerald-400" /> Usar Elixir (+4 HP)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdjustStat(activeActor.id, 'fluxo', 5)}
                        className="p-3 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-cyan-800/60"
                      >
                        <Zap className="w-4 h-4 text-cyan-400" /> Meditar (+5 Fluxo)
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 4: Aspects & Conditions */}
                {activeTabAction === 'aspects' && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Crie vantagens táticas ou imponha penalidades graves aos combatentes.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          targetCombatant && handleAddCondition(targetCombatant.id, 'Chão de Ferro (-2 dados esquiva)')
                        }
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-4 h-4" /> Chão de Ferro
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          targetCombatant && handleAddCondition(targetCombatant.id, 'Presa Marcada (+2 dados de ataque)')
                        }
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <Crosshair className="w-4 h-4" /> Marcar Presa
                      </button>

                      <select
                        onChange={(e) => {
                          if (e.target.value && targetCombatant) {
                            handleAddCondition(targetCombatant.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none"
                      >
                        <option value="">Aplicar outra condição ao alvo...</option>
                        {COMMON_CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* AI Turn Notification */
              <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 text-center space-y-2">
                <Bot className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                <p className="text-xs text-zinc-300 font-medium">
                  {activeActor?.isPlayer
                    ? '🤖 IA está calculando jogada no modo Auto-Play...'
                    : `🤖 Inimigo [${activeActor?.name}] analisando tática brutal (${activeActor?.aiIntelligence})...`}
                </p>
                <button
                  type="button"
                  onClick={() => executeAITurn(activeActor)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl"
                >
                  Executar Turno Imediatamente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Visceral Combat Log */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" /> Relatório Tático
            </h4>

            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  logFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('attack')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  logFilter === 'attack' ? 'bg-red-950 text-red-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Golpes
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('power')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  logFilter === 'power' ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Magias
              </button>
            </div>
          </div>

          <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredLogs.map((log) => {
              const isCrit = log.type === 'botch';
              const isDeath = log.type === 'death';
              const isPower = log.type === 'power';

              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs leading-relaxed transition ${
                    isCrit
                      ? 'bg-red-950/60 border-red-800/80 text-red-200'
                      : isDeath
                        ? 'bg-zinc-950 border-red-700 text-red-400 font-bold'
                        : isPower
                          ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                    <span className="font-bold text-zinc-400">{log.source}</span>
                    <span className="font-mono">{log.timestamp}</span>
                  </div>
                  <p>{log.actionText}</p>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-xs">
                Nenhum evento registrado com o filtro selecionado.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Regra: Dano = (FA - FD) ÷ 2 + Arma - Armadura</span>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="hover:text-red-400 transition"
              title="Limpar log"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Monster Sheet Full Modal */}
      <MonsterSheetModal
        isOpen={isMonsterSheetOpen}
        onClose={() => setIsMonsterSheetOpen(false)}
        monster={selectedMonsterForSheet}
        onOpenDiceRoller={(dice, title, diff, bonus) =>
          onOpenDiceRoller(dice, title, diff)
        }
      />
    </div>
  );
};
