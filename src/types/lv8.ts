export type SystemVariant = 'primal_furry' | 'ecos_da_dobra' | 'custom';

export interface AttributeConfig {
  key: string;
  name: string;
  description: string;
  initialMin: number;
  initialMax: number;
  legendaryMax: number;
  defaultValue: number;
}

export interface DerivedFormulaConfig {
  key: string;
  name: string;
  formula: string; // e.g. "10 + (VIG * 5)"
  attributeDependency: string[];
  description: string;
  isCustom?: boolean;
}

export interface SkillConfig {
  id: string;
  name: string;
  primaryAttribute: string;
  description: string;
  isCustom?: boolean;
}

export interface CustomActionRule {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'power' | 'utility';
  primaryAttribute: string; // e.g. 'FOR', 'AGI', 'INT', 'none'
  attributeFormat: 'd6' | 'decimal' | 'none'; // d6 in dice or flat decimal bonus
  skillId?: string; // id of skill or 'none'
  skillFormat: 'd6' | 'decimal_x1' | 'decimal_x2' | 'none'; // d6 dice, +skill, +(skill*2), or none
  extraDice?: number; // +/- d6 extra
  extraFlatBonus?: number; // +/- flat decimal
  bonusDamage?: number;
  fluxCost?: number;
  description: string;
  isCustom?: boolean;
}

export interface RulesConfig {
  systemVariant: SystemVariant;
  attributePointsBudget: number; // 8 free points to distribute
  attributeMinInitial: number; // 1 (every attribute starts with 1 free point, cannot be zeroed)
  attributeMaxInitial: number; // 3 (cannot exceed 3 during character creation)
  attributeMaxLegendary: number; // 10
  skillPointsBudget: number; // calculated dynamically as 10 + (INT * 2)
  skillMaxInitial: number; // 2 (cannot exceed 2 during character creation)
  skillMaxLegendary: number; // 10
  attributes: AttributeConfig[];
  skills: SkillConfig[];
  derivedFormulas: DerivedFormulaConfig[];
  customActionRules?: CustomActionRule[];
}


export interface Power {
  id: string;
  name: string;
  source: 'classe' | 'raca' | 'ritual' | 'aspecto';
  escala: number; // 1 to 5
  duracao: 'Instantâneo' | 'Sustentado' | 'Cena' | '1 dia' | 'Permanente';
  dificuldade: number;
  custoFluxo: number;
  descricao: string;
  efeitoMS?: string; // Margem de Sucesso +5 bonus
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'arma' | 'armadura' | 'item' | 'butim';
  bonusDamage?: number;
  armorReduction?: number;
  weight?: number;
  description: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  player: string;
  gender: string;
  race: string;
  raceEco: string;
  className: string;
  classFluxo: string;
  avatarUrl: string;
  notes: string;
  
  // Dynamic attribute values: FOR, AGI, VIG, INT, VON, PRE, INS / ESS, PER, etc.
  attributes: Record<string, number>;
  
  // Dynamic skills values (0 to 10)
  skills: Record<string, number>;
  
  // Calculated & tracked pools
  hpMax: number;
  hpCurrent: number;
  fluxoMax: number;
  fluxoCurrent: number;
  sanidadeMax?: number;
  sanidadeCurrent?: number;
  fadigaMax?: number;
  fadigaCurrent?: number;
  auraMax?: number;
  auraCurrent?: number;
  deslocamento: number;

  // Aspects (Fate Core inspired)
  concept: string; // Conceito Principal
  trouble: string; // Problema
  aspects: string[]; // Aspectos adicionais (up to 3)

  // Powers & Paths
  primaryPath: string; // Caminho Primário (+1 dado)
  secondaryPath: string; // Caminho Secundário
  powers: Power[];

  // Inventory & Conditions
  inventory: InventoryItem[];
  conditions: string[]; // Ex: 'Exausto', 'Sangrando', 'Atordoado', 'Presa Marcada'

  // XP & Evolution System (Point-Buy, No Levels)
  xp: number; // Unspent XP available to spend on attributes, skills, powers, pools
  totalXp: number; // Lifetime total XP earned across the adventure
  spentXp: number; // Total XP spent on advancements
  advancementHistory?: {
    id: string;
    timestamp: string;
    title: string;
    xpCost: number;
    category: 'atributo' | 'pericia' | 'poder' | 'recurso' | 'aspecto';
    details?: string;
  }[];
}

export interface DiceRollResult {
  diceCount: number;
  rawRolls: number[];
  explodedRolls: number[]; // extra dice rolled on 6
  pifiosCount: number; // number of 1s
  cancelledSixesCount: number;
  activeSixesCount: number;
  isBotch: boolean; // Falha brutal when remaining 1s without 6
  sum: number;
  difficulty?: number;
  marginOfSuccess?: number;
  success: boolean;
  extraEffectsCount?: number; // (MS / 5)
  breakdown: string;
}

