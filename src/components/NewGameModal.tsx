import React, { useState } from 'react';
import {
  CharacterSheet,
  RulesConfig,
  InventoryItem,
  Power,
  DiceRollResult
} from '../types/lv8';
import { evaluateFormula } from '../utils/characterDefaults';
import { rollLV8Dice } from '../utils/dice';
import { playDiceSound, playExplosionSound, playBotchSound } from '../utils/audio';
import {
  User,
  Shield,
  Heart,
  Zap,
  Swords,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Compass,
  Briefcase,
  AlertCircle,
  Dices
} from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  rulesConfig: RulesConfig;
  onStartGame: (newCharacter: CharacterSheet) => void;
}

const BESTIAL_RACES = [
  { id: 'felino', name: 'Povo Felino', trait: '+1 em Agilidade, Reflexos Rápidos e Visão no Escuro', eco: 'Eco da Sombra' },
  { id: 'lupino', name: 'Povo Lupino', trait: '+1 em Percepção/Vontade, Faro Ancestral e Táticas de Matilha', eco: 'Eco da Maré' },
  { id: 'sauriano', name: 'Povo Sauriano', trait: '+1 em Resistência/Vigor, Escamas Duras e Sangue Frio', eco: 'Eco da Rocha' },
  { id: 'ursino', name: 'Povo Ursino', trait: '+1 em Força, Constituição Maciça e Fúria Primal', eco: 'Eco da Rocha' },
  { id: 'corvideo', name: 'Povo Corvídeo/Rapina', trait: '+1 em Inteligência, Memória Ancestral e Olhar Agudo', eco: 'Eco da Tempestade' },
  { id: 'vulquino', name: 'Povo Vulquino', trait: '+1 em Presença, Sagacidade Social e Passo Leve', eco: 'Eco da Chama' },
  { id: 'quelonio', name: 'Povo Quelônio', trait: '+1 em Resistência, Carapaça Defensiva e Paciência Cósmica', eco: 'Eco do Vazio' },
];

const ARCHETYPES = [
  { id: 'guerreiro', name: 'Guerreiro da Fenda', flux: 'Fluxo de Sangue', desc: 'Mestre em armas de corte e impacto corporal na linha de frente.', weapon: 'Espada de Ferro Antigo', armor: 'Couro de Caçador' },
  { id: 'rastreador', name: 'Rastreador da Dobra', flux: 'Fluxo da Selva', desc: 'Especialista em sobrevivência, arcos e percepção de anomalias.', weapon: 'Arco de Caçador Primal', armor: 'Túnica Reforçada' },
  { id: 'moldador', name: 'Moldador de Fluxo', flux: 'Fluxo Cósmico', desc: 'Canalizador capaz de dobrar energia arcana e alterar a realidade.', weapon: 'Bastão Canalizador de Seiva', armor: 'Túnica de Linho Rúnico' },
  { id: 'guardiao', name: 'Guardião de Sangue', flux: 'Fluxo da Rocha', desc: 'Muralha viva que suporta ferimentos titânicos para proteger os seus.', weapon: 'Machado de Batalha Pesado', armor: 'Peitoral de Escamas' },
  { id: 'ladino', name: 'Ladino Silencioso', flux: 'Fluxo da Sombra', desc: 'Especialista em emboscadas, venenos e infiltrações sutis.', weapon: 'Adaga de Garra Curva', armor: 'Couro Flexível de Caçador' },
];

