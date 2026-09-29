import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterSheet,
  RulesConfig,
  SaveGamePayload,
  GamebookNode,
  AdventureHistoryEntry,
  AdventureSavePayload,
  Village,
} from './types/lv8';
import {
  DEFAULT_PRIMAL_RULES,
  createDefaultCharacter,
  DEFAULT_ECOS_SKILLS,
  DEFAULT_CUSTOM_ACTION_RULES,
} from './utils/characterDefaults';
import { DEFAULT_VILLAGES } from './utils/villageDefaults';
import { CharacterSheetEditor } from './components/CharacterSheetEditor';
import { TacticalCombat } from './components/TacticalCombat';
import { GamebookAdventure, PRESET_ADVENTURES } from './components/GamebookAdventure';
import { VillageHub } from './components/VillageHub';
import { RulesReference } from './components/RulesReference';
import { SaveManager } from './components/SaveManager';
import { DiceRollerModal } from './components/DiceRollerModal';
import { LV8Logo } from './components/LV8Logo';
import { loadAutoSave, saveAutoSave, saveToSlot } from './utils/storage';
import { MainMenu } from './components/MainMenu';
import { NewGameModal } from './components/NewGameModal';
import { LoadGameModal } from './components/LoadGameModal';
import { DeveloperMode } from './components/DeveloperMode';
import { CharacterEvolutionPanel } from './components/CharacterEvolutionPanel';
import {
  FileText,
  Swords,
  BookOpen,
  Dices,
  Save,
  Shield,
  Heart,
  Zap,
  Sparkles,
  User,
  Info,
  CheckCircle2,
  HardDrive,
  Home,
  TrendingUp,
  Sliders,
  ArrowLeft,
  WifiOff
} from 'lucide-react';