export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  isAutoPlay: boolean; // Player character controlled by AI
  aiIntelligence: 'selvagem' | 'estrategica' | 'defensiva' | 'emboscador';
  avatarUrl?: string; // Bestiary image
  tokenUrl?: string; // Tactical grid token image
  tokenEmoji?: string; // Emotion / Emoji token (e.g. 🦖, 🦅, 🐊)
  className?: string;
  race?: string;
  hpMax: number;
  hpCurrent: number;
  fluxoMax: number;
  fluxoCurrent: number;
  defense: number;
  armor: number; // Reduces damage (e.g. Couro 1, Placas 4, Dinos 6-10)
  attributes: Record<string, number>;
  skills: Record<string, number>;
  powers: Power[];
  conditions: string[];
  initiative: number;
  majorActionUsed: boolean;
  minorActionUsed: boolean;
  reactionUsed: boolean;
  statusAura?: string; // e.g. "Aura de Silêncio Primal (-2 dados)"
  dangerLevel?: 'Perigoso' | 'Ameaça Maior' | 'Catástrofe Viva' | 'Devorador Apex';
  tactics?: string;
  size?: 'Pequeno' | 'Médio' | 'Grande' | 'Colossal' | 'Apex Titânico';
  loot?: string;
  isCustom?: boolean;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  timestamp: string;
  source: string;
  target?: string;
  actionText: string;
  rollDetails?: DiceRollResult;
  damage?: number;
  type: 'info' | 'attack' | 'power' | 'damage' | 'death' | 'botch' | 'success';
}

export interface GamebookChoice {
  id: string;
  text: string;
  testRequired: boolean;
  attribute?: string;
  skill?: string;
  difficulty?: number;
  difficultyLabel?: string;
  fluxCost?: number;
  successOutcome?: string;
  failureOutcome?: string;
  isCombatTrigger?: boolean;
  enemyEncounter?: {
    name: string;
    enemyType: string;
    count: number;
  };
}

export interface GamebookNode {
  id: string;
  title: string;
  narrative: string;
  dangerLevel: 'Baixo' | 'Médio' | 'Alto' | 'Extremo';
  environmentalEffect?: string;
  choices: GamebookChoice[];
  illustration?: string;
}

export interface AdventureHistoryEntry {
  title: string;
  chosenText: string;
  outcome?: string;
  rollSummary?: string;
  timestamp?: string;
}

export interface AdventureSavePayload {
  version: string;
  adventureTitle: string;
  savedAt: string;
  locationName: string;
  currentNode: GamebookNode;
  history: AdventureHistoryEntry[];
  characterSnapshot: {
    name: string;
    className: string;
    race: string;
    hpCurrent: number;
    hpMax: number;
    fluxoCurrent: number;
    fluxoMax: number;
  };
  notes?: string;
}

export interface SaveSlotMeta {
  slotId: string;
  name: string;
  savedAt: string;
  characterName: string;
  characterClass: string;
  characterRace?: string;
  currentScene: string;
  hpSummary?: string;
  fluxoSummary?: string;
  xpSummary?: string;
  inventoryCount?: number;
  inventoryPreview?: string[];
  avatarUrl?: string;
  isAutoSave?: boolean;
}

export interface NPCQuestReward {
  xp?: number;
  fluxReward?: number;
  item?: {
    name: string;
    type: 'arma' | 'armadura' | 'item' | 'butim';
    bonusDamage?: number;
    armorReduction?: number;
    description: string;
  };
  reputationBonus?: number;
  narrativeReward?: string;
}

export interface NPCQuestStep {
  id: string;
  description: string;
  testRequired?: boolean;
  attribute?: string;
  skill?: string;
  difficulty?: number;
  combatTrigger?: {
    enemyName: string;
    enemyType: string;
    count: number;
  };
  completed?: boolean;
}

export interface NPCQuest {
  id: string;
  title: string;
  giverNpcId: string;
  giverNpcName: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Heroico' | 'Brutal';
  summary: string;
  briefingDialogue: string;
  completionDialogue: string;
  targetLocation: string;
  steps: NPCQuestStep[];
  reward: NPCQuestReward;
  status: 'disponivel' | 'ativa' | 'concluida' | 'falha';
  isCustom?: boolean;
}

export interface VillageNPC {
  id: string;
  name: string;
  role: string;
  race: string;
  eco: string;
  affinity: 'neutro' | 'aliado' | 'amigavel' | 'hostil' | 'reverente';
  dialogueGreeting: string;
  lore: string;
  locationInVillage: string;
  avatarIcon?: string;
  quests: NPCQuest[];
}

export interface VillageFacility {
  id: string;
  name: string;
  type: 'forja' | 'santuario' | 'mercado' | 'defesa' | 'alojamento' | 'curral_dinos';
  level: number;
  description: string;
}

export interface Village {
  id: string;
  name: string;
  biome: string;
  description: string;
  defenseLevel: number;
  prosperity: number;
  dangerZone: string;
  facilities: VillageFacility[];
  npcs: VillageNPC[];
  notes?: string;
}

export interface SaveGamePayload {
  version: string;
  savedAt: string;
  character: CharacterSheet;
  rulesConfig: RulesConfig;
  gamebookState: {
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  };
  combatState?: {
    round: number;
    combatants: Combatant[];
    logs: CombatLogEntry[];
  };
  villages?: Village[];
  activeVillageId?: string;
  customBestiary?: Record<string, Combatant>;
}