export function NewGameModal({
  isOpen,
  onClose,
  rulesConfig,
  onStartGame,
}: NewGameModalProps) {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState('Kael Garra-Branca');
  const [selectedRace, setSelectedRace] = useState(BESTIAL_RACES[0]);
  const [selectedArchetype, setSelectedArchetype] = useState(ARCHETYPES[0]);
  const [concept, setConcept] = useState('Caçador de Anomalias em busca de redenção ancestral');
  const [trouble, setTrouble] = useState('Perseguido pelos sussurros sombrios da Dobra');

  // Attribute Distribution
  // Default: each starts with 1, budget = 8 points
  const initialAttrs: Record<string, number> = {};
  rulesConfig.attributes.forEach((attr) => {
    initialAttrs[attr.key] = 1;
  });
  // Distribute 8 points reasonably for the preset
  initialAttrs['FOR'] = 2;
  initialAttrs['AGI'] = 2;
  initialAttrs['VIG'] = (initialAttrs['VIG'] || 1) + 1;
  initialAttrs['INT'] = 2;
  initialAttrs['VON'] = 2;
  initialAttrs['PRE'] = (initialAttrs['PRE'] || 1) + 1;

  const [attributes, setAttributes] = useState<Record<string, number>>(initialAttrs);

  // Skill Distribution: budget is 10 + (INT * 2)
  const [skills, setSkills] = useState<Record<string, number>>({
    combate: 2,
    armas_brancas: 2,
    sobrevivencia: 2,
    atletismo: 1,
    furtividade: 1,
    vontade: 1,
    medicina: 1,
  });

  // Rolled 3d6 Starting XP State
  const [rolledStartingXp, setRolledStartingXp] = useState<number>(15);
  const [xpRollResult, setXpRollResult] = useState<DiceRollResult | null>(null);
  const [isRollingXp, setIsRollingXp] = useState<boolean>(false);

  const handleRollStartingXp = () => {
    setIsRollingXp(true);
    playDiceSound();
    setTimeout(() => {
      const roll = rollLV8Dice(3, undefined, 0, 'XP Inicial Ancestral (3d6)');
      setRolledStartingXp(roll.sum);
      setXpRollResult(roll);
      setIsRollingXp(false);
      if (roll.explodedRolls.length > 0) playExplosionSound();
      if (roll.isBotch) playBotchSound();
    }, 400);
  };

  if (!isOpen) return null;

  // Calculation of Points
  const totalBasePoints = rulesConfig.attributes.reduce((sum, a) => sum + (attributes[a.key] || 1), 0);
  const minRequiredPoints = rulesConfig.attributes.length * 1;
  const spentAttrPoints = totalBasePoints - minRequiredPoints;
  const attrBudget = rulesConfig.attributePointsBudget || 8;
  const remainingAttrPoints = attrBudget - spentAttrPoints;

  const intScore = attributes['INT'] || 1;
  const skillBudget = 10 + (intScore * 2);
  const spentSkillPoints = Object.values(skills).reduce((a, b) => a + b, 0);
  const remainingSkillPoints = skillBudget - spentSkillPoints;

  const handleAttrChange = (key: string, delta: number) => {
    const current = attributes[key] || 1;
    const next = current + delta;
    if (next < 1) return;
    if (next > 3) return; // max initial creation is 3
    if (delta > 0 && remainingAttrPoints <= 0) return;
    setAttributes({ ...attributes, [key]: next });
  };

  const handleSkillChange = (skillId: string, delta: number) => {
    const current = skills[skillId] || 0;
    const next = current + delta;
    if (next < 0) return;
    if (next > 2) return; // max initial creation is 2
    if (delta > 0 && remainingSkillPoints <= 0) return;
    setSkills({ ...skills, [skillId]: next });
  };

  const handleFinishCreation = () => {
    // Calculate pools
    const hp = evaluateFormula('10 + (VIG * 5)', attributes);
    const fluxo = evaluateFormula('10 + (ESS * 5)', attributes);
    const desloc = evaluateFormula('AGI * 3', attributes);

    // Initial particular inventory based on archetype
    const starterInventory: InventoryItem[] = [
      {
        id: `inv_wep_${Date.now()}`,
        name: selectedArchetype.weapon,
        type: 'arma',
        bonusDamage: 2,
        weight: 2,
        description: 'Arma inicial bem equilibrada forjada com materiais da vila.',
      },
      {
        id: `inv_arm_${Date.now()}`,
        name: selectedArchetype.armor,
        type: 'armadura',
        armorReduction: 2,
        weight: 3,
        description: 'Proteção pessoal que amortece golpes sem travar os movimentos.',
      },
      {
        id: `inv_herb_${Date.now()}`,
        name: 'Frasco de Seiva Restauradora',
        type: 'item',
        weight: 0.5,
        description: 'Infusão curativa que restaura 1d6 de Vida.',
      },
      {
        id: `inv_torch_${Date.now()}`,
        name: 'Tochas de Seiva da Dobra (x2)',
        type: 'item',
        weight: 1,
        description: 'Ilumina cavernas e afasta predadores titânicos.',
      },
    ];

    const starterPower: Power = {
      id: `pwr_start_${Date.now()}`,
      name: `Instinto de ${selectedRace.name}`,
      source: 'raca',
      escala: 1,
      duracao: 'Cena',
      dificuldade: 10,
      custoFluxo: 5,
      descricao: `${selectedRace.trait}. Concede +2 dados em testes associados durante 1 cena.`,
    };

    const newChar: CharacterSheet = {
      id: `char_${Date.now()}`,
      name: name.trim() || 'Aventureiro Primal',
      player: 'Jogador',
      gender: 'Não especificado',
      race: selectedRace.name,
      raceEco: selectedRace.eco,
      className: selectedArchetype.name,
      classFluxo: selectedArchetype.flux,
      avatarUrl: '',
      notes: `Herói pertencente ao ${selectedRace.name}. Iniciou a jornada focado em enfrentar as fendas da Dobra.`,
      attributes,
      skills,
      hpMax: hp,
      hpCurrent: hp,
      fluxoMax: fluxo,
      fluxoCurrent: fluxo,
      sanidadeMax: evaluateFormula('10 + (VON * 5)', attributes),
      sanidadeCurrent: evaluateFormula('10 + (VON * 5)', attributes),
      fadigaMax: evaluateFormula('10 + (FOR * 5)', attributes),
      fadigaCurrent: evaluateFormula('10 + (FOR * 5)', attributes),
      auraMax: evaluateFormula('10 + (PRE * 5)', attributes),
      auraCurrent: evaluateFormula('10 + (PRE * 5)', attributes),
      deslocamento: desloc,
      concept,
      trouble,
      aspects: [`Eco de ${selectedRace.name}`, selectedArchetype.name, 'Sobrevivente da Dobra'],
      primaryPath: 'Sobrevivência',
      secondaryPath: 'Combate',
      powers: [starterPower],
      inventory: starterInventory,
      conditions: [],
      // Starting XP determined by 3d6 roll (explosive LV8)
      xp: rolledStartingXp,
      totalXp: rolledStartingXp,
      spentXp: 0,
      advancementHistory: [
        {
          id: `adv_start_${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          title: 'Criação do Personagem & Despertar',
          xpCost: 0,
          category: 'recurso',
          details: `Personagem gerado no Criador Inicial com ${rolledStartingXp} XP determinados por rolagem de 3d6${xpRollResult ? ` (${xpRollResult.breakdown})` : ''}.`,
        },
      ],
    };

    onStartGame(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs">
              PASSO {step} / 4
            </span>
            <div>
              <h2 className="text-base font-black text-amber-400">NOVO JOGO • CRIAÇÃO DE PERSONAGEM</h2>
              <p className="text-xs text-zinc-400">Crie seu herói bestial para explorar o mundo de Ecos da Dobra</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 font-bold text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: IDENTIDADE & ARQUÉTIPO */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nome do Personagem:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Slyra Garra-Negra"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Conceito Principal (Aspecto):</label>
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Ex: Ladina Felina caçadora de anomalias"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Race Selection */}
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
                  Escolha o Povo / Raça Bestial:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BESTIAL_RACES.map((race) => (
                    <button
                      type="button"
                      key={race.id}
                      onClick={() => setSelectedRace(race)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedRace.id === race.id
                          ? 'bg-amber-500/10 border-amber-500 text-zinc-100 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-200">{race.name}</div>
                      <div className="text-[11px] text-amber-400/80 font-mono">{race.eco}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">{race.trait}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Archetype Selection */}
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
                  Escolha o Arquétipo / Vocação:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ARCHETYPES.map((arch) => (
                    <button
                      type="button"
                      key={arch.id}
                      onClick={() => setSelectedArchetype(arch)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedArchetype.id === arch.id
                          ? 'bg-amber-500/10 border-amber-500 text-zinc-100 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-200">{arch.name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">{arch.flux}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">{arch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Problema / Fraqueza Cósmica:</label>
                <input
                  type="text"
                  value={trouble}
                  onChange={(e) => setTrouble(e.target.value)}
                  placeholder="Ex: Odor atrai predadores titânicos da Dobra"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: DISTRIBUIÇÃO DE ATRIBUTOS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950/80 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Distribuição de Atributos Base</h3>
                  <p className="text-xs text-zinc-400">
                    Todos os atributos iniciam em 1 (mínimo). Distribua os 8 pontos livres (máx 3 inicial).
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400 uppercase font-mono">Pontos Restantes</div>
                  <div className={`text-2xl font-black font-mono ${remainingAttrPoints === 0 ? 'text-emerald-400' : remainingAttrPoints < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {remainingAttrPoints}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rulesConfig.attributes.map((attr) => {
                  const val = attributes[attr.key] || 1;
                  return (
                    <div
                      key={attr.key}
                      className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400 uppercase">{attr.key}</span>
                          <span className="text-xs font-bold text-zinc-200">{attr.name}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{attr.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAttrChange(attr.key, -1)}
                          disabled={val <= 1}
                          className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-200 font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-black text-amber-300 text-base">
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAttrChange(attr.key, 1)}
                          disabled={val >= 3 || remainingAttrPoints <= 0}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 rounded-lg text-zinc-950 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DISTRIBUIÇÃO DE PERÍCIAS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950/80 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Distribuição das 18 Perícias Oficiais</h3>
                  <p className="text-xs text-zinc-400">
                    Orçamento: 10 + (INT × 2) = {skillBudget} pontos. Máximo inicial 2 por perícia.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400 uppercase font-mono">Pontos Restantes</div>
                  <div className={`text-2xl font-black font-mono ${remainingSkillPoints === 0 ? 'text-emerald-400' : remainingSkillPoints < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {remainingSkillPoints}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[45vh] overflow-y-auto pr-1">
                {rulesConfig.skills.map((sk) => {
                  const rank = skills[sk.id] || 0;
                  return (
                    <div
                      key={sk.id}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-200 truncate">{sk.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{sk.primaryAttribute}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSkillChange(sk.id, -1)}
                          disabled={rank <= 0}
                          className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded text-xs font-bold text-zinc-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-amber-300 text-xs">
                          {rank}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSkillChange(sk.id, 1)}
                          disabled={rank >= 2 || remainingSkillPoints <= 0}
                          className="w-6 h-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 rounded text-xs font-bold text-zinc-950"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: RESUMO & INICIAR JORNADA */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl">
                <h3 className="text-base font-black text-amber-400">{name}</h3>
                <p className="text-xs text-zinc-300 font-semibold mt-0.5">
                  {selectedRace.name} • {selectedArchetype.name} ({selectedArchetype.flux})
                </p>
                <p className="text-xs text-zinc-400 italic mt-1">"{concept}"</p>
              </div>

              {/* Stats & Pools Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-zinc-950 border border-rose-900/40 rounded-xl">
                  <div className="text-[10px] text-rose-400 uppercase font-bold">Vida (HP)</div>
                  <div className="text-lg font-black font-mono text-zinc-100">
                    {evaluateFormula('10 + (VIG * 5)', attributes)}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-cyan-900/40 rounded-xl">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">Fluxo</div>
                  <div className="text-lg font-black font-mono text-zinc-100">
                    {evaluateFormula('10 + (ESS * 5)', attributes)}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-purple-900/40 rounded-xl">
                  <div className="text-[10px] text-purple-400 uppercase font-bold">Sanidade</div>
                  <div className="text-lg font-black font-mono text-zinc-100">
                    {evaluateFormula('10 + (VON * 5)', attributes)}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-amber-900/40 rounded-xl">
                  <div className="text-[10px] text-amber-400 uppercase font-bold">XP Inicial (3d6)</div>
                  <div className="text-lg font-black font-mono text-amber-300">{rolledStartingXp} XP</div>
                </div>
              </div>

              {/* ROLAGEM DE XP INICIAL (3d6 EXPLOSIVO) */}
              <div className="p-4 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-amber-300">Determinar XP Inicial (FA de 3d6)</h4>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Role 3d6 com as regras do LV8 (6 explode em novos dados; 1 anula 6s ou causa pífio).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRollStartingXp}
                    disabled={isRollingXp}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
                  >
                    <Dices className={`w-4 h-4 ${isRollingXp ? 'animate-spin' : ''}`} />
                    <span>{xpRollResult ? 'Rolar Novamente (3d6)' : 'Rolar 3d6 de XP'}</span>
                  </button>
                </div>

                {xpRollResult && (
                  <div className="p-3 bg-zinc-950/90 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-amber-400 font-bold">Resultado da Rolagem: {xpRollResult.breakdown}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Dados Rolados: [{xpRollResult.rawRolls.join(', ')}]
                        {xpRollResult.explodedRolls.length > 0 && ` + Explosões 6: [${xpRollResult.explodedRolls.join(', ')}]`}
                        {xpRollResult.pifiosCount > 0 && ` | Pífios 1: ${xpRollResult.pifiosCount}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">XP Inicial Obtido</span>
                      <div className="text-2xl font-black font-mono text-amber-300">{rolledStartingXp} XP</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Starter Equipment & Loot */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> Inventário Particular Inicial:
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                  <li><strong>Arma:</strong> {selectedArchetype.weapon} (Dano +2)</li>
                  <li><strong>Armadura:</strong> {selectedArchetype.armor} (Absorção 2)</li>
                  <li><strong>Consumível:</strong> Frasco de Seiva Restauradora (Cura 1d6)</li>
                  <li><strong>Suprimentos:</strong> Tochas de Seiva da Dobra (x2)</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Tudo pronto! Seu personagem iniciará na primeira vila, com acesso às missões, NPCs e aventuras criadas no Modo Desenvolvedor.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center gap-1"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishCreation}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Iniciar Aventura no Modo Jogador
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