export default function App() {
  // App Mode: 'main_menu' | 'player' | 'developer'
  const [appMode, setAppMode] = useState<'main_menu' | 'player' | 'developer'>('main_menu');

  // Modals
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isLoadGameModalOpen, setIsLoadGameModalOpen] = useState(false);

  // Character & World State
  const [character, setCharacter] = useState<CharacterSheet>(createDefaultCharacter());
  const [rulesConfig, setRulesConfig] = useState<RulesConfig>(DEFAULT_PRIMAL_RULES);
  const [activeTab, setActiveTab] = useState<'sheet' | 'evolution' | 'combat' | 'gamebook' | 'village' | 'rules' | 'saves'>('sheet');
  const [pendingEncounter, setPendingEncounter] = useState<{
    id?: string;
    name: string;
    enemyType: string;
    count: number;
  } | undefined>();

  // Adventure state across tabs & saves
  const [adventureState, setAdventureState] = useState<{
    currentNode: GamebookNode;
    history: AdventureHistoryEntry[];
    locationName: string;
  }>({
    currentNode: PRESET_ADVENTURES[0].node,
    history: [],
    locationName: PRESET_ADVENTURES[0].node.title,
  });

  // Villages & NPCs state
  const [villages, setVillages] = useState<Village[]>(DEFAULT_VILLAGES);
  const [activeVillageId, setActiveVillageId] = useState<string>(DEFAULT_VILLAGES[0].id);

  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [autoSaveNotification, setAutoSaveNotification] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Standalone Dice Roller state
  const [diceModal, setDiceModal] = useState<{
    isOpen: boolean;
    dice: number;
    title: string;
    diff?: number;
    bonus?: number;
  }>({
    isOpen: false,
    dice: 5,
    title: 'Rolagem de Dados Explosivos (LV8)',
    diff: 15,
    bonus: 0,
  });

  // 1. Initial Load: Restore from LocalStorage if available
  useEffect(() => {
    const saved = loadAutoSave();
    if (saved) {
      if (saved.rulesConfig) {
        const rc = { ...saved.rulesConfig };
        if (!rc.skills || rc.skills.length < 18) {
          rc.skills = DEFAULT_ECOS_SKILLS;
        }
        if (!rc.customActionRules || rc.customActionRules.length === 0) {
          rc.customActionRules = DEFAULT_CUSTOM_ACTION_RULES;
        }
        if (!rc.derivedFormulas || rc.derivedFormulas.length < 6) {
          rc.derivedFormulas = DEFAULT_PRIMAL_RULES.derivedFormulas;
        }
        rc.attributePointsBudget = 8;
        rc.attributeMinInitial = 1;
        rc.attributeMaxInitial = 3;
        rc.skillMaxInitial = 2;
        setRulesConfig(rc);
      }
      if (saved.character) {
        const char = { ...saved.character };
        const attrs = char.attributes || {};
        char.aspects = char.aspects || [];
        char.powers = char.powers || [];
        char.inventory = char.inventory || [];
        char.conditions = char.conditions || [];
        if (char.xp === undefined) char.xp = 15;
        if (char.totalXp === undefined) char.totalXp = 15;
        if (char.spentXp === undefined) char.spentXp = 0;
        if (char.sanidadeMax === undefined) char.sanidadeMax = 10 + ((attrs.VON || 2) * 5);
        if (char.sanidadeCurrent === undefined) char.sanidadeCurrent = char.sanidadeMax;
        if (char.fadigaMax === undefined) char.fadigaMax = 10 + ((attrs.FOR || 2) * 5);
        if (char.fadigaCurrent === undefined) char.fadigaCurrent = char.fadigaMax;
        if (char.auraMax === undefined) char.auraMax = 10 + ((attrs.PRE || 1) * 5);
        if (char.auraCurrent === undefined) char.auraCurrent = char.auraMax;
        if (!char.deslocamento) char.deslocamento = (attrs.AGI || 3) * 3;
        setCharacter(char);
      }
      if (saved.gamebookState && saved.gamebookState.currentNode) {
        setAdventureState({
          currentNode: saved.gamebookState.currentNode,
          history: saved.gamebookState.history || [],
          locationName: saved.gamebookState.locationName || saved.gamebookState.currentNode.title,
        });
      }
      if (saved.villages && Array.isArray(saved.villages) && saved.villages.length > 0) {
        setVillages(saved.villages);
        setActiveVillageId(saved.activeVillageId || saved.villages[0].id);
      }
      setLastAutoSaveTime(new Date(saved.savedAt).toLocaleTimeString());
    }
  }, []);

  // 2. Debounced Auto-Save to LocalStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const payload: SaveGamePayload = {
        version: 'LV8-2.0-AutoSave',
        savedAt: new Date().toISOString(),
        character,
        rulesConfig,
        gamebookState: {
          currentNode: adventureState.currentNode,
          history: adventureState.history,
          locationName: adventureState.locationName,
        },
        villages,
        activeVillageId,
      };

      const ok = saveAutoSave(payload);
      if (ok) {
        const timeStr = new Date().toLocaleTimeString();
        setLastAutoSaveTime(timeStr);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [character, rulesConfig, adventureState, villages, activeVillageId]);

  const handleOpenDiceRoller = (dice: number, title: string, diff?: number, bonus?: number) => {
    setDiceModal({
      isOpen: true,
      dice: Math.max(1, dice),
      title,
      diff: diff ?? 15,
      bonus: bonus ?? 0,
    });
  };

  const handleStartCombatFromGamebook = (encounter: { name: string; enemyType: string; count: number }) => {
    setPendingEncounter({
      ...encounter,
      id: `enc_${Date.now()}_${encounter.enemyType}`,
    });
    setActiveTab('combat');
  };

  // Start New Game from Wizard
  const handleStartNewGame = (newCharacter: CharacterSheet) => {
    setCharacter(newCharacter);
    // Save to an initial slot
    const slotId = `slot_${Date.now()}`;
    const payload: SaveGamePayload = {
      version: 'LV8-2.0',
      savedAt: new Date().toISOString(),
      character: newCharacter,
      rulesConfig,
      gamebookState: {
        currentNode: PRESET_ADVENTURES[0].node,
        history: [],
        locationName: PRESET_ADVENTURES[0].node.title,
      },
      villages,
      activeVillageId,
    };
    saveToSlot(slotId, `${newCharacter.name} - Início da Jornada`, payload);
    setIsNewGameModalOpen(false);
    setAppMode('player');
    setActiveTab('sheet');
    setAutoSaveNotification(`Novo personagem "${newCharacter.name}" criado com sucesso!`);
    setTimeout(() => setAutoSaveNotification(null), 4000);
  };

  const handleLoadSave = (payload: SaveGamePayload) => {
    if (payload.character) {
      const char = { ...payload.character };
      const attrs = char.attributes || {};
      char.aspects = char.aspects || [];
      char.powers = char.powers || [];
      char.inventory = char.inventory || [];
      char.conditions = char.conditions || [];
      if (char.xp === undefined) char.xp = 15;
      if (char.totalXp === undefined) char.totalXp = 15;
      if (char.spentXp === undefined) char.spentXp = 0;
      if (char.sanidadeMax === undefined) char.sanidadeMax = 10 + ((attrs.VON || 2) * 5);
      if (char.sanidadeCurrent === undefined) char.sanidadeCurrent = char.sanidadeMax;
      if (char.fadigaMax === undefined) char.fadigaMax = 10 + ((attrs.FOR || 2) * 5);
      if (char.fadigaCurrent === undefined) char.fadigaCurrent = char.fadigaMax;
      if (char.auraMax === undefined) char.auraMax = 10 + ((attrs.PRE || 1) * 5);
      if (char.auraCurrent === undefined) char.auraCurrent = char.auraMax;
      if (!char.deslocamento) char.deslocamento = (attrs.AGI || 3) * 3;
      setCharacter(char);
    }
    if (payload.rulesConfig) {
      const rc = { ...payload.rulesConfig };
      if (!rc.skills || rc.skills.length === 0) rc.skills = DEFAULT_ECOS_SKILLS;
      if (!rc.customActionRules || rc.customActionRules.length === 0) rc.customActionRules = DEFAULT_CUSTOM_ACTION_RULES;
      if (!rc.derivedFormulas || rc.derivedFormulas.length === 0) rc.derivedFormulas = DEFAULT_PRIMAL_RULES.derivedFormulas;
      setRulesConfig(rc);
    }
    if (payload.gamebookState && payload.gamebookState.currentNode) {
      setAdventureState({
        currentNode: payload.gamebookState.currentNode,
        history: payload.gamebookState.history || [],
        locationName: payload.gamebookState.locationName || payload.gamebookState.currentNode.title,
      });
    }
    if (payload.villages && Array.isArray(payload.villages) && payload.villages.length > 0) {
      setVillages(payload.villages);
      setActiveVillageId(payload.activeVillageId || payload.villages[0].id);
    }
    setIsLoadGameModalOpen(false);
    setAppMode('player');
    setActiveTab('sheet');
    setAutoSaveNotification(`Jogo carregado: ${payload.character?.name || 'Personagem'}`);
    setTimeout(() => setAutoSaveNotification(null), 4000);
  };

  const handleLoadAdventureOnly = (adv: AdventureSavePayload) => {
    setAdventureState({
      currentNode: adv.currentNode,
      history: adv.history || [],
      locationName: adv.locationName || adv.currentNode.title,
    });
    setAppMode('player');
    setActiveTab('gamebook');
  };

  // --- RENDER 1: MAIN MENU ---
  if (appMode === 'main_menu') {
    return (
      <>
        <MainMenu
          hasActiveCharacter={Boolean(character.name)}
          activeCharacter={character}
          onNewGame={() => setIsNewGameModalOpen(true)}
          onLoadGame={() => setIsLoadGameModalOpen(true)}
          onOpenSettings={() => setAppMode('developer')}
          onContinue={() => setAppMode('player')}
        />

        <NewGameModal
          isOpen={isNewGameModalOpen}
          onClose={() => setIsNewGameModalOpen(false)}
          rulesConfig={rulesConfig}
          onStartGame={handleStartNewGame}
        />

        <LoadGameModal
          isOpen={isLoadGameModalOpen}
          onClose={() => setIsLoadGameModalOpen(false)}
          onLoadGame={handleLoadSave}
        />
      </>
    );
  }

  // --- RENDER 2: DEVELOPER MODE (CONFIGURAÇÕES) ---
  if (appMode === 'developer') {
    return (
      <DeveloperMode
        character={character}
        rulesConfig={rulesConfig}
        villages={villages}
        activeVillageId={activeVillageId}
        adventureState={adventureState}
        onUpdateCharacter={setCharacter}
        onUpdateRules={setRulesConfig}
        onUpdateVillages={setVillages}
        onSelectActiveVillage={setActiveVillageId}
        onUpdateAdventureState={setAdventureState}
        onSwitchToPlayerMode={() => setAppMode('player')}
        onReturnToMainMenu={() => setAppMode('main_menu')}
        onOpenDiceRoller={handleOpenDiceRoller}
      />
    );
  }

  // --- RENDER 3: PLAYER MODE (MODO JOGADOR) ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Detailed Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAppMode('main_menu')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              title="Voltar ao Menu Inicial"
            >
              <Home className="w-4 h-4" /> Menu Principal
            </button>
            <LV8Logo size="sm" variant="compact" />
          </div>

          {/* Quick Character Status Badges with XP */}
          <div className="flex items-center gap-3 bg-zinc-950/80 px-3.5 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <strong className="text-zinc-200">{character.name}</strong>
              <span className="text-zinc-500 hidden sm:inline">({character.className})</span>
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-1 text-rose-400 font-mono font-bold" title="Vida Atual / Máxima">
              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
              {character.hpCurrent}/{character.hpMax}
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-1 text-cyan-400 font-mono font-bold" title="Fluxo Atual / Máximo">
              <Zap className="w-3.5 h-3.5 fill-cyan-500/20" />
              {character.fluxoCurrent}/{character.fluxoMax}
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            {/* XP Badge */}
            <div
              onClick={() => setActiveTab('evolution')}
              className="flex items-center gap-1 text-amber-300 font-mono font-bold cursor-pointer hover:text-amber-200 transition"
              title="XP Disponível para Evolução (Clique para Abrir Painel de Evolução)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{character.xp ?? 0} XP</span>
            </div>
          </div>

          {/* Right Header: Developer Mode switch & Dice Roller */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setAppMode('developer')}
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              title="Acessar Modo Desenvolvedor / Configurações"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Modo Desenvolvedor</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenDiceRoller(5, 'Rolagem Rápida LV8', 15)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
              title="Rolar d6 explosivo com cancelamento de pífios"
            >
              <Dices className="w-4 h-4" /> Rolar d6
            </button>
          </div>
        </div>

        {/* Navigation Tabs in Player Mode */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileText className="w-4 h-4" /> Ficha &amp; Inventário Particular
          </button>

          {/* New Evolution Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('evolution')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 font-black'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-zinc-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" /> Evolução ({character.xp ?? 0} XP)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'combat'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Swords className="w-4 h-4" /> Combate Tático
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gamebook')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gamebook'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Gamebook da Dobra
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('village')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'village'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Home className="w-4 h-4" /> Vilas &amp; Missões de NPCs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Shield className="w-4 h-4" /> Manual &amp; Bestiário
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saves')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'saves'
                ? 'bg-amber-600 text-zinc-950 shadow-md shadow-amber-600/20 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Save className="w-4 h-4" /> Salvar / Exportar
          </button>
        </div>
      </header>

      {/* Auto-Save Toast Notification */}
      {autoSaveNotification && (
        <div className="max-w-7xl mx-auto px-4 pt-3 w-full">
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{autoSaveNotification}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: SHEET & INVENTORY */}
        {activeTab === 'sheet' && (
          <CharacterSheetEditor
            character={character}
            rulesConfig={rulesConfig}
            onUpdateCharacter={setCharacter}
            onUpdateRules={setRulesConfig}
            onOpenDiceRoller={handleOpenDiceRoller}
            isDevMode={false}
          />
        )}

        {/* TAB 2: EVOLUTION (XP POINT-BUY, NO LEVELS) */}
        {activeTab === 'evolution' && (
          <CharacterEvolutionPanel
            character={character}
            rulesConfig={rulesConfig}
            onUpdateCharacter={setCharacter}
          />
        )}

        {/* TAB 3: TACTICAL COMBAT */}
        {activeTab === 'combat' && (
          <TacticalCombat
            character={character}
            rulesConfig={rulesConfig}
            onUpdateCharacter={setCharacter}
            onOpenDiceRoller={handleOpenDiceRoller}
            initialEncounter={pendingEncounter}
          />
        )}

        {/* TAB 4: GAMEBOOK */}
        {activeTab === 'gamebook' && (
          <GamebookAdventure
            character={character}
            onUpdateCharacter={setCharacter}
            onStartCombat={handleStartCombatFromGamebook}
            onOpenDiceRoller={handleOpenDiceRoller}
            initialState={adventureState}
            onStateChange={setAdventureState}
          />
        )}

        {/* TAB 5: VILLAGE & NPCS */}
        {activeTab === 'village' && (
          <VillageHub
            villages={villages}
            activeVillageId={activeVillageId}
            onUpdateVillages={setVillages}
            onSelectActiveVillage={setActiveVillageId}
            character={character}
            onUpdateCharacter={setCharacter}
            onStartCombat={handleStartCombatFromGamebook}
            onOpenDiceRoller={handleOpenDiceRoller}
          />
        )}

        {/* TAB 6: RULES */}
        {activeTab === 'rules' && (
          <RulesReference
            onStartCombat={(enemyKey, count) =>
              handleStartCombatFromGamebook({
                name: `Duelo no Bestiário: ${enemyKey}`,
                enemyType: enemyKey,
                count: count,
              })
            }
          />
        )}

        {/* TAB 7: SAVES */}
        {activeTab === 'saves' && (
          <SaveManager
            character={character}
            rulesConfig={rulesConfig}
            adventureState={adventureState}
            villages={villages}
            activeVillageId={activeVillageId}
            onLoadSave={handleLoadSave}
            onLoadAdventureOnly={handleLoadAdventureOnly}
          />
        )}
      </main>

      {/* Standalone Dice Roller Modal */}
      <DiceRollerModal
        isOpen={diceModal.isOpen}
        onClose={() => setDiceModal((prev) => ({ ...prev, isOpen: false }))}
        initialDice={diceModal.dice}
        initialDifficulty={diceModal.diff}
        initialBonus={diceModal.bonus}
        title={diceModal.title}
      />

      {/* New Game Wizard Modal */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        rulesConfig={rulesConfig}
        onStartGame={handleStartNewGame}
      />

      {/* Load Game Modal */}
      <LoadGameModal
        isOpen={isLoadGameModalOpen}
        onClose={() => setIsLoadGameModalOpen(false)}
        onLoadGame={handleLoadSave}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-4 px-6 text-center text-xs text-zinc-600">
        <p>
          LV8 2.0 • Sistema Completo: Modo Jogador Offline &amp; Modo Desenvolvedor • Evolução Direta por Gasto de XP (Sem Níveis)
        </p>
      </footer>
    </div>
  );
}
